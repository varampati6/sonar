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
package org.sonar.server.projectlink.ws;

import java.io.IOException;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.sonar.api.utils.System2;
import org.sonar.api.web.UserRole;
import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.db.DbTester;
import org.sonar.db.component.ComponentDbTester;
import org.sonar.db.component.ComponentDto;
import org.sonar.db.component.ComponentLinkDto;
import org.sonar.server.component.ComponentFinder;
import org.sonar.server.exceptions.ForbiddenException;
import org.sonar.server.exceptions.NotFoundException;
import org.sonar.server.tester.UserSessionRule;
import org.sonar.server.ws.WsActionTester;
import org.sonarqube.ws.WsProjectLinks.Link;
import org.sonarqube.ws.WsProjectLinks.SearchWsResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.sonar.core.util.Uuids.UUID_EXAMPLE_01;
import static org.sonar.db.component.ComponentTesting.newPrivateProjectDto;
import static org.sonar.server.ws.KeyExamples.KEY_PROJECT_EXAMPLE_001;
import static org.sonar.test.JsonAssert.assertJson;
import static org.sonarqube.ws.client.projectlinks.ProjectLinksWsParameters.PARAM_PROJECT_ID;
import static org.sonarqube.ws.client.projectlinks.ProjectLinksWsParameters.PARAM_PROJECT_KEY;

public class SearchActionTest {

  private final String PROJECT_KEY = KEY_PROJECT_EXAMPLE_001;
  private final String PROJECT_UUID = UUID_EXAMPLE_01;

  @Rule
  public ExpectedException expectedException = ExpectedException.none();
  @Rule
  public UserSessionRule userSession = UserSessionRule.standalone();
  @Rule
  public DbTester db = DbTester.create(System2.INSTANCE);

  private DbClient dbClient = db.getDbClient();
  private DbSession dbSession = db.getSession();
  private ComponentDbTester componentDb = new ComponentDbTester(db);

  private SearchAction underTest;
  private WsActionTester ws;

  @Before
  public void setUp() {
    ComponentFinder componentFinder = new ComponentFinder(dbClient);
    underTest = new SearchAction(dbClient, userSession, componentFinder);
    ws = new WsActionTester(underTest);
  }

  @Test
  public void example() {
    ComponentDto project = insertProject();
    insertHomepageLink(project.uuid());
    insertCustomLink(project.uuid());
    logInAsProjectAdministrator(project);

    String result = ws.newRequest()
      .setParam(PARAM_PROJECT_KEY, PROJECT_KEY)
      .execute().getInput();

    assertJson(result).ignoreFields("id").isSimilarTo(getClass().getResource("list-example.json"));
  }

  @Test
  public void request_by_project_id() throws IOException {
    ComponentDto project = insertProject();
    insertHomepageLink(project.uuid());
    logInAsProjectAdministrator(project);

    SearchWsResponse response = callByUuid(project.uuid());

    assertThat(response.getLinksCount()).isEqualTo(1);
    assertThat(response.getLinks(0).getName()).isEqualTo("Homepage");
  }

  @Test
  public void request_by_project_key() throws IOException {
    ComponentDto project = insertProject();
    insertHomepageLink(project.uuid());
    logInAsProjectAdministrator(project);

    SearchWsResponse response = callByKey(project.key());

    assertThat(response.getLinksCount()).isEqualTo(1);
    assertThat(response.getLinks(0).getName()).isEqualTo("Homepage");
  }

  @Test
  public void response_fields() throws IOException {
    ComponentDto project = insertProject();
    ComponentLinkDto homepageLink = insertHomepageLink(project.uuid());
    ComponentLinkDto customLink = insertCustomLink(project.uuid());
    logInAsProjectAdministrator(project);

    SearchWsResponse response = callByKey(project.key());

    assertThat(response.getLinksCount()).isEqualTo(2);
    assertThat(response.getLinksList()).extracting(Link::getId, Link::getName, Link::getType, Link::getUrl)
      .containsOnlyOnce(
        tuple(homepageLink.getIdAsString(), homepageLink.getName(), homepageLink.getType(), homepageLink.getHref()),
        tuple(customLink.getIdAsString(), customLink.getName(), customLink.getType(), customLink.getHref()));
  }

  @Test
  public void several_projects() throws IOException {
    ComponentDto project1 = insertProject();
    ComponentDto project2 = insertProject("another", "abcd");
    ComponentLinkDto customLink1 = insertCustomLink(project1.uuid());
    insertCustomLink(project2.uuid());
    userSession.logIn().setRoot();

    SearchWsResponse response = callByKey(project1.key());

    assertThat(response.getLinksCount()).isEqualTo(1);
    assertThat(response.getLinks(0).getId()).isEqualTo(customLink1.getIdAsString());
  }

