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
package org.sonar.server.issue.ws;

import com.google.common.collect.Collections2;
import com.google.common.collect.Lists;
import java.util.Collection;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.Nullable;
import org.sonar.api.issue.Issue;
import org.sonar.api.rule.RuleKey;
import org.sonar.api.rule.Severity;
import org.sonar.api.rules.RuleType;
import org.sonar.api.server.ws.Request;
import org.sonar.api.server.ws.Response;
import org.sonar.api.server.ws.WebService;
import org.sonar.api.server.ws.WebService.Param;
import org.sonar.api.utils.Paging;
import org.sonar.core.util.stream.MoreCollectors;
import org.sonar.server.es.Facets;
import org.sonar.server.es.SearchOptions;
import org.sonar.server.es.SearchResult;
import org.sonar.server.issue.IssueQuery;
import org.sonar.server.issue.IssueQueryFactory;
import org.sonar.server.issue.index.IssueDoc;
import org.sonar.server.issue.index.IssueIndex;
import org.sonar.server.user.UserSession;
import org.sonarqube.ws.Issues.SearchWsResponse;
import org.sonarqube.ws.client.issue.SearchWsRequest;

import static com.google.common.collect.Iterables.concat;
import static java.lang.String.format;
import static java.util.Collections.singletonList;
import static org.sonar.api.utils.Paging.forPageIndex;
import static org.sonar.server.es.SearchOptions.MAX_LIMIT;
import static org.sonar.server.ws.KeyExamples.KEY_PROJECT_EXAMPLE_001;
import static org.sonar.server.ws.WsUtils.writeProtobuf;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.ACTION_SEARCH;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.DEPRECATED_FACET_MODE_DEBT;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.DEPRECATED_PARAM_ACTION_PLANS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.FACET_ASSIGNED_TO_ME;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.FACET_MODE;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.FACET_MODE_COUNT;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.FACET_MODE_EFFORT;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_ADDITIONAL_FIELDS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_ASC;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_ASSIGNED;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_ASSIGNEES;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_AUTHORS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_COMPONENTS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_COMPONENT_KEYS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_COMPONENT_ROOTS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_COMPONENT_ROOT_UUIDS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_COMPONENT_UUIDS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_CREATED_AFTER;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_CREATED_AT;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_CREATED_BEFORE;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_CREATED_IN_LAST;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_DIRECTORIES;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_FILE_UUIDS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_ISSUES;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_LANGUAGES;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_MODULE_UUIDS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_ON_COMPONENT_ONLY;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_ORGANIZATION;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_PLANNED;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_PROJECTS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_PROJECT_KEYS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_PROJECT_UUIDS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_RESOLUTIONS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_RESOLVED;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_RULES;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_SEVERITIES;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_SINCE_LEAK_PERIOD;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_STATUSES;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_TAGS;
import static org.sonarqube.ws.client.issue.IssuesWsParameters.PARAM_TYPES;

public class SearchAction implements IssuesWsAction {

  private static final String INTERNAL_PARAMETER_DISCLAIMER = "This parameter is mostly used by the Issues page, please prefer usage of the componentKeys parameter. ";

  private final UserSession userSession;
  private final IssueIndex issueIndex;
  private final IssueQueryFactory issueQueryFactory;
  private final SearchResponseLoader searchResponseLoader;
  private final SearchResponseFormat searchResponseFormat;

  public SearchAction(UserSession userSession, IssueIndex issueIndex, IssueQueryFactory issueQueryFactory,
    SearchResponseLoader searchResponseLoader, SearchResponseFormat searchResponseFormat) {
    this.userSession = userSession;
    this.issueIndex = issueIndex;
    this.issueQueryFactory = issueQueryFactory;
    this.searchResponseLoader = searchResponseLoader;
    this.searchResponseFormat = searchResponseFormat;
  }

