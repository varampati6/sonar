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
package org.sonar.server.notification.ws;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.sonar.api.notifications.NotificationChannel;
import org.sonar.api.resources.Qualifiers;
import org.sonar.api.resources.Scopes;
import org.sonar.api.server.ws.Request;
import org.sonar.api.server.ws.Response;
import org.sonar.api.server.ws.WebService;
import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.db.component.ComponentDto;
import org.sonar.db.user.UserDto;
import org.sonar.server.component.ComponentFinder;
import org.sonar.server.issue.notification.MyNewIssuesNotificationDispatcher;
import org.sonar.server.notification.NotificationCenter;
import org.sonar.server.notification.NotificationUpdater;
import org.sonar.server.notification.email.EmailNotificationChannel;
import org.sonar.server.user.UserSession;
import org.sonar.server.ws.KeyExamples;
import org.sonarqube.ws.client.notification.RemoveRequest;

import static java.util.Optional.empty;
import static org.sonar.core.util.Protobuf.setNullable;
import static org.sonar.server.notification.NotificationDispatcherMetadata.GLOBAL_NOTIFICATION;
import static org.sonar.server.notification.NotificationDispatcherMetadata.PER_PROJECT_NOTIFICATION;
import static org.sonar.server.ws.WsUtils.checkFound;
import static org.sonar.server.ws.WsUtils.checkRequest;
import static org.sonarqube.ws.client.notification.NotificationsWsParameters.ACTION_REMOVE;
import static org.sonarqube.ws.client.notification.NotificationsWsParameters.PARAM_CHANNEL;
import static org.sonarqube.ws.client.notification.NotificationsWsParameters.PARAM_LOGIN;
import static org.sonarqube.ws.client.notification.NotificationsWsParameters.PARAM_PROJECT;
import static org.sonarqube.ws.client.notification.NotificationsWsParameters.PARAM_TYPE;

public class RemoveAction implements NotificationsWsAction {
  private final NotificationCenter notificationCenter;
  private final NotificationUpdater notificationUpdater;
  private final DbClient dbClient;
  private final ComponentFinder componentFinder;
  private final UserSession userSession;
  private final List<String> globalDispatchers;
  private final List<String> projectDispatchers;

  public RemoveAction(NotificationCenter notificationCenter, NotificationUpdater notificationUpdater, DbClient dbClient, ComponentFinder componentFinder, UserSession userSession) {
    this.notificationCenter = notificationCenter;
    this.notificationUpdater = notificationUpdater;
    this.dbClient = dbClient;
    this.componentFinder = componentFinder;
    this.userSession = userSession;
    this.globalDispatchers = notificationCenter.getDispatcherKeysForProperty(GLOBAL_NOTIFICATION, "true");
    this.projectDispatchers = notificationCenter.getDispatcherKeysForProperty(PER_PROJECT_NOTIFICATION, "true");
  }

  @Override
  public void define(WebService.NewController context) {
    WebService.NewAction action = context.createAction(ACTION_REMOVE)
      .setDescription("Remove a notification for the authenticated user.<br>" +
        "Requires one of the following permissions:" +
        "<ul>" +
        "  <li>Authentication if no login is provided</li>" +
        "  <li>System administration if a login is provided</li>" +
        "</ul>")
      .setSince("6.3")
      .setPost(true)
      .setHandler(this);

    action.createParam(PARAM_PROJECT)
      .setDescription("Project key")
      .setExampleValue(KeyExamples.KEY_PROJECT_EXAMPLE_001);

    List<NotificationChannel> channels = notificationCenter.getChannels();
    action.createParam(PARAM_CHANNEL)
      .setDescription("Channel through which the notification is sent. For example, notifications can be sent by email.")
      .setPossibleValues(channels)
      .setDefaultValue(EmailNotificationChannel.class.getSimpleName());

    action.createParam(PARAM_TYPE)
      .setDescription("Notification type. Possible values are for:" +
        "<ul>" +
        "  <li>Global notifications: %s</li>" +
        "  <li>Per project notifications: %s</li>" +
        "</ul>",
        globalDispatchers.stream().sorted().collect(Collectors.joining(", ")),
        projectDispatchers.stream().sorted().collect(Collectors.joining(", ")))
      .setRequired(true)
      .setExampleValue(MyNewIssuesNotificationDispatcher.KEY);

    action.createParam(PARAM_LOGIN)
      .setDescription("User login")
      .setSince("6.4");
  }

  @Override
  public void handle(Request request, Response response) throws Exception {
    RemoveRequest removeRequest = toWsRequest(request);
    remove(removeRequest);

    response.noContent();
  }

  private void remove(RemoveRequest request) {
    try (DbSession dbSession = dbClient.openSession(false)) {
      checkPermissions(request);
      UserDto user = getUser(dbSession, request);
      Optional<ComponentDto> project = searchProject(dbSession, request);
      notificationUpdater.remove(dbSession, request.getChannel(), request.getType(), user, project.orElse(null));
      dbSession.commit();
    }
  }

  private UserDto getUser(DbSession dbSession, RemoveRequest request) {
    String login = request.getLogin() == null ? userSession.getLogin() : request.getLogin();
    return checkFound(dbClient.userDao().selectByLogin(dbSession, login), "User '%s' not found", login);
  }

  private Optional<ComponentDto> searchProject(DbSession dbSession, RemoveRequest request) {
    Optional<ComponentDto> project = request.getProject() == null ? empty() : Optional.of(componentFinder.getByKey(dbSession, request.getProject()));
    project.ifPresent(p -> checkRequest(Qualifiers.PROJECT.equals(p.qualifier()) && Scopes.PROJECT.equals(p.scope()),
      "Component '%s' must be a project", request.getProject()));
    return project;
  }

  private void checkPermissions(RemoveRequest request) {
    if (request.getLogin() == null) {
      userSession.checkLoggedIn();
    } else {
      userSession.checkIsSystemAdministrator();
    }
  }

  private RemoveRequest toWsRequest(Request request) {
    RemoveRequest.Builder requestBuilder = RemoveRequest.builder()
      .setType(request.mandatoryParam(PARAM_TYPE))
      .setChannel(request.mandatoryParam(PARAM_CHANNEL));
    setNullable(request.param(PARAM_PROJECT), requestBuilder::setProject);
    setNullable(request.param(PARAM_LOGIN), requestBuilder::setLogin);
    RemoveRequest wsRequest = requestBuilder.build();

    if (wsRequest.getProject() == null) {
      checkRequest(globalDispatchers.contains(wsRequest.getType()), "Value of parameter '%s' (%s) must be one of: %s",
        PARAM_TYPE,
        wsRequest.getType(),
        globalDispatchers);
    } else {
      checkRequest(projectDispatchers.contains(wsRequest.getType()), "Value of parameter '%s' (%s) must be one of: %s",
        PARAM_TYPE,
        wsRequest.getType(),
        projectDispatchers);
    }

    return wsRequest;
  }
}