  @Test
  public void request_does_not_fail_when_link_has_no_name() throws IOException {
    ComponentDto project = db.components().insertPrivateProject();
    ComponentLinkDto foo = new ComponentLinkDto().setComponentUuid(project.uuid()).setHref("foo").setType("type");
    insertLink(foo);
    logInAsProjectAdministrator(project);

    callByKey(project.key());
  }

  @Test
  public void request_does_not_fail_when_link_has_no_type() throws IOException {
    ComponentDto project = db.components().insertPrivateProject();
    ComponentLinkDto foo = new ComponentLinkDto().setComponentUuid(project.uuid()).setHref("foo").setName("name");
    insertLink(foo);
    logInAsProjectAdministrator(project);

    callByKey(project.key());
  }

  @Test
  public void project_administrator_can_search_for_links() throws IOException {
    ComponentDto project = insertProject();
    userSession.logIn().addProjectPermission(UserRole.ADMIN, project);

    checkItWorks(project);
  }

  @Test
  public void project_user_can_search_for_links() throws IOException {
    ComponentDto project = insertProject();
    userSession.logIn().addProjectPermission(UserRole.USER, project);

    checkItWorks(project);
  }

  @Test
  public void fail_when_no_project() throws IOException {
    expectedException.expect(NotFoundException.class);
    callByKey("unknown");
  }

  @Test
  public void fail_if_insufficient_privileges() throws IOException {
    userSession.anonymous();
    insertProject();

    expectedException.expect(ForbiddenException.class);
    callByKey(PROJECT_KEY);
  }

  @Test
  public void fail_when_both_id_and_key_are_provided() {
    ComponentDto project = insertProject();
    logInAsProjectAdministrator(project);

    expectedException.expect(IllegalArgumentException.class);
    ws.newRequest()
      .setParam(PARAM_PROJECT_KEY, project.key())
      .setParam(PARAM_PROJECT_ID, project.uuid())
      .execute();
  }

  @Test
  public void fail_when_no_id_nor_key_are_provided() {
    insertProject();

    expectedException.expect(IllegalArgumentException.class);
    ws.newRequest()
      .setParam(PARAM_PROJECT_KEY, PROJECT_KEY)
      .setParam(PARAM_PROJECT_ID, PROJECT_UUID)
      .execute();
  }

  private ComponentDto insertProject(String projectKey, String projectUuid) {
    return componentDb.insertComponent(newPrivateProjectDto(db.organizations().insert(), projectUuid).setKey(projectKey));
  }

  private ComponentDto insertProject() {
    return insertProject(PROJECT_KEY, PROJECT_UUID);
  }

  private void insertLink(ComponentLinkDto linkDto) {
    dbClient.componentLinkDao().insert(dbSession, linkDto);
    dbSession.commit();
  }

  private ComponentLinkDto insertHomepageLink(String projectUuid) {
    ComponentLinkDto link = new ComponentLinkDto()
      .setComponentUuid(projectUuid)
      .setName("Homepage")
      .setType("homepage")
      .setHref("http://example.org");
    insertLink(link);
    return link;
  }

  private ComponentLinkDto insertCustomLink(String projectUuid) {
    ComponentLinkDto link = new ComponentLinkDto()
      .setComponentUuid(projectUuid)
      .setName("Custom")
      .setType("Custom")
      .setHref("http://example.org/custom");
    insertLink(link);
    return link;
  }

  private SearchWsResponse callByKey(String projectKey) throws IOException {
    return ws.newRequest()
      .setParam(PARAM_PROJECT_KEY, projectKey)
      .executeProtobuf(SearchWsResponse.class);
  }

  private SearchWsResponse callByUuid(String projectUuid) throws IOException {
    return ws.newRequest()
      .setParam(PARAM_PROJECT_ID, projectUuid)
      .executeProtobuf(SearchWsResponse.class);
  }

  private void checkItWorks(ComponentDto project) throws IOException {
    insertHomepageLink(project.uuid());
    SearchWsResponse response = callByKey(project.key());
    assertThat(response.getLinksCount()).isEqualTo(1);
    assertThat(response.getLinks(0).getName()).isEqualTo("Homepage");
  }

  private void logInAsProjectAdministrator(ComponentDto project) {
    userSession.logIn().addProjectPermission(UserRole.ADMIN, project);
  }
}
