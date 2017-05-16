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
import { searchRules } from '../../../api/rules';
import { translate } from '../../../helpers/l10n';

type Props = {|
  facetMode: string,
  languages: Array<string>,
  onChange: (changes: { [string]: Array<string> }) => void,
  onToggle: (property: string) => void,
  open: boolean,
  stats?: { [string]: number },
  referencedRules: { [string]: { name: string } },
  rules: Array<string>
|};

export default class RuleFacet extends React.PureComponent {
  props: Props;

  static defaultProps = {
    open: true
  };

  property = 'rules';

  handleItemClick = (itemValue: string) => {
    const { rules } = this.props;
    const newValue = sortBy(
      rules.includes(itemValue) ? without(rules, itemValue) : [...rules, itemValue]
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
    const { languages } = this.props;
    return searchRules({
      f: 'name,langName',
      languages: languages.length ? languages.join() : undefined,
      q: query
    }).then(response =>
      response.rules.map(rule => ({ label: `(${rule.langName}) ${rule.name}`, value: rule.key }))
    );
  };

  handleSelect = (rule: string) => {
    const { rules } = this.props;
    this.props.onChange({ [this.property]: uniq([...rules, rule]) });
  };

  getRuleName(rule: string): string {
    const { referencedRules } = this.props;
    return referencedRules[rule] ? referencedRules[rule].name : rule;
  }

  getStat(rule: string): ?number {
    const { stats } = this.props;
    return stats ? stats[rule] : null;
  }

  renderList() {
    const { stats } = this.props;

    if (!stats) {
      return null;
    }

    const rules = sortBy(Object.keys(stats), key => -stats[key]);

    return (
      <FacetItemsList>
        {rules.map(rule => (
          <FacetItem
            active={this.props.rules.includes(rule)}
            facetMode={this.props.facetMode}
            key={rule}
            name={this.getRuleName(rule)}
            onClick={this.handleItemClick}
            stat={this.getStat(rule)}
            value={rule}
          />
        ))}
      </FacetItemsList>
    );
  }

  renderFooter() {
    if (!this.props.stats) {
      return null;
    }

    return <FacetFooter onSearch={this.handleSearch} onSelect={this.handleSelect} />;
  }

  render() {
    return (
      <FacetBox property={this.property}>
        <FacetHeader
          name={translate('issues.facet', this.property)}
          onClear={this.handleClear}
          onClick={this.handleHeaderClick}
          open={this.props.open}
          values={this.props.rules.length}
        />

        {this.props.open && this.renderList()}
        {this.props.open && this.renderFooter()}
      </FacetBox>
    );
  }
}
