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
import React from 'react';
import FilterContainer from './FilterContainer';
import FilterHeader from './FilterHeader';
import SortingFilter from './SortingFilter';
import Rating from '../../../components/ui/Rating';

export default class IssuesFilter extends React.PureComponent {
  static propTypes = {
    property: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired,
    query: React.PropTypes.object.isRequired,
    isFavorite: React.PropTypes.bool,
    organization: React.PropTypes.object
  };

  getFacetValueForOption(facet, option) {
    return facet[option];
  }

  renderOption(option, selected) {
    return (
      <span>
        <Rating value={option} small={true} muted={!selected} />
        {option > 1 && option < 5 && <span className="note spacer-left">and worse</span>}
      </span>
    );
  }

  render() {
    return (
      <FilterContainer
        property={this.props.property}
        options={[1, 2, 3, 4, 5]}
        query={this.props.query}
        renderOption={this.renderOption}
        isFavorite={this.props.isFavorite}
        organization={this.props.organization}
        getFacetValueForOption={this.getFacetValueForOption}
        highlightUnder={1}
        header={
          <FilterHeader name={this.props.name}>
            <SortingFilter
              property={this.props.property}
              query={this.props.query}
              isFavorite={this.props.isFavorite}
              organization={this.props.organization}
            />
          </FilterHeader>
        }
      />
    );
  }
}