  @Override
  public void define(WebService.NewController controller) {
    WebService.NewAction action = controller
      .createAction(ACTION_SEARCH)
      .setHandler(this)
      .setDescription(
        "Search for issues. Requires Browse permission on project(s).<br>" +
          "At most one of the following parameters can be provided at the same time: %s, %s, %s, %s, %s<br>" +
          "Since 5.5, response field 'debt' has been renamed to 'effort'.<br>" +
          "Since 5.5, response field 'actionPlan' has been removed.<br>" +
          "Since 5.5, response field 'reporter' has been removed, as manual issue feature has been dropped." +
          "Since 6.3, response field 'email' has been replaced by 'avatar'",
        PARAM_COMPONENT_KEYS, PARAM_COMPONENT_UUIDS, PARAM_COMPONENTS, PARAM_COMPONENT_ROOT_UUIDS, PARAM_COMPONENT_ROOTS)
      .setSince("3.6")
      .setResponseExample(getClass().getResource("search-example.json"));

    action.addPagingParams(100, MAX_LIMIT);
    action.createParam(Param.FACETS)
      .setDescription("Comma-separated list of the facets to be computed. No facet is computed by default.<br/>" +
        "Since 5.5, facet 'actionPlans' is deprecated.<br/>" +
        "Since 5.5, facet 'reporters' is deprecated.")
      .setPossibleValues(IssueIndex.SUPPORTED_FACETS);
    action.createParam(FACET_MODE)
      .setDefaultValue(FACET_MODE_COUNT)
      .setDescription("Choose the returned value for facet items, either count of issues or sum of debt.<br/>" +
        "Since 5.5, 'debt' mode is deprecated and replaced by 'effort'")
      .setPossibleValues(FACET_MODE_COUNT, FACET_MODE_EFFORT, DEPRECATED_FACET_MODE_DEBT);
    action.addSortParams(IssueQuery.SORTS, null, true);
    action.createParam(PARAM_ADDITIONAL_FIELDS)
      .setSince("5.2")
      .setDescription("Comma-separated list of the optional fields to be returned in response. Action plans are dropped in 5.5, it is not returned in the response.")
      .setPossibleValues(SearchAdditionalField.possibleValues());
    addComponentRelatedParams(action);
    action.createParam(PARAM_ISSUES)
      .setDescription("Comma-separated list of issue keys")
      .setExampleValue("5bccd6e8-f525-43a2-8d76-fcb13dde79ef");
    action.createParam(PARAM_SEVERITIES)
      .setDescription("Comma-separated list of severities")
      .setExampleValue(Severity.BLOCKER + "," + Severity.CRITICAL)
      .setPossibleValues(Severity.ALL);
    action.createParam(PARAM_STATUSES)
      .setDescription("Comma-separated list of statuses")
      .setExampleValue(Issue.STATUS_OPEN + "," + Issue.STATUS_REOPENED)
      .setPossibleValues(Issue.STATUSES);
    action.createParam(PARAM_RESOLUTIONS)
      .setDescription("Comma-separated list of resolutions")
      .setExampleValue(Issue.RESOLUTION_FIXED + "," + Issue.RESOLUTION_REMOVED)
      .setPossibleValues(Issue.RESOLUTIONS);
    action.createParam(PARAM_RESOLVED)
      .setDescription("To match resolved or unresolved issues")
      .setBooleanPossibleValues();
    action.createParam(PARAM_RULES)
      .setDescription("Comma-separated list of coding rule keys. Format is &lt;repository&gt;:&lt;rule&gt;")
      .setExampleValue("squid:AvoidCycles");
    action.createParam(PARAM_TAGS)
      .setDescription("Comma-separated list of tags.")
      .setExampleValue("security,convention");
    action.createParam(PARAM_TYPES)
      .setDescription("Comma-separated list of types.")
      .setSince("5.5")
      .setPossibleValues(RuleType.values())
      .setExampleValue(format("%s,%s", RuleType.CODE_SMELL, RuleType.BUG));
    action.createParam(DEPRECATED_PARAM_ACTION_PLANS)
      .setDescription("Action plans are dropped in 5.5. This parameter has no effect. Comma-separated list of action plan keys (not names)")
      .setDeprecatedSince("5.5")
      .setExampleValue("3f19de90-1521-4482-a737-a311758ff513");
    action.createParam(PARAM_PLANNED)
      .setDescription("Since 5.5 this parameter is no more used, as action plan feature has been dropped")
      .setDeprecatedSince("5.5")
      .setBooleanPossibleValues();
    action.createParam("reporters")
      .setDescription("Since 5.5 this parameter is no more used, as manual issue feature has been dropped")
      .setExampleValue("admin")
      .setDeprecatedSince("5.5");
    action.createParam(PARAM_AUTHORS)
      .setDescription("Comma-separated list of SCM accounts")
      .setExampleValue("torvalds@linux-foundation.org");
    action.createParam(PARAM_ASSIGNEES)
      .setDescription("Comma-separated list of assignee logins. The value '__me__' can be used as a placeholder for user who performs the request")
      .setExampleValue("admin,usera,__me__");
    action.createParam(PARAM_ASSIGNED)
      .setDescription("To retrieve assigned or unassigned issues")
      .setBooleanPossibleValues();
    action.createParam(PARAM_LANGUAGES)
      .setDescription("Comma-separated list of languages. Available since 4.4")
      .setExampleValue("java,js");
    action.createParam(PARAM_CREATED_AT)
      .setDescription("To retrieve issues created in a specific analysis, identified by an ISO-formatted datetime stamp.")
      .setExampleValue("2013-05-01T13:00:00+0100");
    action.createParam(PARAM_CREATED_AFTER)
      .setDescription("To retrieve issues created after the given date (inclusive). Format: date or datetime ISO formats. If this parameter is set, createdSince must not be set")
      .setExampleValue("2013-05-01 (or 2013-05-01T13:00:00+0100)");
    action.createParam(PARAM_CREATED_BEFORE)
      .setDescription("To retrieve issues created before the given date (exclusive). Format: date or datetime ISO formats")
      .setExampleValue("2013-05-01 (or 2013-05-01T13:00:00+0100)");
    action.createParam(PARAM_CREATED_IN_LAST)
      .setDescription("To retrieve issues created during a time span before the current time (exclusive). " +
        "Accepted units are 'y' for year, 'm' for month, 'w' for week and 'd' for day. " +
        "If this parameter is set, createdAfter must not be set")
      .setExampleValue("1m2w (1 month 2 weeks)");
    action.createParam(PARAM_SINCE_LEAK_PERIOD)
      .setDescription("To retrieve issues created since the leak period.<br>" +
        "If this parameter is set to a truthy value, createdAfter must not be set and one component id or key must be provided.")
      .setBooleanPossibleValues()
      .setDefaultValue("false");
  }

