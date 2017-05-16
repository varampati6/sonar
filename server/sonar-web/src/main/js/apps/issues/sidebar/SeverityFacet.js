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
import { orderBy, without } from 'lodash';
import FacetBox from './components/FacetBox';
import FacetHeader from './components/FacetHeader';
import FacetItem from './components/FacetItem';
import FacetItemsList from './components/FacetItemsList';
import SeverityHelper from '../../../components/shared/SeverityHelper';
import { translate } from '../../../helpers/l10n';

type Props = {|
  facetMode: string,
  onChange: (changes: { [string]: Array<string> }) => void,
  onToggle: (property: string) => void,
  open: boolean,
  severities: Array<string>,
  stats?: { [string]: number }
|};

export default class SeverityFacet extends React.PureComponent {
  props: Props;

  static defaultProps = {
    open: true
  };

  property = 'severities';

  handleItemClick = (itemValue: string) => {
    const { severities } = this.props;
    const newValue = orderBy(
      severities.includes(itemValue) ? without(severities, itemValue) : [...severities, itemValue]
    );
    this.props.onChange({ [this.property]: newValue });
  };

  handleHeaderClick = () => {
    this.props.onToggle(this.property);
  };

  handleClear = () => {
    this.props.onChange({ [this.property]: [] });
  };

  getStat(severity: string): ?number {
    const { stats } = this.props;
    return stats ? stats[severity] : null;
  }

  renderItem = (severity: string) => {
    const active = this.props.severities.includes(severity);
    const stat = this.getStat(severity);

    return (
      <FacetItem
        active={active}
        disabled={stat === 0 && !active}
        facetMode={this.props.facetMode}
        halfWidth={true}
        key={severity}
        name={<SeverityHelper severity={severity} />}
        onClick={this.handleItemClick}
        stat={stat}
        value={severity}
      />
    );
  };

  render() {
    const severities = ['BLOCKER', 'MINOR', 'CRITICAL', 'INFO', 'MAJOR'];

    return (
      <FacetBox property={this.property}>
        <FacetHeader
          name={translate('issues.facet', this.property)}
          onClear={this.handleClear}
          onClick={this.handleHeaderClick}
          open={this.props.open}
          values={this.props.severities.length}
        />

        {this.props.open &&
          <FacetItemsList>
            {severities.map(this.renderItem)}
          </FacetItemsList>}
      </FacetBox>
    );
  }
}
