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
package org.sonar.server.test.ws;

import com.google.common.base.Function;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.google.common.io.Resources;
import java.util.List;
import java.util.Map;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import org.apache.commons.lang.StringUtils;
import org.sonar.api.server.ws.Request;
import org.sonar.api.server.ws.Response;
import org.sonar.api.server.ws.WebService;
import org.sonar.api.web.UserRole;
import org.sonar.core.util.Uuids;
import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.db.component.ComponentDto;
import org.sonar.server.component.ComponentFinder;
import org.sonar.server.es.SearchOptions;
import org.sonar.server.es.SearchResult;
import org.sonar.server.test.index.CoveredFileDoc;
import org.sonar.server.test.index.TestDoc;
import org.sonar.server.test.index.TestIndex;
import org.sonar.server.user.UserSession;
import org.sonar.server.ws.KeyExamples;
import org.sonar.server.ws.WsUtils;
import org.sonarqube.ws.Common;
import org.sonarqube.ws.WsTests;

import static org.sonar.server.es.SearchOptions.MAX_LIMIT;
import static org.sonar.server.ws.WsUtils.checkFoundWithOptional;

public class ListAction implements TestsWsAction {
  public static final String TEST_ID = "testId";
  public static final String TEST_FILE_ID = "testFileId";
  public static final String TEST_FILE_KEY = "testFileKey";
  public static final String SOURCE_FILE_ID = "sourceFileId";
  public static final String SOURCE_FILE_KEY = "sourceFileKey";
  public static final String SOURCE_FILE_LINE_NUMBER = "sourceFileLineNumber";

  private final DbClient dbClient;
  private final TestIndex testIndex;
  private final UserSession userSession;
  private final ComponentFinder componentFinder;

  public ListAction(DbClient dbClient, TestIndex testIndex, UserSession userSession, ComponentFinder componentFinder) {
    this.dbClient = dbClient;
    this.testIndex = testIndex;
    this.userSession = userSession;
    this.componentFinder = componentFinder;
  }

  @Override
  public void define(WebService.NewController controller) {
    WebService.NewAction action = controller
      .createAction("list")
      .setDescription(String.format(
        "Get the list of tests either in a test file or that test a given line of source code.<br /> " +
          "Require Browse permission on the file's project.<br /> " +
          "One (and only one) of the following combination of parameters must be provided: " +
          "<ul>" +
          "<li>%s - get a specific test</li>" +
          "<li>%s - get the tests in a test file</li>" +
          "<li>%s - get the tests in a test file</li>" +
          "<li>%s and %6$s - get the tests that cover a specific line of code</li>" +
          "<li>%s and %6$s - get the tests that cover a specific line of code</li>" +
          "</ul>",
        TEST_ID, TEST_FILE_ID, TEST_FILE_KEY, SOURCE_FILE_ID, SOURCE_FILE_KEY, SOURCE_FILE_LINE_NUMBER))
      .setSince("5.2")
      .setResponseExample(Resources.getResource(getClass(), "tests-example-list.json"))
      .setDeprecatedSince("5.6")
      .setHandler(this)
      .addPagingParams(100, MAX_LIMIT);

    action
      .createParam(TEST_FILE_ID)
      .setDescription("ID of test file")
      .setExampleValue(Uuids.UUID_EXAMPLE_01);

    action
      .createParam(TEST_FILE_KEY)
      .setDescription("Key of test file")
      .setExampleValue("MY_PROJECT:src/test/java/foo/BarTest.java");

    action
      .createParam(TEST_ID)
      .setDescription("ID of test")
      .setExampleValue(Uuids.UUID_EXAMPLE_02);

    action
      .createParam(SOURCE_FILE_ID)
      .setDescription("ID of source file. Must be provided with the source file line number.")
      .setExampleValue(Uuids.UUID_EXAMPLE_03);

    action
      .createParam(SOURCE_FILE_KEY)
      .setSince("5.4")
      .setDescription("Key of source file. Must be provided with the source file line number.")
      .setExampleValue(KeyExamples.KEY_FILE_EXAMPLE_001);

    action
      .createParam(SOURCE_FILE_LINE_NUMBER)
      .setDescription("Source file line number. Must be provided with the source file ID or key.")
      .setExampleValue("10");
  }

