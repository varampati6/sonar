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
package org.sonar.server.ui.ws;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.sonar.api.resources.ResourceType;
import org.sonar.api.resources.ResourceTypes;
import org.sonar.api.server.ws.Change;
import org.sonar.api.server.ws.WebService;
import org.sonar.api.utils.DateUtils;
import org.sonar.api.utils.System2;
import org.sonar.api.web.UserRole;
import org.sonar.api.web.page.Page;
import org.sonar.api.web.page.Page.Qualifier;
import org.sonar.api.web.page.PageDefinition;
import org.sonar.core.component.DefaultResourceTypes;
import org.sonar.core.platform.PluginRepository;
import org.sonar.db.DbClient;
import org.sonar.db.DbTester;
import org.sonar.db.component.ComponentDbTester;
import org.sonar.db.component.ComponentDto;
import org.sonar.db.component.ComponentTesting;
import org.sonar.db.component.SnapshotDto;
import org.sonar.db.metric.MetricDto;
import org.sonar.db.organization.OrganizationDto;
import org.sonar.db.permission.OrganizationPermission;
import org.sonar.db.property.PropertyDbTester;
import org.sonar.db.property.PropertyDto;
import org.sonar.db.qualitygate.QualityGateDto;
import org.sonar.db.user.UserDto;
import org.sonar.server.component.ComponentFinder;
import org.sonar.server.exceptions.ForbiddenException;
import org.sonar.server.exceptions.NotFoundException;
import org.sonar.server.organization.BillingValidations;
import org.sonar.server.organization.BillingValidationsProxy;
import org.sonar.server.qualitygate.QualityGateFinder;
import org.sonar.server.qualityprofile.QPMeasureData;
import org.sonar.server.qualityprofile.QualityProfile;
import org.sonar.server.tester.UserSessionRule;
import org.sonar.server.ui.PageRepository;
import org.sonar.server.ws.WsActionTester;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.sonar.api.measures.CoreMetrics.QUALITY_PROFILES_KEY;
import static org.sonar.api.web.page.Page.Scope.COMPONENT;
import static org.sonar.db.component.ComponentTesting.newDirectory;
import static org.sonar.db.component.ComponentTesting.newFileDto;
import static org.sonar.db.component.ComponentTesting.newModuleDto;
import static org.sonar.db.component.ComponentTesting.newPrivateProjectDto;
import static org.sonar.db.component.SnapshotTesting.newAnalysis;
import static org.sonar.db.measure.MeasureTesting.newMeasureDto;
import static org.sonar.db.metric.MetricTesting.newMetricDto;
import static org.sonar.db.permission.OrganizationPermission.ADMINISTER_QUALITY_GATES;
import static org.sonar.db.permission.OrganizationPermission.ADMINISTER_QUALITY_PROFILES;
import static org.sonar.server.ui.ws.ComponentAction.PARAM_COMPONENT;
import static org.sonar.test.JsonAssert.assertJson;

public class ComponentActionTest {

  @Rule
  public ExpectedException expectedException = ExpectedException.none();
  @Rule
  public DbTester dbTester = DbTester.create(System2.INSTANCE);
  @Rule
  public UserSessionRule userSession = UserSessionRule.standalone();

  private DbClient dbClient = dbTester.getDbClient();
  private ComponentDbTester componentDbTester = dbTester.components();
  private PropertyDbTester propertyDbTester = new PropertyDbTester(dbTester);
  private ResourceTypes resourceTypes = mock(ResourceTypes.class);
  private BillingValidationsProxy billingValidations = mock(BillingValidationsProxy.class);

  private ComponentDto project;
  private WsActionTester ws;

  @Before
  public void before() {
    OrganizationDto organization = dbTester.organizations().insertForKey("my-org");
    project = newPrivateProjectDto(organization, "abcd")
      .setKey("polop")
      .setName("Polop")
      .setDescription("test project")
      .setLanguage("xoo");
  }

