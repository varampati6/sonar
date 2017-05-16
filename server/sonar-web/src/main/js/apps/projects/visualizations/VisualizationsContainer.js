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
import { connect } from 'react-redux';
import Visualizations from './Visualizations';
import {
  getProjects,
  getComponent,
  getComponentMeasures,
  getOrganizationByKey,
  getProjectsAppState,
  areThereCustomOrganizations
} from '../../../store/rootReducer';

const mapStateToProps = state => {
  const projectKeys = getProjects(state) || [];
  const projects = projectKeys.map(key => {
    const component = getComponent(state, key);
    return {
      ...component,
      measures: getComponentMeasures(state, key) || {},
      organization: getOrganizationByKey(state, component.organization)
    };
  });
  const appState = getProjectsAppState(state);
  return {
    projects,
    total: appState.total,
    displayOrganizations: areThereCustomOrganizations(state)
  };
};

export default connect(mapStateToProps)(Visualizations);
