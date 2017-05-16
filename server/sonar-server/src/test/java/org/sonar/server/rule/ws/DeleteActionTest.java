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
package org.sonar.server.rule.ws;

import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mockito;
import org.sonar.api.rule.RuleStatus;
import org.sonar.api.utils.System2;
import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.db.DbTester;
import org.sonar.db.rule.RuleDefinitionDto;
import org.sonar.server.exceptions.ForbiddenException;
import org.sonar.server.exceptions.UnauthorizedException;
import org.sonar.server.organization.DefaultOrganizationProvider;
import org.sonar.server.organization.TestDefaultOrganizationProvider;
import org.sonar.server.qualityprofile.RuleActivator;
import org.sonar.server.rule.index.RuleIndexer;
import org.sonar.server.tester.UserSessionRule;
import org.sonar.server.ws.WsActionTester;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.mock;
import static org.sonar.db.permission.OrganizationPermission.ADMINISTER_QUALITY_PROFILES;

public class DeleteActionTest {
  private static final long PAST = 10000L;

  @org.junit.Rule
  public UserSessionRule userSession = UserSessionRule.standalone();
  @org.junit.Rule
  public DbTester dbTester = DbTester.create();
  @org.junit.Rule
  public ExpectedException thrown = ExpectedException.none();

  private DbClient dbClient = dbTester.getDbClient();
  private DbSession dbSession = dbTester.getSession();
  private RuleIndexer ruleIndexer = mock(RuleIndexer.class);
  private RuleActivator ruleActivator = mock(RuleActivator.class);
  private DefaultOrganizationProvider defaultOrganizationProvider = TestDefaultOrganizationProvider.fromUuid("ORG1");
  private RuleWsSupport ruleWsSupport = new RuleWsSupport(mock(DbClient.class), userSession, defaultOrganizationProvider);
  private DeleteAction underTest = new DeleteAction(System2.INSTANCE, ruleIndexer, dbClient, ruleActivator, ruleWsSupport);
  private WsActionTester tester = new WsActionTester(underTest);

  @Test
  public void delete_custom_rule() throws Exception {
    logInAsQProfileAdministrator();

    RuleDefinitionDto templateRule = dbTester.rules().insert(
      r -> r.setIsTemplate(true),
      r -> r.setCreatedAt(PAST),
      r -> r.setUpdatedAt(PAST));
    RuleDefinitionDto customRule = dbTester.rules().insert(
      r -> r.setTemplateId(templateRule.getId()),
      r -> r.setCreatedAt(PAST),
      r -> r.setUpdatedAt(PAST));

    tester.newRequest()
      .setMethod("POST")
      .setParam("key", customRule.getKey().toString())
      .execute();

    Mockito.verify(ruleIndexer).indexRuleDefinition(eq(customRule.getKey()));
    Mockito.verifyNoMoreInteractions(ruleIndexer);

    // Verify custom rule has status REMOVED
    RuleDefinitionDto customRuleReloaded = dbClient.ruleDao().selectOrFailDefinitionByKey(dbSession, customRule.getKey());
    assertThat(customRuleReloaded).isNotNull();
    assertThat(customRuleReloaded.getStatus()).isEqualTo(RuleStatus.REMOVED);
    assertThat(customRuleReloaded.getUpdatedAt()).isNotEqualTo(PAST);
  }

  @Test
  public void throw_ForbiddenException_if_not_profile_administrator() throws Exception {
    userSession.logIn();

    thrown.expect(ForbiddenException.class);

    tester.newRequest()
      .setMethod("POST")
      .setParam("key", "anyRuleKey")
      .execute();
  }

  @Test
  public void throw_UnauthorizedException_if_not_logged_in() throws Exception {
    thrown.expect(UnauthorizedException.class);

    tester.newRequest()
      .setMethod("POST")
      .setParam("key", "anyRuleKey")
      .execute();
  }

  @Test
  public void fail_to_delete_if_not_custom() {
    logInAsQProfileAdministrator();
    RuleDefinitionDto rule = dbTester.rules().insert();

    thrown.expect(IllegalArgumentException.class);
    thrown.expectMessage("Rule '" + rule.getKey().toString() + "' cannot be deleted because it is not a custom rule");

    tester.newRequest()
      .setMethod("POST")
      .setParam("key", rule.getKey().toString())
      .execute();
  }

  private void logInAsQProfileAdministrator() {
    userSession
      .logIn()
      .addPermission(ADMINISTER_QUALITY_PROFILES, defaultOrganizationProvider.get().getUuid());
  }
}