  @Test
  public void check_definition() throws Exception {
    init();
    WebService.Action action = ws.getDef();

    assertThat(action.since()).isEqualTo("5.2");
    assertThat(action.isPost()).isFalse();
    assertThat(action.isInternal()).isTrue();
    assertThat(action.description()).isNotNull();
    assertThat(action.responseExample()).isNotNull();
    assertThat(action.changelog()).extracting(Change::getVersion, Change::getDescription).containsExactlyInAnyOrder(
      tuple("6.4", "The 'visibility' field is added"));

    WebService.Param componentId = action.param(PARAM_COMPONENT);
    assertThat(componentId.isRequired()).isFalse();
    assertThat(componentId.description()).isNotNull();
    assertThat(componentId.exampleValue()).isNotNull();
    assertThat(componentId.deprecatedKey()).isEqualTo("componentKey");
    assertThat(componentId.deprecatedKeySince()).isEqualTo("6.4");
  }

  @Test
  public void fail_on_missing_parameters() throws Exception {
    init();

    expectedException.expect(IllegalArgumentException.class);
    ws.newRequest().execute();
  }

  @Test
  public void fail_on_unknown_component_key() throws Exception {
    init();

    expectedException.expect(NotFoundException.class);
    execute(project.key());
  }

  @Test
  public void throw_ForbiddenException_if_required_permission_is_not_granted() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    userSession.logIn();