  private static void addComponentRelatedParams(WebService.NewAction action) {
    action.createParam(PARAM_ON_COMPONENT_ONLY)
      .setDescription("Return only issues at a component's level, not on its descendants (modules, directories, files, etc). " +
        "This parameter is only considered when componentKeys or componentUuids is set. " +
        "Using the deprecated componentRoots or componentRootUuids parameters will set this parameter to false. " +
        "Using the deprecated components parameter will set this parameter to true.")
      .setBooleanPossibleValues()
      .setDefaultValue("false");

    action.createParam(PARAM_COMPONENT_KEYS)
      .setDescription("To retrieve issues associated to a specific list of components sub-components (comma-separated list of component keys). " +
        "A component can be a view, project, module, directory or file.")
      .setExampleValue(KEY_PROJECT_EXAMPLE_001);
    action.createParam(PARAM_COMPONENTS)
      .setDeprecatedSince("5.1")
      .setDescription("If used, will have the same meaning as componentKeys AND onComponentOnly=true.");
    action.createParam(PARAM_COMPONENT_UUIDS)
      .setDescription("To retrieve issues associated to a specific list of components their sub-components (comma-separated list of component UUIDs). " +
        INTERNAL_PARAMETER_DISCLAIMER +
        "A component can be a project, module, directory or file.")
      .setExampleValue("584a89f2-8037-4f7b-b82c-8b45d2d63fb2");
    action.createParam(PARAM_COMPONENT_ROOTS)
      .setDeprecatedSince("5.1")
      .setDescription("If used, will have the same meaning as componentKeys AND onComponentOnly=false.");
    action.createParam(PARAM_COMPONENT_ROOT_UUIDS)
      .setDeprecatedSince("5.1")
      .setDescription("If used, will have the same meaning as componentUuids AND onComponentOnly=false.");

    action.createParam(PARAM_PROJECTS)
      .setDeprecatedSince("5.1")
      .setDescription("See projectKeys");

    action.createParam(PARAM_PROJECT_KEYS)
      .setDescription("To retrieve issues associated to a specific list of projects (comma-separated list of project keys). " +
        INTERNAL_PARAMETER_DISCLAIMER +
        "If this parameter is set, projectUuids must not be set.")
      .setDeprecatedKey(PARAM_PROJECTS, "6.3")
      .setExampleValue(KEY_PROJECT_EXAMPLE_001);

    action.createParam(PARAM_PROJECT_UUIDS)
      .setDescription("To retrieve issues associated to a specific list of projects (comma-separated list of project UUIDs). " +
        INTERNAL_PARAMETER_DISCLAIMER +
        "Views are not supported. If this parameter is set, projectKeys must not be set.")
      .setExampleValue("7d8749e8-3070-4903-9188-bdd82933bb92");

    action.createParam(PARAM_MODULE_UUIDS)
      .setDescription("To retrieve issues associated to a specific list of modules (comma-separated list of module UUIDs). " +
        INTERNAL_PARAMETER_DISCLAIMER +
        "Views are not supported. If this parameter is set, moduleKeys must not be set.")
      .setExampleValue("7d8749e8-3070-4903-9188-bdd82933bb92");

    action.createParam(PARAM_DIRECTORIES)
      .setDescription("To retrieve issues associated to a specific list of directories (comma-separated list of directory paths). " +
        "This parameter is only meaningful when a module is selected. " +
        INTERNAL_PARAMETER_DISCLAIMER)
      .setSince("5.1")
      .setExampleValue("src/main/java/org/sonar/server/");

    action.createParam(PARAM_FILE_UUIDS)
      .setDescription("To retrieve issues associated to a specific list of files (comma-separated list of file UUIDs). " +
        INTERNAL_PARAMETER_DISCLAIMER)
      .setExampleValue("bdd82933-3070-4903-9188-7d8749e8bb92");

    action.createParam(PARAM_ORGANIZATION)
      .setDescription("Organization key")
      .setRequired(false)
      .setInternal(true)
      .setExampleValue("my-org")
      .setSince("6.4");
  }

