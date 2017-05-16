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
import { searchAssignees } from '../utils';
import type { ReferencedUser, Component } from '../utils';
import Avatar from '../../../components/ui/Avatar';
import { translate } from '../../../helpers/l10n';

type Props = {|
  assigned: boolean,
  assignees: Array<string>,
  component?: Component,
  facetMode: string,
  onChange: (changes: {}) => void,
  onToggle: (property: string) => void,
  open: boolean,
  stats?: { [string]: number },
  referencedUsers: { [string]: ReferencedUser }
|};

export default class AssigneeFacet extends React.PureComponent {
  props: Props;

  static defaultProps = {
    open: true
  };

  property = 'assignees';

  handleItemClick = (itemValue: string) => {
    if (itemValue === '') {
      // unassigned
      this.props.onChange({ assigned: !this.props.assigned, assignees: [] });
    } else {
      // defined assignee
      const { assignees } = this.props;
      const newValue = sortBy(
        assignees.includes(itemValue) ? without(assignees, itemValue) : [...assignees, itemValue]
      );
      this.props.onChange({ assigned: true, assignees: newValue });
    }
  };

  handleHeaderClick = () => {
    this.props.onToggle(this.property);
  };

  handleClear = () => {
    this.props.onChange({ assigned: true, assignees: [] });
  };

  handleSearch = (query: string) => searchAssignees(query, this.props.component);

  handleSelect = (assignee: string) => {
    const { assignees } = this.props;
    this.props.onChange({ assigned: true, [this.property]: uniq([...assignees, assignee]) });
  };

  isAssigneeActive(assignee: string) {
    return assignee === '' ? !this.props.assigned : this.props.assignees.includes(assignee);
  }

  getAssigneeName(assignee: string): React.Element<*> | string {
    if (assignee === '') {
      return translate('unassigned');
    } else {
      const { referencedUsers } = this.props;
      if (referencedUsers[assignee]) {
        return (
          <span>
            <Avatar
              className="little-spacer-right"
              hash={referencedUsers[assignee].avatar}
              name={referencedUsers[assignee].name}
              size={16}
            />
            {referencedUsers[assignee].name}
          </span>
        );
      } else {
        return assignee;
      }
    }
  }

  getStat(assignee: string): ?number {
    const { stats } = this.props;
    return stats ? stats[assignee] : null;
  }

  renderOption = (option: { avatar: string, label: string }) => {
    return (
      <span>
        {option.avatar != null &&
          <Avatar
            className="little-spacer-right"
            hash={option.avatar}
            name={option.label}
            size={16}
          />}
        {option.label}
      </span>
    );
  };

  renderList() {
    const { stats } = this.props;

    if (!stats) {
      return null;
    }

    const assignees = sortBy(
      Object.keys(stats),
      // put unassigned first
      key => (key === '' ? 0 : 1),
      // the sort by number
      key => -stats[key]
    );

    return (
      <FacetItemsList>
        {assignees.map(assignee => (
          <FacetItem
            active={this.isAssigneeActive(assignee)}
            facetMode={this.props.facetMode}
            key={assignee}
            name={this.getAssigneeName(assignee)}
            onClick={this.handleItemClick}
            stat={this.getStat(assignee)}
            value={assignee}
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
          values={this.props.assignees.length + (this.props.assigned ? 0 : 1)}
        />

        {this.props.open && this.renderList()}
        {this.props.open && this.renderFooter()}
      </FacetBox>
    );
  }
}
