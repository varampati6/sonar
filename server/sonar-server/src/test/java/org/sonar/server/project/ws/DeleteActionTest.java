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
package org.sonar.server.project.ws;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.ArgumentCaptor;
import org.sonar.api.utils.System2;
import org.sonar.api.web.UserRole;
import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.db.DbTester;
import org.sonar.db.component.ComponentDbTester;
import org.sonar.db.component.ComponentDto;
import org.sonar.server.component.ComponentCleanerService;
import org.sonar.server.component.ComponentFinder;
import org.sonar.server.exceptions.ForbiddenException;
import org.sonar.server.exceptions.UnauthorizedException;
import org.sonar.server.tester.UserSessionRule;
import org.sonar.server.ws.WsTester;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.sonar.db.permission.OrganizationPermission.ADMINISTER;
import static org.sonarqube.ws.client.project.ProjectsWsParameters.CONTROLLER;
import static org.sonarqube.ws.client.project.ProjectsWsParameters.PARAM_PROJECT;
import static org.sonarqube.ws.client.project.ProjectsWsParameters.PARAM_PROJECT_ID;

public class DeleteActionTest {

  private static final String ACTION = "delete";

  private System2 system2 = System2.INSTANCE;

  @Rule
  public DbTester db = DbTester.create(system2);

  @Rule
  public UserSessionRule userSessionRule = UserSessionRule.standalone();

  @Rule
  public ExpectedException expectedException = ExpectedException.none();

  private WsTester ws;
  private DbClient dbClient = db.getDbClient();
  private ComponentDbTester componentDbTester = new ComponentDbTester(db);
  private ComponentCleanerService componentCleanerService = mock(ComponentCleanerService.class);

  @Before
  public void setUp() {
    ws = new WsTester(new ProjectsWs(
      new DeleteAction(
        componentCleanerService,
        new ComponentFinder(dbClient),
        dbClient,
        userSessionRule)));
  }

  @Test
  public void organization_administrator_deletes_project_by_id() throws Exception {
    ComponentDto project = componentDbTester.insertPrivateProject();
    userSessionRule.logIn().addPermission(ADMINISTER, project.getOrganizationUuid());

    WsTester.TestRequest request = newRequest().setParam(PARAM_PROJECT_ID, project.uuid());
    call(request);

    assertThat(verifyDeletedKey()).isEqualTo(project.key());
  }

  @Test
  public void organization_administrator_deletes_project_by_key() throws Exception {
    ComponentDto project = componentDbTester.insertPrivateProject();
    userSessionRule.logIn().addPermission(ADMINISTER, project.getOrganizationUuid());

    call(newRequest().setParam(PARAM_PROJECT, project.key()));

    assertThat(verifyDeletedKey()).isEqualTo(project.key());
  }

  private String verifyDeletedKey() {
    ArgumentCaptor<ComponentDto> argument = ArgumentCaptor.forClass(ComponentDto.class);
    verify(componentCleanerService).delete(any(DbSession.class), argument.capture());
    return argument.getValue().key();
  }

  @Test
  public void project_administrator_deletes_the_project_by_uuid() throws Exception {
    ComponentDto project = componentDbTester.insertPrivateProject();
    userSessionRule.logIn().addProjectPermission(UserRole.ADMIN, project);

    call(newRequest().setParam(PARAM_PROJECT_ID, project.uuid()));

    assertThat(verifyDeletedKey()).isEqualTo(project.key());
  }

  @Test
  public void project_administrator_deletes_the_project_by_key() throws Exception {
    ComponentDto project = componentDbTester.insertPrivateProject();
    userSessionRule.logIn().addProjectPermission(UserRole.ADMIN, project);

    call(newRequest().setParam(PARAM_PROJECT, project.key()));

    assertThat(verifyDeletedKey()).isEqualTo(project.key());
  }

  @Test
  public void return_403_if_not_project_admin_nor_org_admin() throws Exception {
    ComponentDto project = componentDbTester.insertPrivateProject();

    userSessionRule.logIn()
      .addProjectPermission(UserRole.CODEVIEWER, project)
      .addProjectPermission(UserRole.ISSUE_ADMIN, project)
      .addProjectPermission(UserRole.USER, project);
    expectedException.expect(ForbiddenException.class);

    call(newRequest().setParam(PARAM_PROJECT_ID, project.uuid()));
  }

  @Test
  public void return_401_if_not_logged_in() throws Exception {
    ComponentDto project = componentDbTester.insertPrivateProject();

    userSessionRule.anonymous();
    expectedException.expect(UnauthorizedException.class);

    call(newRequest().setParam(PARAM_PROJECT_ID, project.uuid()));
  }

  private WsTester.TestRequest newRequest() {
    return ws.newPostRequest(CONTROLLER, ACTION);
  }

  private void call(WsTester.TestRequest request) throws Exception {
    WsTester.Result result = request.execute();
    result.assertNoContent();
  }
}