  @Override
  public final void handle(Request request, Response response) throws Exception {
    SearchWsResponse searchWsResponse = doHandle(toSearchWsRequest(request), request);
    writeProtobuf(searchWsResponse, request, response);
  }

  private SearchWsResponse doHandle(SearchWsRequest request, Request wsRequest) {
    // prepare the Elasticsearch request
    SearchOptions options = createSearchOptionsFromRequest(request);
    EnumSet<SearchAdditionalField> additionalFields = SearchAdditionalField.getFromRequest(request);
    IssueQuery query = issueQueryFactory.create(request);

    // execute request
    SearchResult<IssueDoc> result = issueIndex.search(query, options);
    List<String> issueKeys = result.getDocs().stream().map(IssueDoc::key).collect(MoreCollectors.toList(result.getDocs().size()));

    // load the additional information to be returned in response
    SearchResponseLoader.Collector collector = new SearchResponseLoader.Collector(additionalFields, issueKeys);
    collectLoggedInUser(collector);
    collectRequestParams(collector, request);
    Facets facets = null;
    if (!options.getFacets().isEmpty()) {
      facets = result.getFacets();
      // add missing values to facets. For example if assignee "john" and facet on "assignees" are requested, then
      // "john" should always be listed in the facet. If it is not present, then it is added with value zero.
      // This is a constraint from webapp UX.
      completeFacets(facets, request, wsRequest);
      collectFacets(collector, facets);
    }
    SearchResponseData data = searchResponseLoader.load(collector, facets);

    // format response

    // Filter and reorder facets according to the requested ordered names.
    // Must be done after loading of data as the "hidden" facet "debt"
    // can be used to get total debt.
    facets = reorderFacets(facets, options.getFacets());

    // FIXME allow long in Paging
    Paging paging = forPageIndex(options.getPage()).withPageSize(options.getLimit()).andTotal((int) result.getTotal());

    return searchResponseFormat.formatSearch(additionalFields, data, paging, facets);
  }

