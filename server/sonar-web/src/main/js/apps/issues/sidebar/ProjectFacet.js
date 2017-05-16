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
import { sortBy, uniq, without } from 'lodash';
import FacetBox from './components/FacetBox';
import FacetHeader from './components/FacetHeader';
import FacetItem from './components/FacetItem';
import FacetItemsList from './components/FacetItemsList';
import FacetFooter from './components/FacetFooter';
import type { ReferencedComponent, Component } from '../utils';
import Organization from '../../../components/shared/Organization';
import QualifierIcon from '../../../components/shared/QualifierIcon';
import { searchProjects, getTree } from '../../../api/components';
import { translate } from '../../../helpers/l10n';

type Props = {|
  component?: Component,
  facetMode: string,
  onChange: (changes: { [string]: Array<string> }) => void,
  onToggle: (property: string) => void,
  open: boolean,
  stats?: { [string]: number },
  referencedComponents: { [string]: ReferencedComponent },
  projects: Array<string>
|};

export default class ProjectFacet extends React.PureComponent {
  props: Props;

  static defaultProps = {
    open: true
  };

  property = 'projects';

  handleItemClick = (itemValue: string) => {
    const { projects } = this.props;
    const newValue = sortBy(
      projects.includes(itemValue) ? without(projects, itemValue) : [...projects, itemValue]
    );
    this.props.onChange({ [this.property]: newValue });
  };

  handleHeaderClick = () => {
    this.props.onToggle(this.property);
  };

  handleClear = () => {
    this.props.onChange({ [this.property]: [] });
  };

  handleSearch = (query: string) => {
    const { component } = this.props;

    return component != null && ['VW', 'SVW'].includes(component.qualifier)
      ? getTree(component.key, { ps: 50, q: query, qualifiers: 'TRK' }).then(response =>
          response.components.map(component => ({
            label: component.name,
            organization: component.organization,
            value: component.refId
          }))
        )
      : searchProjects({
          ps: 50,
          filter: query ? `query = "${query}"` : ''
        }).then(response =>
          response.components.map(component => ({
            label: component.name,
            organization: component.organization,
            value: component.id
          }))
        );
  };

  handleSelect = (rule: string) => {
    const { projects } = this.props;
    this.props.onChange({ [this.property]: uniq([...projects, rule]) });
  };

  getStat(project: string): ?number {
    const { stats } = this.props;
    return stats ? stats[project] : null;
  }

  renderName(project: string): React.Element<*> | string {
    const { referencedComponents } = this.props;
    return referencedComponents[project]
      ? <span>
          <QualifierIcon className="little-spacer-right" qualifier="TRK" />
          <Organization link={false} organizationKey={referencedComponents[project].organization} />
          {referencedComponents[project].name}
        </span>
      : <span>
          <QualifierIcon className="little-spacer-right" qualifier="TRK" />
          {project}
        </span>;
  }

  renderOption = (option: { label: string, organization: string }) => {
    return (
      <span>
        <Organization link={false} organizationKey={option.organization} />
        {option.label}
      </span>
    );
  };

  renderList() {
    const { stats } = this.props;

    if (!stats) {
      return null;
    }

    const projects = sortBy(Object.keys(stats), key => -stats[key]);

    return (
      <FacetItemsList>
        {projects.map(project => (
          <FacetItem
            active={this.props.projects.includes(project)}
            facetMode={this.props.facetMode}
            key={project}
            name={this.renderName(project)}
            onClick={this.handleItemClick}
            stat={this.getStat(project)}
            value={project}
          />
        ))}
      </FacetItemsList>
    );
  }

  renderFooter() {
    if (!this.props.stats) {
      return null;
    }

    return (
      <FacetFooter
        minimumQueryLength={3}
        onSearch={this.handleSearch}
        onSelect={this.handleSelect}
        renderOption={this.renderOption}
      />
    );
  }

  render() {
    return (
      <FacetBox property={this.property}>
        <FacetHeader
          name={translate('issues.facet', this.property)}
          onClear={this.handleClear}
          onClick={this.handleHeaderClick}
          open={this.props.open}
          values={this.props.projects.length}
        />

        {this.props.open && this.renderList()}
        {this.props.open && this.renderFooter()}
      </FacetBox>
    );
  }
}
