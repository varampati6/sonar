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
package it.ce;

import com.sonar.orchestrator.Orchestrator;
import com.sonar.orchestrator.build.BuildResult;
import com.sonar.orchestrator.build.SonarScanner;
import it.Category4Suite;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;
import org.sonarqube.ws.WsCe;
import org.sonarqube.ws.client.WsClient;
import org.sonarqube.ws.client.ce.ActivityWsRequest;
import util.ItUtils;

import static com.google.common.collect.Lists.newArrayList;
import static org.assertj.core.api.Assertions.assertThat;
import static util.ItUtils.projectDir;

public class CeWsTest {
  @ClassRule
  public static final Orchestrator orchestrator = Category4Suite.ORCHESTRATOR;

  private WsClient wsClient;
  private String taskUuid;

  @Before
  public void inspectProject() {
    orchestrator.resetData();
    BuildResult buildResult = orchestrator.executeBuild(SonarScanner.create(projectDir("shared/xoo-sample")));
    this.taskUuid = ItUtils.extractCeTaskId(buildResult);
    this.wsClient = ItUtils.newAdminWsClient(orchestrator);
  }

  @Test
  public void activity() {
    WsCe.ActivityResponse response = wsClient.ce().activity(new ActivityWsRequest()
      .setStatus(newArrayList("SUCCESS"))
      .setType("REPORT")
      .setOnlyCurrents(true)
      .setPage(1)
      .setPageSize(100));

    assertThat(response).isNotNull();
    assertThat(response.getTasksCount()).isGreaterThan(0);
    WsCe.Task firstTask = response.getTasks(0);
    assertThat(firstTask.getId()).isNotEmpty();
  }

  @Test
  public void task() {
    WsCe.TaskResponse taskResponse = wsClient.ce().task(taskUuid);

    assertThat(taskResponse.hasTask()).isTrue();
    WsCe.Task task = taskResponse.getTask();
    assertThat(task.getId()).isEqualTo(taskUuid);
    assertThat(task.hasErrorMessage()).isFalse();
    assertThat(task.hasHasScannerContext()).isTrue();
    assertThat(task.getScannerContext()).isNotNull();
  }

  @Test
  public void task_types() {
    WsCe.TaskTypesWsResponse response = wsClient.ce().taskTypes();

    assertThat(response).isNotNull();
    assertThat(response.getTaskTypesCount()).isGreaterThan(0);
  }
}