  private static SearchOptions createSearchOptionsFromRequest(SearchWsRequest request) {
    SearchOptions options = new SearchOptions();
    options.setPage(request.getPage(), request.getPageSize());
    options.addFacets(request.getFacets());

    return options;
  }

  private static Facets reorderFacets(@Nullable Facets facets, Collection<String> orderedNames) {
    if (facets == null) {
      return null;
    }
    LinkedHashMap<String, LinkedHashMap<String, Long>> orderedFacets = new LinkedHashMap<>();
    for (String facetName : orderedNames) {
      LinkedHashMap<String, Long> facet = facets.get(facetName);
      if (facet != null) {
        orderedFacets.put(facetName, facet);
      }
    }
    return new Facets(orderedFacets);
  }

  private void completeFacets(Facets facets, SearchWsRequest request, Request wsRequest) {
    addMandatoryValuesToFacet(facets, PARAM_SEVERITIES, Severity.ALL);
    addMandatoryValuesToFacet(facets, PARAM_STATUSES, Issue.STATUSES);
    addMandatoryValuesToFacet(facets, PARAM_RESOLUTIONS, concat(singletonList(""), Issue.RESOLUTIONS));
    addMandatoryValuesToFacet(facets, PARAM_PROJECT_UUIDS, request.getProjectUuids());

    List<String> assignees = Lists.newArrayList("");
    List<String> assigneesFromRequest = request.getAssignees();
    if (assigneesFromRequest != null) {
      assignees.addAll(assigneesFromRequest);
      assignees.remove(IssueQueryFactory.LOGIN_MYSELF);
    }
    addMandatoryValuesToFacet(facets, PARAM_ASSIGNEES, assignees);
    addMandatoryValuesToFacet(facets, FACET_ASSIGNED_TO_ME, singletonList(userSession.getLogin()));
    addMandatoryValuesToFacet(facets, PARAM_RULES, request.getRules());
    addMandatoryValuesToFacet(facets, PARAM_LANGUAGES, request.getLanguages());
    addMandatoryValuesToFacet(facets, PARAM_TAGS, request.getTags());
    addMandatoryValuesToFacet(facets, PARAM_TYPES, RuleType.names());
    addMandatoryValuesToFacet(facets, PARAM_COMPONENT_UUIDS, request.getComponentUuids());

    List<String> requestedFacets = request.getFacets();
    if (requestedFacets == null) {
      return;
    }
    requestedFacets.stream()
      .filter(facetName -> !FACET_ASSIGNED_TO_ME.equals(facetName))
      .forEach(facetName -> {
        LinkedHashMap<String, Long> buckets = facets.get(facetName);
        List<String> requestParams = wsRequest.paramAsStrings(facetName);
        if (buckets == null || requestParams == null) {
          return;
        }
        requestParams.stream()
          .filter(param -> !buckets.containsKey(param) && !IssueQueryFactory.LOGIN_MYSELF.equals(param))
          // Prevent appearance of a glitch value due to dedicated parameter for this facet
          .forEach(param -> buckets.put(param, 0L));
      });
  }

  private static void addMandatoryValuesToFacet(Facets facets, String facetName, @Nullable Iterable<String> mandatoryValues) {
    Map<String, Long> buckets = facets.get(facetName);
    if (buckets != null && mandatoryValues != null) {
      for (String mandatoryValue : mandatoryValues) {
        if (!buckets.containsKey(mandatoryValue)) {
          buckets.put(mandatoryValue, 0L);
        }
      }
    }
  }

  private void collectLoggedInUser(SearchResponseLoader.Collector collector) {
    if (userSession.isLoggedIn()) {
      collector.add(SearchAdditionalField.USERS, userSession.getLogin());
    }
  }