    expectedException.expect(ForbiddenException.class);
    execute(project.key());
  }

  @Test
  public void return_info_if_user_has_browse_permission_on_project() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    userSession.logIn().addProjectPermission(UserRole.USER, project);

    verifySuccess(project.key());
  }

  @Test
  public void return_info_if_user_has_administration_permission_on_project() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    userSession.logIn().addProjectPermission(UserRole.ADMIN, project);

    verifySuccess(project.key());
  }

  @Test
  public void return_info_if_user_is_system_administrator() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    userSession.logIn().setSystemAdministrator();

    verifySuccess(project.key());
  }

  @Test
  public void return_component_info_when_anonymous_no_snapshot() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    userSession.addProjectPermission(UserRole.USER, project);

    executeAndVerify(project.key(), "return_component_info_when_anonymous_no_snapshot.json");
  }

  @Test
  public void return_component_info_with_favourite() throws Exception {
    init();
    UserDto user = dbTester.users().insertUser("obiwan");
    componentDbTester.insertComponent(project);
    propertyDbTester.insertProperty(new PropertyDto().setKey("favourite").setResourceId(project.getId()).setUserId(user.getId()));
    userSession.logIn(user).addProjectPermission(UserRole.USER, project);

    executeAndVerify(project.key(), "return_component_info_with_favourite.json");
  }

  @Test
  public void return_component_info_when_snapshot() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    componentDbTester.insertSnapshot(newAnalysis(project)
      .setCreatedAt(DateUtils.parseDateTime("2015-04-22T11:44:00+0200").getTime())
      .setVersion("3.14")
      .setLast(true));
    userSession.addProjectPermission(UserRole.USER, project);

    executeAndVerify(project.key(), "return_component_info_when_snapshot.json");
  }

  @Test
  public void return_quality_profiles() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    SnapshotDto analysis = componentDbTester.insertSnapshot(newAnalysis(project));
    addQualityProfiles(project, analysis,
      createQProfile("qp1", "Sonar Way Java", "java"),
      createQProfile("qp2", "Sonar Way Xoo", "xoo"));
    userSession.addProjectPermission(UserRole.USER, project);

    executeAndVerify(project.key(), "return_quality_profiles.json");
  }

  @Test
  public void return_empty_quality_profiles_when_no_measure() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    userSession.addProjectPermission(UserRole.USER, project);

    executeAndVerify(project.key(), "return_empty_quality_profiles_when_no_measure.json");
  }

  @Test
  public void return_quality_gate_defined_on_project() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    QualityGateDto qualityGateDto = dbTester.qualityGates().insertQualityGate("Sonar way");
    dbTester.qualityGates().associateProjectToQualityGate(project, qualityGateDto);
    userSession.addProjectPermission(UserRole.USER, project);

    executeAndVerify(project.key(), "return_quality_gate.json");
  }

  @Test
  public void return_default_quality_gate() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    dbTester.qualityGates().createDefaultQualityGate("Sonar way");
    userSession.addProjectPermission(UserRole.USER, project);

    executeAndVerify(project.key(), "return_default_quality_gate.json");
  }

  @Test
  public void return_no_quality_gate_when_not_defined_on_project_and_no_default_one() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    userSession.addProjectPermission(UserRole.USER, project);

    String json = execute(project.key());
    assertThat(json).doesNotContain("qualityGate");
  }

  @Test
  public void return_extensions() throws Exception {
    init(createPages());
    componentDbTester.insertComponent(project);
    userSession.anonymous().addProjectPermission(UserRole.USER, project);

    executeAndVerify(project.key(), "return_extensions.json");
  }

  @Test
  public void return_extensions_for_admin() throws Exception {
    init(createPages());
    componentDbTester.insertComponent(project);
    userSession.anonymous()
      .addProjectPermission(UserRole.USER, project)
      .addProjectPermission(UserRole.ADMIN, project);

    executeAndVerify(project.key(), "return_extensions_for_admin.json");
  }

  @Test
  public void return_configuration_for_admin() throws Exception {
    UserDto user = dbTester.users().insertUser();
    componentDbTester.insertComponent(project);
    userSession.logIn(user)
      .addProjectPermission(UserRole.USER, project)
      .addProjectPermission(UserRole.ADMIN, project);

    Page page1 = Page.builder("my_plugin/first_page")
      .setName("First Page")
      .setAdmin(true)
      .setScope(COMPONENT)
      .setComponentQualifiers(Qualifier.PROJECT)
      .build();
    Page page2 = Page.builder("my_plugin/second_page")
      .setName("Second Page")
      .setAdmin(true)
      .setScope(COMPONENT)
      .setComponentQualifiers(Qualifier.PROJECT)
      .build();

    init(page1, page2);
    executeAndVerify(project.key(), "return_configuration_for_admin.json");
  }

  @Test
  public void return_configuration_with_all_properties() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    userSession.anonymous()
      .addProjectPermission(UserRole.USER, project)
      .addProjectPermission(UserRole.ADMIN, project);

    ResourceType projectResourceType = ResourceType.builder(project.qualifier())
      .setProperty("comparable", true)
      .setProperty("configurable", true)
      .setProperty("hasRolePolicy", true)
      .setProperty("modifiable_history", true)
      .setProperty("updatable_key", true)
      .setProperty("deletable", true)
      .build();
    when(resourceTypes.get(project.qualifier()))
      .thenReturn(projectResourceType);

    executeAndVerify(project.key(), "return_configuration_with_all_properties.json");
  }

  @Test
  public void return_breadcrumbs_on_module() throws Exception {
    init();
    ComponentDto project = componentDbTester.insertComponent(this.project);
    ComponentDto module = componentDbTester.insertComponent(newModuleDto("bcde", project).setKey("palap").setName("Palap"));
    userSession.anonymous()
      .addProjectPermission(UserRole.USER, project)
      .addProjectPermission(UserRole.ADMIN, project);

    executeAndVerify(module.key(), "return_breadcrumbs_on_module.json");
  }

  @Test
  public void return_configuration_for_quality_profile_admin() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    userSession.logIn()
      .addProjectPermission(UserRole.USER, project)
      .addPermission(ADMINISTER_QUALITY_PROFILES, project.getOrganizationUuid());

    executeAndVerify(project.key(), "return_configuration_for_quality_profile_admin.json");
  }

  @Test
  public void return_configuration_for_quality_gate_admin() throws Exception {
    init();
    componentDbTester.insertComponent(project);
    userSession.logIn()
      .addProjectPermission(UserRole.USER, project)
      .addPermission(ADMINISTER_QUALITY_GATES, project.getOrganizationUuid());

    executeAndVerify(project.key(), "return_configuration_for_quality_gate_admin.json");
  }

  @Test
  public void return_bread_crumbs_on_several_levels() throws Exception {
    init();
    ComponentDto project = componentDbTester.insertComponent(this.project);
    ComponentDto module = componentDbTester.insertComponent(newModuleDto("bcde", project).setKey("palap").setName("Palap"));
    ComponentDto directory = componentDbTester.insertComponent(newDirectory(module, "src/main/xoo"));
    ComponentDto file = componentDbTester.insertComponent(newFileDto(directory, directory, "cdef").setName("Source.xoo")
      .setKey("palap:src/main/xoo/Source.xoo")
      .setPath(directory.path()));
    userSession.addProjectPermission(UserRole.USER, project);

    executeAndVerify(file.key(), "return_bread_crumbs_on_several_levels.json");
  }

  @Test
  public void project_administrator_is_allowed_to_get_information() throws Exception {
    init(createPages());
    componentDbTester.insertProjectAndSnapshot(project);
    userSession.addProjectPermission(UserRole.ADMIN, project);

    execute(project.key());
  }

  @Test
  public void test_example_response() throws Exception {
    init(createPages());
    OrganizationDto organizationDto = dbTester.organizations().insertForKey("my-org-1");
    ComponentDto project = newPrivateProjectDto(organizationDto, "ABCD")
      .setKey("org.codehaus.sonar:sonar")
      .setName("Sonarqube")
      .setDescription("Open source platform for continuous inspection of code quality");
    componentDbTester.insertComponent(project);
    SnapshotDto analysis = newAnalysis(project)
      .setCreatedAt(DateUtils.parseDateTime("2016-12-06T11:44:00+0200").getTime())
      .setVersion("6.3")
      .setLast(true);
    componentDbTester.insertSnapshot(analysis);
    when(resourceTypes.get(project.qualifier())).thenReturn(DefaultResourceTypes.get().getRootType());
    UserDto user = dbTester.users().insertUser("obiwan");
    propertyDbTester.insertProperty(new PropertyDto().setKey("favourite").setResourceId(project.getId()).setUserId(user.getId()));
    addQualityProfiles(project, analysis,
      createQProfile("qp1", "Sonar Way Java", "java"),
      createQProfile("qp2", "Sonar Way Xoo", "xoo"));
    QualityGateDto qualityGateDto = dbTester.qualityGates().insertQualityGate("Sonar way");
    dbTester.qualityGates().associateProjectToQualityGate(project, qualityGateDto);
    userSession.logIn(user)
      .addProjectPermission(UserRole.USER, project)
      .addProjectPermission(UserRole.ADMIN, project);

    String result = execute(project.key());
    assertJson(result).ignoreFields("snapshotDate", "key", "qualityGate.key").isSimilarTo(ws.getDef().responseExampleAsString());
  }

  @Test
  public void should_return_private_flag_for_project() throws Exception {
    init();
    OrganizationDto org = dbTester.organizations().insert();
    ComponentDto project = dbTester.components().insertPrivateProject(org);

    userSession.logIn()
      .addProjectPermission(UserRole.ADMIN, project)
      .addPermission(OrganizationPermission.ADMINISTER, org);
    assertJson(execute(project.key())).isSimilarTo("{\"visibility\": \"private\"}");
  }

  @Test
  public void should_return_public_flag_for_project() throws Exception {
    init();
    OrganizationDto org = dbTester.organizations().insert();
    ComponentDto project = dbTester.components().insertPublicProject(org);

    userSession.logIn()
      .addProjectPermission(UserRole.ADMIN, project)
      .addPermission(OrganizationPermission.ADMINISTER, org);
    assertJson(execute(project.key())).isSimilarTo("{\"visibility\": \"public\"}");
  }

  @Test
  public void should_not_return_private_flag_for_module() throws Exception {
    init();
    OrganizationDto org = dbTester.organizations().insert();
    ComponentDto project = dbTester.components().insertPrivateProject(org);
    ComponentDto module = dbTester.components().insertComponent(ComponentTesting.newModuleDto(project));

    userSession.logIn()
      .addProjectPermission(UserRole.ADMIN, project)
      .addPermission(OrganizationPermission.ADMINISTER, org);
    String json = execute(module.key());
    assertThat(json).doesNotContain("visibility");
  }

  @Test
  public void canApplyPermissionTemplate_is_true_if_logged_in_as_organization_administrator() {
    init(createPages());
    OrganizationDto org = dbTester.organizations().insert();
    ComponentDto project = dbTester.components().insertPrivateProject(org);

    userSession.logIn()
      .addProjectPermission(UserRole.ADMIN, project)
      .addPermission(OrganizationPermission.ADMINISTER, org);
    assertJson(execute(project.key())).isSimilarTo("{\"configuration\": {\"canApplyPermissionTemplate\": true}}");

    userSession.logIn()
      .addProjectPermission(UserRole.ADMIN, project);

    assertJson(execute(project.key())).isSimilarTo("{\"configuration\": {\"canApplyPermissionTemplate\": false}}");
  }

  @Test
  public void canUpdateProjectVisibilityToPrivate_is_true_if_logged_in_as_project_administrator_and_extension_returns_false() {
    init(createPages());
    OrganizationDto org = dbTester.organizations().insert();
    ComponentDto project = dbTester.components().insertPublicProject(org);

    userSession.logIn().addProjectPermission(UserRole.ADMIN, project);
    when(billingValidations.canUpdateProjectVisibilityToPrivate(any(BillingValidations.Organization.class))).thenReturn(false);
    assertJson(execute(project.key())).isSimilarTo("{\"configuration\": {\"canUpdateProjectVisibilityToPrivate\": false}}");

    userSession.logIn().addProjectPermission(UserRole.ADMIN, project);
    when(billingValidations.canUpdateProjectVisibilityToPrivate(any(BillingValidations.Organization.class))).thenReturn(true);
    assertJson(execute(project.key())).isSimilarTo("{\"configuration\": {\"canUpdateProjectVisibilityToPrivate\": true}}");
  }

  private void init(Page... pages) {
    PluginRepository pluginRepository = mock(PluginRepository.class);
    when(pluginRepository.hasPlugin(anyString())).thenReturn(true);
    PageRepository pageRepository = new PageRepository(pluginRepository, new PageDefinition[] {context -> {
      for (Page page : pages) {
        context.addPage(page);
      }
    }});
    pageRepository.start();
    ws = new WsActionTester(
      new ComponentAction(dbClient, pageRepository, resourceTypes, userSession, new ComponentFinder(dbClient),
        new QualityGateFinder(dbClient), billingValidations));
  }

  private String execute(String componentKey) {
    return ws.newRequest().setParam("componentKey", componentKey).execute().getInput();
  }

  private void verify(String json, String expectedJson) {
    assertJson(json).isSimilarTo(getClass().getResource(ComponentActionTest.class.getSimpleName() + "/" + expectedJson));
  }

  private void executeAndVerify(String componentKey, String expectedJson) {
    verify(execute(componentKey), expectedJson);
  }

  private void addQualityProfiles(ComponentDto project, SnapshotDto analysis, QualityProfile... qps) {
    MetricDto metricDto = newMetricDto().setKey(QUALITY_PROFILES_KEY);
    dbClient.metricDao().insert(dbTester.getSession(), metricDto);
    dbClient.measureDao().insert(dbTester.getSession(),
      newMeasureDto(metricDto, project, analysis)
        .setData(qualityProfilesToJson(qps)));
    dbTester.commit();
  }

  private Page[] createPages() {
    Page page1 = Page.builder("my_plugin/first_page")
      .setName("First Page")
      .setScope(COMPONENT)
      .setComponentQualifiers(Qualifier.PROJECT)
      .build();
    Page page2 = Page.builder("my_plugin/second_page")
      .setName("Second Page")
      .setScope(COMPONENT)
      .setComponentQualifiers(Qualifier.PROJECT)
      .build();
    Page adminPage = Page.builder("my_plugin/admin_page")
      .setName("Admin Page")
      .setScope(COMPONENT)
      .setComponentQualifiers(Qualifier.PROJECT)
      .setAdmin(true)
      .build();

    return new Page[] {page1, page2, adminPage};
  }

  private void verifySuccess(String componentKey) {
    String json = execute(componentKey);
    assertJson(json).isSimilarTo("{\"key\":\"" + componentKey + "\"}");
  }

  private static QualityProfile createQProfile(String qpKey, String qpName, String languageKey) {
    return new QualityProfile(qpKey, qpName, languageKey, new Date());
  }

  private static String qualityProfilesToJson(QualityProfile... qps) {
    List<QualityProfile> qualityProfiles = Arrays.asList(qps);
    return QPMeasureData.toJson(new QPMeasureData(qualityProfiles));
  }
}
