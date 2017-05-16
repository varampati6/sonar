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
import VisualizationsHeader from './VisualizationsHeader';
import Risk from './Risk';
import Reliability from './Reliability';
import Security from './Security';
import Maintainability from './Maintainability';
import Coverage from './Coverage';
import Duplications from './Duplications';
import { localizeSorting } from '../utils';
import { translate, translateWithParameters } from '../../../helpers/l10n';

export default class Visualizations extends React.PureComponent {
  props: {
    displayOrganizations: boolean,
    onVisualizationChange: string => void,
    projects?: Array<*>,
    sort?: string,
    total?: number,
    visualization: string
  };

  renderVisualization(projects: Array<*>) {
    const visualizationToComponent = {
      risk: Risk,
      reliability: Reliability,
      security: Security,
      maintainability: Maintainability,
      coverage: Coverage,
      duplications: Duplications
    };
    const Component = visualizationToComponent[this.props.visualization];

    return Component
      ? <Component displayOrganizations={this.props.displayOrganizations} projects={projects} />
      : null;
  }

  renderFooter() {
    const { projects, total, sort } = this.props;

    const limitReached = projects != null && total != null && projects.length < total;

    return (
      <footer className="projects-visualizations-footer">
        <p>{translate('projects.visualization', this.props.visualization, 'description')}</p>
        {limitReached &&
          <p className="note spacer-top">
            {translateWithParameters(
              'projects.limited_set_of_projects',
              // $FlowFixMe
              projects.length,
              localizeSorting(sort)
            )}
          </p>}
      </footer>
    );
  }

  render() {
    const { projects } = this.props;

    return (
      <div className="boxed-group projects-visualizations">
        <VisualizationsHeader
          onVisualizationChange={this.props.onVisualizationChange}
          visualization={this.props.visualization}
        />
        <div className="projects-visualization">
          <div>
            {projects != null && this.renderVisualization(projects)}
          </div>
        </div>
        {this.renderFooter()}
      </div>
    );
  }
}