  private void collectFacets(SearchResponseLoader.Collector collector, Facets facets) {
    Set<String> facetRules = facets.getBucketKeys(PARAM_RULES);
    if (facetRules != null) {
      collector.addAll(SearchAdditionalField.RULES, Collections2.transform(facetRules, RuleKey::parse));
    }
    collector.addProjectUuids(facets.getBucketKeys(PARAM_PROJECT_UUIDS));
    collector.addComponentUuids(facets.getBucketKeys(PARAM_COMPONENT_UUIDS));
    collector.addComponentUuids(facets.getBucketKeys(PARAM_FILE_UUIDS));
    collector.addComponentUuids(facets.getBucketKeys(PARAM_MODULE_UUIDS));
    collector.addAll(SearchAdditionalField.USERS, facets.getBucketKeys(PARAM_ASSIGNEES));
  }

  private void collectRequestParams(SearchResponseLoader.Collector collector, SearchWsRequest request) {
    collector.addProjectUuids(request.getProjectUuids());
    collector.addComponentUuids(request.getFileUuids());
    collector.addComponentUuids(request.getModuleUuids());
    collector.addComponentUuids(request.getComponentRootUuids());
    collector.addAll(SearchAdditionalField.USERS, request.getAssignees());
  }

  private static SearchWsRequest toSearchWsRequest(Request request) {
    return new SearchWsRequest()
      .setAdditionalFields(request.paramAsStrings(PARAM_ADDITIONAL_FIELDS))
      .setAsc(request.paramAsBoolean(PARAM_ASC))
      .setAssigned(request.paramAsBoolean(PARAM_ASSIGNED))
      .setAssignees(request.paramAsStrings(PARAM_ASSIGNEES))
      .setAuthors(request.paramAsStrings(PARAM_AUTHORS))
      .setComponentKeys(request.paramAsStrings(PARAM_COMPONENT_KEYS))
      .setComponentRootUuids(request.paramAsStrings(PARAM_COMPONENT_ROOT_UUIDS))
      .setComponentRoots(request.paramAsStrings(PARAM_COMPONENT_ROOTS))
      .setComponentUuids(request.paramAsStrings(PARAM_COMPONENT_UUIDS))
      .setComponents(request.paramAsStrings(PARAM_COMPONENTS))
      .setCreatedAfter(request.param(PARAM_CREATED_AFTER))
      .setCreatedAt(request.param(PARAM_CREATED_AT))
      .setCreatedBefore(request.param(PARAM_CREATED_BEFORE))
      .setCreatedInLast(request.param(PARAM_CREATED_IN_LAST))
      .setDirectories(request.paramAsStrings(PARAM_DIRECTORIES))
      .setFacetMode(request.mandatoryParam(FACET_MODE))
      .setFacets(request.paramAsStrings(Param.FACETS))
      .setFileUuids(request.paramAsStrings(PARAM_FILE_UUIDS))
      .setIssues(request.paramAsStrings(PARAM_ISSUES))
      .setLanguages(request.paramAsStrings(PARAM_LANGUAGES))
      .setModuleUuids(request.paramAsStrings(PARAM_MODULE_UUIDS))
      .setOnComponentOnly(request.paramAsBoolean(PARAM_ON_COMPONENT_ONLY))
      .setOrganization(request.param(PARAM_ORGANIZATION))
      .setPage(request.mandatoryParamAsInt(Param.PAGE))
      .setPageSize(request.mandatoryParamAsInt(Param.PAGE_SIZE))
      .setProjectKeys(request.paramAsStrings(PARAM_PROJECT_KEYS))
      .setProjectUuids(request.paramAsStrings(PARAM_PROJECT_UUIDS))
      .setProjects(request.paramAsStrings(PARAM_PROJECTS))
      .setResolutions(request.paramAsStrings(PARAM_RESOLUTIONS))
      .setResolved(request.paramAsBoolean(PARAM_RESOLVED))
      .setRules(request.paramAsStrings(PARAM_RULES))
      .setSinceLeakPeriod(request.mandatoryParamAsBoolean(PARAM_SINCE_LEAK_PERIOD))
      .setSort(request.param(Param.SORT))
      .setSeverities(request.paramAsStrings(PARAM_SEVERITIES))
      .setStatuses(request.paramAsStrings(PARAM_STATUSES))
      .setTags(request.paramAsStrings(PARAM_TAGS))
      .setTypes(request.paramAsStrings(PARAM_TYPES));
  }
}
