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
package org.sonar.server.authentication.ws;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Optional;
import javax.servlet.FilterChain;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.Before;
import org.junit.Test;
import org.sonar.api.config.MapSettings;
import org.sonar.api.config.Settings;
import org.sonar.server.authentication.BasicAuthenticator;
import org.sonar.server.authentication.JwtHttpHandler;
import org.sonar.server.authentication.event.AuthenticationException;
import org.sonar.test.JsonAssert;
import org.sonarqube.ws.MediaTypes;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.sonar.db.user.UserTesting.newUserDto;

public class ValidateActionTest {

  StringWriter stringWriter = new StringWriter();

  HttpServletRequest request = mock(HttpServletRequest.class);
  HttpServletResponse response = mock(HttpServletResponse.class);
  FilterChain chain = mock(FilterChain.class);

  BasicAuthenticator basicAuthenticator = mock(BasicAuthenticator.class);
  JwtHttpHandler jwtHttpHandler = mock(JwtHttpHandler.class);

  Settings settings = new MapSettings();

  ValidateAction underTest = new ValidateAction(settings, basicAuthenticator, jwtHttpHandler);

  @Before
  public void setUp() throws Exception {
    PrintWriter writer = new PrintWriter(stringWriter);
    when(response.getWriter()).thenReturn(writer);
  }

  @Test
  public void return_true_when_jwt_token_is_set() throws Exception {
    when(jwtHttpHandler.validateToken(request, response)).thenReturn(Optional.of(newUserDto()));
    when(basicAuthenticator.authenticate(request)).thenReturn(Optional.empty());

    underTest.doFilter(request, response, chain);

    verify(response).setContentType(MediaTypes.JSON);
    JsonAssert.assertJson(stringWriter.toString()).isSimilarTo("{\"valid\":true}");
  }

  @Test
  public void return_true_when_basic_auth() throws Exception {
    when(jwtHttpHandler.validateToken(request, response)).thenReturn(Optional.empty());
    when(basicAuthenticator.authenticate(request)).thenReturn(Optional.of(newUserDto()));

    underTest.doFilter(request, response, chain);

    verify(response).setContentType(MediaTypes.JSON);
    JsonAssert.assertJson(stringWriter.toString()).isSimilarTo("{\"valid\":true}");
  }

  @Test
  public void return_true_when_no_jwt_nor_basic_auth_and_no_force_authentication() throws Exception {
    settings.setProperty("sonar.forceAuthentication", "false");
    when(jwtHttpHandler.validateToken(request, response)).thenReturn(Optional.empty());
    when(basicAuthenticator.authenticate(request)).thenReturn(Optional.empty());

    underTest.doFilter(request, response, chain);

    verify(response).setContentType(MediaTypes.JSON);
    JsonAssert.assertJson(stringWriter.toString()).isSimilarTo("{\"valid\":true}");
  }

  @Test
  public void return_false_when_no_jwt_nor_basic_auth_and_force_authentication_is_true() throws Exception {
    settings.setProperty("sonar.forceAuthentication", "true");
    when(jwtHttpHandler.validateToken(request, response)).thenReturn(Optional.empty());
    when(basicAuthenticator.authenticate(request)).thenReturn(Optional.empty());

    underTest.doFilter(request, response, chain);

    verify(response).setContentType(MediaTypes.JSON);
    JsonAssert.assertJson(stringWriter.toString()).isSimilarTo("{\"valid\":false}");
  }

  @Test
  public void return_false_when_jwt_throws_unauthorized_exception() throws Exception {
    doThrow(AuthenticationException.class).when(jwtHttpHandler).validateToken(request, response);
    when(basicAuthenticator.authenticate(request)).thenReturn(Optional.empty());

    underTest.doFilter(request, response, chain);

    verify(response).setContentType(MediaTypes.JSON);
    JsonAssert.assertJson(stringWriter.toString()).isSimilarTo("{\"valid\":false}");
  }

  @Test
  public void return_false_when_basic_authenticator_throws_unauthorized_exception() throws Exception {
    when(jwtHttpHandler.validateToken(request, response)).thenReturn(Optional.empty());
    doThrow(AuthenticationException.class).when(basicAuthenticator).authenticate(request);

    underTest.doFilter(request, response, chain);

    verify(response).setContentType(MediaTypes.JSON);
    JsonAssert.assertJson(stringWriter.toString()).isSimilarTo("{\"valid\":false}");
  }
}