  @Override
  public void handle(Request request, Response response) throws Exception {
    String testUuid = request.param(TEST_ID);
    String testFileUuid = request.param(TEST_FILE_ID);
    String testFileKey = request.param(TEST_FILE_KEY);
    String sourceFileUuid = request.param(SOURCE_FILE_ID);
    String sourceFileKey = request.param(SOURCE_FILE_KEY);
    Integer sourceFileLineNumber = request.paramAsInt(SOURCE_FILE_LINE_NUMBER);
    SearchOptions searchOptions = new SearchOptions().setPage(
      request.mandatoryParamAsInt(WebService.Param.PAGE),
      request.mandatoryParamAsInt(WebService.Param.PAGE_SIZE));

    SearchResult<TestDoc> tests;
    Map<String, ComponentDto> componentsByTestFileUuid;
    try (DbSession dbSession = dbClient.openSession(false)) {
      tests = searchTests(dbSession, testUuid, testFileUuid, testFileKey, sourceFileUuid, sourceFileKey, sourceFileLineNumber, searchOptions);
      componentsByTestFileUuid = buildComponentsByTestFileUuid(dbSession, tests.getDocs());
    }

    WsTests.ListResponse.Builder responseBuilder = WsTests.ListResponse.newBuilder();
    responseBuilder.setPaging(Common.Paging.newBuilder()
      .setPageIndex(searchOptions.getPage())
      .setPageSize(searchOptions.getLimit())
      .setTotal((int) tests.getTotal())
      .build());

    for (TestDoc testDoc : tests.getDocs()) {
      WsTests.Test.Builder testBuilder = WsTests.Test.newBuilder();
      testBuilder.setId(testDoc.testUuid());
      testBuilder.setName(StringUtils.defaultString(testDoc.name()));
      testBuilder.setFileId(testDoc.fileUuid());
      ComponentDto component = componentsByTestFileUuid.get(testDoc.fileUuid());
      if (component != null) {
        testBuilder.setFileKey(component.getKey());
        testBuilder.setFileName(component.longName());
      }
      testBuilder.setStatus(WsTests.TestStatus.valueOf(testDoc.status()));
      if (testDoc.durationInMs() != null) {
        testBuilder.setDurationInMs(testDoc.durationInMs());
      }
      testBuilder.setCoveredLines(coveredLines(testDoc.coveredFiles()));
      if (testDoc.message() != null) {
        testBuilder.setMessage(testDoc.message());
      }
      if (testDoc.stackTrace() != null) {
        testBuilder.setStacktrace(testDoc.stackTrace());
      }
      responseBuilder.addTests(testBuilder.build());
    }
    WsUtils.writeProtobuf(responseBuilder.build(), request, response);
  }

  private static int coveredLines(List<CoveredFileDoc> coveredFiles) {
    int numberOfLinesCovered = 0;
    for (CoveredFileDoc coveredFile : coveredFiles) {
      numberOfLinesCovered += coveredFile.coveredLines().size();
    }

    return numberOfLinesCovered;
  }

  private Map<String, ComponentDto> buildComponentsByTestFileUuid(DbSession dbSession, List<TestDoc> tests) {
    List<String> fileUuids = Lists.transform(tests, new TestToFileUuidFunction());
    List<ComponentDto> components = dbClient.componentDao().selectByUuids(dbSession, fileUuids);

    return Maps.uniqueIndex(components, ComponentDto::uuid);
  }

  private SearchResult<TestDoc> searchTests(DbSession dbSession, @Nullable String testUuid, @Nullable String testFileUuid, @Nullable String testFileKey,
    @Nullable String sourceFileUuid, @Nullable String sourceFileKey, @Nullable Integer sourceFileLineNumber, SearchOptions searchOptions) {
    if (testUuid != null) {
      return searchTestsByTestUuid(dbSession, testUuid, searchOptions);
    }
    if (testFileUuid != null) {
      return searchTestsByTestFileUuid(dbSession, testFileUuid, searchOptions);
    }
    if (testFileKey != null) {
      return searchTestsByTestFileKey(dbSession, testFileKey, searchOptions);
    }
    if (sourceFileUuid != null && sourceFileLineNumber != null) {
      return searchTestsBySourceFileUuidAndLineNumber(dbSession, sourceFileUuid, sourceFileLineNumber, searchOptions);
    }
    if (sourceFileKey != null && sourceFileLineNumber != null) {
      ComponentDto component = componentFinder.getByKey(dbSession, sourceFileKey);
      return searchTestsBySourceFileUuidAndLineNumber(dbSession, component.uuid(), sourceFileLineNumber, searchOptions);
    }

    throw new IllegalArgumentException(
      "One (and only one) of the following combination of parameters must be provided: 1) test UUID. 2) test file UUID. " +
        "3) test file key. 4) source file ID or key with a source file line number.");
  }

  private SearchResult<TestDoc> searchTestsBySourceFileUuidAndLineNumber(DbSession dbSession, String sourceFileUuid, Integer sourceFileLineNumber, SearchOptions searchOptions) {
    checkComponentUuidPermission(dbSession, sourceFileUuid);
    return testIndex.searchBySourceFileUuidAndLineNumber(sourceFileUuid, sourceFileLineNumber, searchOptions);
  }

  private SearchResult<TestDoc> searchTestsByTestFileKey(DbSession dbSession, String testFileKey, SearchOptions searchOptions) {
    ComponentDto testFile = componentFinder.getByKey(dbSession, testFileKey);
    userSession.checkComponentPermission(UserRole.CODEVIEWER, testFile);
    return testIndex.searchByTestFileUuid(testFile.uuid(), searchOptions);
  }

  private SearchResult<TestDoc> searchTestsByTestFileUuid(DbSession dbSession, String testFileUuid, SearchOptions searchOptions) {
    checkComponentUuidPermission(dbSession, testFileUuid);
    return testIndex.searchByTestFileUuid(testFileUuid, searchOptions);
  }

  private SearchResult<TestDoc> searchTestsByTestUuid(DbSession dbSession, String testUuid, SearchOptions searchOptions) {
    TestDoc testDoc = checkFoundWithOptional(testIndex.getNullableByTestUuid(testUuid), "Test with id '%s' is not found", testUuid);
    checkComponentUuidPermission(dbSession, testDoc.fileUuid());
    return testIndex.searchByTestUuid(testUuid, searchOptions);
  }

  private void checkComponentUuidPermission(DbSession dbSession, String componentUuid) {
    ComponentDto component = componentFinder.getByUuid(dbSession, componentUuid);
    userSession.checkComponentPermission(UserRole.CODEVIEWER, component);
  }

  private static class TestToFileUuidFunction implements Function<TestDoc, String> {
    @Override
    public String apply(@Nonnull TestDoc testDoc) {
      return testDoc.fileUuid();
    }
  }
}
