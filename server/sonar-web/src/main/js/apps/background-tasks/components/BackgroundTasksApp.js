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
// @flow
import React from 'react';
import Helmet from 'react-helmet';
import { debounce, uniq } from 'lodash';
import { connect } from 'react-redux';
import { DEFAULT_FILTERS, DEBOUNCE_DELAY, STATUSES, CURRENTS } from './../constants';
import Header from './Header';
import Footer from './Footer';
import Stats from '../components/Stats';
import Search from '../components/Search';
import Tasks from '../components/Tasks';
import {
  getTypes,
  getActivity,
  getStatus,
  cancelAllTasks,
  cancelTask as cancelTaskAPI
} from '../../../api/ce';
import { updateTask, mapFiltersToParameters } from '../utils';
import { Task } from '../types';
import { getComponent } from '../../../store/rootReducer';
import '../background-tasks.css';
import { fetchOrganizations } from '../../../store/rootActions';
import { translate } from '../../../helpers/l10n';

type Props = {
  component: Object,
  location: Object,
  fetchOrganizations: Array<string> => string
};

type State = {
  loading: boolean,
  tasks: Array<*>,
  types?: Array<*>,
  query: string,
  pendingCount: number,
  failingCount: number
};

class BackgroundTasksApp extends React.PureComponent {
  loadTasksDebounced: Function;
  mounted: boolean;
  props: Props;

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  state: State = {
    loading: true,
    tasks: [],

    // filters
    query: '',

    // stats
    pendingCount: 0,
    failingCount: 0
  };

  componentWillMount() {
    this.loadTasksDebounced = debounce(this.loadTasks.bind(this), DEBOUNCE_DELAY);
  }

  componentDidMount() {
    this.mounted = true;

    getTypes().then(types => {
      this.setState({ types });
      this.loadTasks();
    });
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.component !== this.props.component ||
      prevProps.location !== this.props.location
    ) {
      this.loadTasksDebounced();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  loadTasks() {
    this.setState({ loading: true });

    const status = this.props.location.query.status || DEFAULT_FILTERS.status;
    const taskType = this.props.location.query.taskType || DEFAULT_FILTERS.taskType;
    const currents = this.props.location.query.currents || DEFAULT_FILTERS.currents;
    const minSubmittedAt =
      this.props.location.query.minSubmittedAt || DEFAULT_FILTERS.minSubmittedAt;
    const maxExecutedAt = this.props.location.query.maxExecutedAt || DEFAULT_FILTERS.maxExecutedAt;
    const query = this.props.location.query.query || DEFAULT_FILTERS.query;

    const filters = { status, taskType, currents, minSubmittedAt, maxExecutedAt, query };
    const parameters: Object = mapFiltersToParameters(filters);

    if (this.props.component) {
      parameters.componentId = this.props.component.id;
    }

    Promise.all([getActivity(parameters), getStatus(parameters.componentId)]).then(responses => {
      if (this.mounted) {
        const [activity, status] = responses;
        const tasks = activity.tasks;

        const pendingCount = status.pending;
        const failingCount = status.failing;

        const organizations = uniq(tasks.map(task => task.organization).filter(o => o));
        this.props.fetchOrganizations(organizations);

        this.setState({
          tasks,
          pendingCount,
          failingCount,
          loading: false
        });
      }
    });
  }

  handleFilterUpdate(nextState: Object) {
    const nextQuery = { ...this.props.location.query, ...nextState };

    // remove defaults
    Object.keys(DEFAULT_FILTERS).forEach(key => {
      if (nextQuery[key] === DEFAULT_FILTERS[key]) {
        delete nextQuery[key];
      }
    });

    this.context.router.push({
      pathname: this.props.location.pathname,
      query: nextQuery
    });
  }

  handleCancelTask(task: Task) {
    this.setState({ loading: true });

    cancelTaskAPI(task.id).then(nextTask => {
      if (this.mounted) {
        const tasks = updateTask(this.state.tasks, nextTask);
        this.setState({ tasks, loading: false });
      }
    });
  }

  handleFilterTask(task: Task) {
    this.handleFilterUpdate({ query: task.componentKey });
  }

  handleShowFailing() {
    this.handleFilterUpdate({
      ...DEFAULT_FILTERS,
      status: STATUSES.FAILED,
      currents: CURRENTS.ONLY_CURRENTS
    });
  }

  handleCancelAllPending() {
    this.setState({ loading: true });

    cancelAllTasks().then(() => {
      if (this.mounted) {
        this.loadTasks();
      }
    });
  }

  render() {
    const { component } = this.props;
    const { loading, types, tasks, pendingCount, failingCount } = this.state;

    if (!types) {
      return (
        <div className="page">
          <i className="spinner" />
        </div>
      );
    }

    const status = this.props.location.query.status || DEFAULT_FILTERS.status;
    const taskType = this.props.location.query.taskType || DEFAULT_FILTERS.taskType;
    const currents = this.props.location.query.currents || DEFAULT_FILTERS.currents;
    const minSubmittedAt = this.props.location.query.minSubmittedAt || '';
    const maxExecutedAt = this.props.location.query.maxExecutedAt || '';
    const query = this.props.location.query.query || '';

    return (
      <div className="page page-limited">
        <Helmet title={translate('background_tasks.page')} />
        <Header />

        <Stats
          component={component}
          pendingCount={pendingCount}
          failingCount={failingCount}
          onShowFailing={this.handleShowFailing.bind(this)}
          onCancelAllPending={this.handleCancelAllPending.bind(this)}
        />

        <Search
          loading={loading}
          component={component}
          status={status}
          currents={currents}
          minSubmittedAt={minSubmittedAt}
          maxExecutedAt={maxExecutedAt}
          query={query}
          taskType={taskType}
          types={types}
          onFilterUpdate={this.handleFilterUpdate.bind(this)}
          onReload={this.loadTasksDebounced}
        />

        <Tasks
          loading={loading}
          component={component}
          types={types}
          tasks={tasks}
          onCancelTask={this.handleCancelTask.bind(this)}
          onFilterTask={this.handleFilterTask.bind(this)}
        />

        <Footer tasks={tasks} />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  component: ownProps.location.query.id
    ? getComponent(state, ownProps.location.query.id)
    : undefined
});

const mapDispatchToProps = { fetchOrganizations };

export default connect(mapStateToProps, mapDispatchToProps)(BackgroundTasksApp);
