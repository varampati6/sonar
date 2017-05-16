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
import LanguageFacetFooter from './LanguageFacetFooter';
import type { ReferencedLanguage } from '../utils';
import { translate } from '../../../helpers/l10n';

type Props = {|
  facetMode: string,
  onChange: (changes: { [string]: Array<string> }) => void,
  onToggle: (property: string) => void,
  open: boolean,
  stats?: { [string]: number },
  referencedLanguages: { [string]: ReferencedLanguage },
  languages: Array<string>
|};

export default class LanguageFacet extends React.PureComponent {
  props: Props;

  static defaultProps = {
    open: true
  };

  property = 'languages';

  handleItemClick = (itemValue: string) => {
    const { languages } = this.props;
    const newValue = sortBy(
      languages.includes(itemValue) ? without(languages, itemValue) : [...languages, itemValue]
    );
    this.props.onChange({ [this.property]: newValue });
  };

  handleHeaderClick = () => {
    this.props.onToggle(this.property);
  };

  handleClear = () => {
    this.props.onChange({ [this.property]: [] });
  };

  getLanguageName(language: string): string {
    const { referencedLanguages } = this.props;
    return referencedLanguages[language] ? referencedLanguages[language].name : language;
  }

  getStat(language: string): ?number {
    const { stats } = this.props;
    return stats ? stats[language] : null;
  }

  handleSelect = (language: string) => {
    const { languages } = this.props;
    this.props.onChange({ [this.property]: uniq([...languages, language]) });
  };

  renderList() {
    const { stats } = this.props;

    if (!stats) {
      return null;
    }

    const languages = sortBy(Object.keys(stats), key => -stats[key]);

    return (
      <FacetItemsList>
        {languages.map(language => (
          <FacetItem
            active={this.props.languages.includes(language)}
            facetMode={this.props.facetMode}
            key={language}
            name={this.getLanguageName(language)}
            onClick={this.handleItemClick}
            stat={this.getStat(language)}
            value={language}
          />
        ))}
      </FacetItemsList>
    );
  }

  renderFooter() {
    if (!this.props.stats) {
      return null;
    }

    return <LanguageFacetFooter onSelect={this.handleSelect} />;
  }

  render() {
    return (
      <FacetBox property={this.property}>
        <FacetHeader
          name={translate('issues.facet', this.property)}
          onClear={this.handleClear}
          onClick={this.handleHeaderClick}
          open={this.props.open}
          values={this.props.languages.length}
        />

        {this.props.open && this.renderList()}
        {this.props.open && this.renderFooter()}
      </FacetBox>
    );
  }
}
