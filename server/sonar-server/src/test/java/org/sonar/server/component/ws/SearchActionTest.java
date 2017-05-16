/*
 * SonarQube
 * Copyright (C) 2009-2017 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
package org.sonar.server.component.ws;

import com.google.common.base.Joiner;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.sonar.api.resources.Language;
import org.sonar.api.resources.Languages;
import org.sonar.api.server.ws.WebService;
import org.sonar.api.utils.System2;
import org.sonar.api.web.UserRole;
import org.sonar.db.DbTester;
import org.sonar.db.component.ComponentDto;
import org.sonar.db.component.ComponentTesting;
import org.sonar.db.component.ResourceTypesRule;
import org.sonar.db.organization.OrganizationDto;
import org.sonar.db.user.UserDto;
import org.sonar.server.i18n.I18nRule;
import org.sonar.server.organization.TestDefaultOrganizationProvider;
import org.sonar.server.tester.UserSessionRule;
import org.sonar.server.ws.TestRequest;
import org.sonar.server.ws.WsActionTester;
import org.sonarqube.ws.MediaTypes;
import org.sonarqube.ws.WsComponents.SearchWsResponse;
import org.sonarqube.ws.client.component.SearchWsRequest;

import static java.util.Collections.singletonList;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.sonar.api.resources.Qualifiers.DIRECTORY;
import static org.sonar.api.resources.Qualifiers.FILE;
import static org.sonar.api.resources.Qualifiers.MODULE;
import static org.sonar.api.resources.Qualifiers.PROJECT;
import static org.sonar.api.server.ws.WebService.Param.PAGE;
import static org.sonar.api.server.ws.WebService.Param.PAGE_SIZE;
import static org.sonar.api.server.ws.WebService.Param.TEXT_QUERY;
import static org.sonar.core.util.Protobuf.setNullable;
import static org.sonar.db.component.ComponentTesting.newDirectory;
import static org.sonar.db.component.ComponentTesting.newFileDto;
import static org.sonar.db.component.ComponentTesting.newModuleDto;
import static org.sonar.db.component.ComponentTesting.newPrivateProjectDto;
import static org.sonar.db.component.ComponentTesting.newView;
import static org.sonar.test.JsonAssert.assertJson;
import static org.sonarqube.ws.WsComponents.Component;
import static org.sonarqube.ws.client.component.ComponentsWsParameters.PARAM_LANGUAGE;
import static org.sonarqube.ws.client.component.ComponentsWsParameters.PARAM_ORGANIZATION;
import static org.sonarqube.ws.client.component.ComponentsWsParameters.PARAM_QUALIFIERS;

public class SearchActionTest {
  @Rule
  public ExpectedException expectedException = ExpectedException.none();
  @Rule
  public UserSessionRule userSession = UserSessionRule.standalone();
  @Rule
  public DbTester db = DbTester.create(System2.INSTANCE);

  private I18nRule i18n = new I18nRule();

  private TestDefaultOrganizationProvider defaultOrganizationProvider = TestDefaultOrganizationProvider.from(db);
  private ResourceTypesRule resourceTypes = new ResourceTypesRule();
  private Languages languages = mock(Languages.class);
  private UserDto user;

  private WsActionTester ws;

  @Before
  public void setUp() {
    resourceTypes.setAllQualifiers(PROJECT, MODULE, DIRECTORY, FILE);
    when(languages.all()).thenReturn(javaLanguage());
    ws = new WsActionTester(new SearchAction(db.getDbClient(), resourceTypes, i18n, userSession, languages, defaultOrganizationProvider));

    user = db.users().insertUser("john");
    userSession.logIn(user);
  }

  @Test
  public void verify_definition() {
    WebService.Action action = ws.getDef();

    assertThat(action.since()).isEqualTo("6.3");
    assertThat(action.isPost()).isFalse();
    assertThat(action.isInternal()).isFalse();
    assertThat(action.responseExampleAsString()).isNotEmpty();

    assertThat(action.params()).hasSize(6);

    WebService.Param qualifiers = action.param("qualifiers");
    assertThat(qualifiers.isRequired()).isTrue();

    WebService.Param organization = action.param("organization");
    assertThat(organization.isRequired()).isFalse();
    assertThat(organization.description()).isEqualTo("Organization key");
    assertThat(organization.isInternal()).isTrue();
    assertThat(organization.exampleValue()).isEqualTo("my-org");
    assertThat(organization.since()).isEqualTo("6.3");
  }

  @Test
  public void search_by_key_query() throws IOException {
    insertProjectsAuthorizedForUser(
      ComponentTesting.newPrivateProjectDto(db.getDefaultOrganization()).setKey("project-_%-key"),
      ComponentTesting.newPrivateProjectDto(db.getDefaultOrganization()).setKey("project-key-without-escaped-characters"));

    SearchWsResponse response = call(new SearchWsRequest().setQuery("project-_%-key").setQualifiers(singletonList(PROJECT)));

    assertThat(response.getComponentsList()).extracting(Component::getKey).containsOnly("project-_%-key");
  }

  @Test
  public void search_for_files() throws IOException {
    ComponentDto project = ComponentTesting.newPrivateProjectDto(db.getDefaultOrganization());
    ComponentDto file1 = newFileDto(project).setKey("file1");
    ComponentDto file2 = newFileDto(project).setKey("file2");
    db.components().insertComponents(project, file1, file2);
    setBrowsePermissionOnUser(project);

    SearchWsResponse response = call(new SearchWsRequest().setQuery(file1.key()).setQualifiers(singletonList(FILE)));

    assertThat(response.getComponentsList()).extracting(Component::getKey).containsOnly(file1.getKey());
  }

  @Test
  public void search_with_pagination() throws IOException {
    OrganizationDto organizationDto = db.organizations().insert();
    List<ComponentDto> componentDtoList = new ArrayList<>();
    for (int i = 1; i <= 9; i++) {
      componentDtoList.add(newPrivateProjectDto(organizationDto, "project-uuid-" + i).setKey("project-key-" + i).setName("Project Name " + i));
    }
    insertProjectsAuthorizedForUser(componentDtoList.toArray(new ComponentDto[] {}));

    SearchWsResponse response = call(new SearchWsRequest().setOrganization(organizationDto.getKey()).setPage(2).setPageSize(3).setQualifiers(singletonList(PROJECT)));

    assertThat(response.getComponentsList()).extracting(Component::getKey).containsExactly("project-key-4", "project-key-5", "project-key-6");
  }

  @Test
  public void search_with_language() throws IOException {
    OrganizationDto organizationDto = db.organizations().insert();
    insertProjectsAuthorizedForUser(
      ComponentTesting.newPrivateProjectDto(organizationDto).setKey("java-project").setLanguage("java"),
      ComponentTesting.newPrivateProjectDto(organizationDto).setKey("cpp-project").setLanguage("cpp"));

    SearchWsResponse response = call(new SearchWsRequest().setOrganization(organizationDto.getKey()).setLanguage("java").setQualifiers(singletonList(PROJECT)));

    assertThat(response.getComponentsList()).extracting(Component::getKey).containsOnly("java-project");
  }

  @Test
  public void return_only_components_from_projects_on_which_user_has_browse_permission() throws IOException {
    ComponentDto project1 = ComponentTesting.newPrivateProjectDto(db.getDefaultOrganization());
    ComponentDto file1 = newFileDto(project1).setKey("file1");
    ComponentDto file2 = newFileDto(project1).setKey("file2");
    ComponentDto project2 = ComponentTesting.newPrivateProjectDto(db.getDefaultOrganization());
    ComponentDto file3 = newFileDto(project2).setKey("file3");
    db.components().insertComponents(project1, file1, file2, project2, file3);
    setBrowsePermissionOnUser(project1);

    SearchWsResponse response = call(new SearchWsRequest().setQualifiers(singletonList(FILE)));

    assertThat(response.getComponentsList()).extracting(Component::getKey).containsOnly(file1.getKey(), file2.getKey());
  }

  @Test
  public void do_not_verify_permissions_if_user_is_root() throws IOException {
    OrganizationDto org = db.organizations().insert();
    ComponentDto project1 = ComponentTesting.newPrivateProjectDto(org);
    ComponentDto file1 = newFileDto(project1);
    ComponentDto project2 = ComponentTesting.newPrivateProjectDto(org);
    ComponentDto file2 = newFileDto(project2);
    db.components().insertComponents(project1, file1, project2, file2);

    SearchWsRequest request = new SearchWsRequest().setQualifiers(singletonList(FILE)).setOrganization(org.getKey());

    userSession.logIn().setNonRoot();
    assertThat(call(request).getComponentsCount()).isZero();

    userSession.logIn().setRoot();
    assertThat(call(request).getComponentsList()).extracting(Component::getKey).containsOnly(file1.getKey(), file2.getKey());
  }

  @Test
  public void fail_if_unknown_qualifier_provided() {
    expectedException.expect(IllegalArgumentException.class);
    expectedException.expectMessage("Value of parameter 'qualifiers' (Unknown-Qualifier) must be one of: [BRC, DIR, FIL, TRK]");

    call(new SearchWsRequest().setQualifiers(singletonList("Unknown-Qualifier")));
  }

  @Test
  public void fail_when_no_qualifier_provided() {
    expectedException.expect(IllegalArgumentException.class);
    expectedException.expectMessage("The 'qualifiers' parameter is missing");

    call(new SearchWsRequest());
  }

  @Test
  public void test_json_example() {
    OrganizationDto organizationDto = db.organizations().insertForKey("my-org-1");
    db.components().insertComponent(newView(organizationDto));
    ComponentDto project = newPrivateProjectDto(organizationDto, "project-uuid").setName("Project Name").setKey("project-key");
    ComponentDto module = newModuleDto("module-uuid", project).setName("Module Name").setKey("module-key");
    ComponentDto directory = newDirectory(module, "path/to/directoy").setUuid("directory-uuid").setKey("directory-key").setName("Directory Name");
    db.components().insertComponents(project, module, directory,
      newFileDto(module, directory, "file-uuid").setKey("file-key").setLanguage("java").setName("File Name"));
    userSession.addProjectPermission(UserRole.USER, project);

    String response = ws.newRequest()
      .setMediaType(MediaTypes.JSON)
      .setParam(PARAM_ORGANIZATION, organizationDto.getKey())
      .setParam(PARAM_QUALIFIERS, Joiner.on(",").join(PROJECT, MODULE, DIRECTORY, FILE))
      .execute().getInput();
    assertJson(response).isSimilarTo(ws.getDef().responseExampleAsString());
  }

  private void insertProjectsAuthorizedForUser(ComponentDto... projects) {
    db.components().insertComponents(projects);
    setBrowsePermissionOnUser(projects);
    db.commit();
  }

  private void setBrowsePermissionOnUser(ComponentDto... projects) {
    Arrays.stream(projects).forEach(project -> userSession.addProjectPermission(UserRole.USER, project));
  }

  private SearchWsResponse call(SearchWsRequest wsRequest) {
    TestRequest request = ws.newRequest();
    setNullable(wsRequest.getOrganization(), p -> request.setParam(PARAM_ORGANIZATION, p));
    setNullable(wsRequest.getLanguage(), p -> request.setParam(PARAM_LANGUAGE, p));
    setNullable(wsRequest.getQualifiers(), p -> request.setParam(PARAM_QUALIFIERS, Joiner.on(",").join(p)));
    setNullable(wsRequest.getQuery(), p -> request.setParam(TEXT_QUERY, p));
    setNullable(wsRequest.getPage(), page -> request.setParam(PAGE, String.valueOf(page)));
    setNullable(wsRequest.getPageSize(), pageSize -> request.setParam(PAGE_SIZE, String.valueOf(pageSize)));
    return request.executeProtobuf(SearchWsResponse.class);
  }

  private static Language[] javaLanguage() {
    return new Language[] {new Language() {
      @Override
      public String getKey() {
        return "java";
      }

      @Override
      public String getName() {
        return "Java";
      }

      @Override
      public String[] getFileSuffixes() {
        return new String[0];
      }
    }};
  }
}
