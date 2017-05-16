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

import java.util.List;
import java.util.stream.Collectors;
import org.sonar.api.server.ws.Request;
import org.sonar.api.server.ws.Response;
import org.sonar.api.server.ws.WebService;
import org.sonar.api.web.UserRole;
import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.db.component.ComponentDto;
import org.sonar.db.component.ComponentLinkDto;
import org.sonar.server.component.ComponentFinder;
import org.sonar.server.user.UserSession;
import org.sonarqube.ws.WsProjectLinks.Link;
import org.sonarqube.ws.WsProjectLinks.SearchWsResponse;
import org.sonarqube.ws.client.projectlinks.SearchWsRequest;

import static org.sonar.core.util.Protobuf.setNullable;
import static org.sonar.core.util.Uuids.UUID_EXAMPLE_01;
import static org.sonar.server.user.AbstractUserSession.insufficientPrivilegesException;
import static org.sonar.server.ws.KeyExamples.KEY_PROJECT_EXAMPLE_001;
import static org.sonar.server.ws.WsUtils.writeProtobuf;
import static org.sonarqube.ws.client.projectlinks.ProjectLinksWsParameters.ACTION_SEARCH;
import static org.sonarqube.ws.client.projectlinks.ProjectLinksWsParameters.PARAM_PROJECT_ID;
import static org.sonarqube.ws.client.projectlinks.ProjectLinksWsParameters.PARAM_PROJECT_KEY;

public class SearchAction implements ProjectLinksWsAction {
  private final DbClient dbClient;
  private final UserSession userSession;
  private final ComponentFinder componentFinder;

  public SearchAction(DbClient dbClient, UserSession userSession, ComponentFinder componentFinder) {
    this.dbClient = dbClient;
    this.userSession = userSession;
    this.componentFinder = componentFinder;
  }

  @Override
  public void define(WebService.NewController context) {
    WebService.NewAction action = context.createAction(ACTION_SEARCH)
      .setDescription("List links of a project.<br>" +
        "The '%s' or '%s' must be provided.<br>" +
        "Requires one of the following permissions:" +
        "<ul>" +
        "<li>'Administer System'</li>" +
        "<li>'Administer' rights on the specified project</li>" +
        "<li>'Browse' on the specified project</li>" +
        "</ul>",
        PARAM_PROJECT_ID, PARAM_PROJECT_KEY)
      .setHandler(this)
      .setResponseExample(getClass().getResource("list-example.json"))
      .setSince("6.1");

    action.createParam(PARAM_PROJECT_ID)
      .setDescription("Project Id")
      .setExampleValue(UUID_EXAMPLE_01);

    action.createParam(PARAM_PROJECT_KEY)
      .setDescription("Project Key")
      .setExampleValue(KEY_PROJECT_EXAMPLE_001);
  }

  @Override
  public void handle(Request request, Response response) throws Exception {
    SearchWsRequest searchWsRequest = toSearchWsRequest(request);
    SearchWsResponse searchWsResponse = doHandle(searchWsRequest);

    writeProtobuf(searchWsResponse, request, response);
  }

  private SearchWsResponse doHandle(SearchWsRequest searchWsRequest) {
    try (DbSession dbSession = dbClient.openSession(false)) {
      ComponentDto component = getComponentByUuidOrKey(dbSession, searchWsRequest);
      List<ComponentLinkDto> links = dbClient.componentLinkDao()
        .selectByComponentUuid(dbSession, component.uuid());
      return buildResponse(links);
    }
  }

  private static SearchWsResponse buildResponse(List<ComponentLinkDto> links) {
    return SearchWsResponse.newBuilder()
      .addAllLinks(links.stream()
        .map(SearchAction::buildLink)
        .collect(Collectors.toList()))
      .build();
  }

  private static Link buildLink(ComponentLinkDto link) {
    Link.Builder builder = Link.newBuilder()
      .setId(String.valueOf(link.getId()))
      .setUrl(link.getHref());
    setNullable(link.getName(), builder::setName);
    setNullable(link.getType(), builder::setType);
    return builder.build();
  }

  private ComponentDto getComponentByUuidOrKey(DbSession dbSession, SearchWsRequest request) {
    ComponentDto component = componentFinder.getByUuidOrKey(
      dbSession,
      request.getProjectId(),
      request.getProjectKey(),
      ComponentFinder.ParamNames.PROJECT_ID_AND_KEY);

    if (!userSession.hasComponentPermission(UserRole.ADMIN, component) &&
      !userSession.hasComponentPermission(UserRole.USER, component)) {
      throw insufficientPrivilegesException();
    }

    return component;
  }

  private static SearchWsRequest toSearchWsRequest(Request request) {
    return new SearchWsRequest()
      .setProjectId(request.param(PARAM_PROJECT_ID))
      .setProjectKey(request.param(PARAM_PROJECT_KEY));
  }
}
