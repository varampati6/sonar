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
import Select from 'react-select';
import { translate } from '../../../helpers/l10n';
import type { Profile } from '../propTypes';

type Props = {
  profile: Profile,
  profiles: Array<Profile>,
  onCompare: string => void,
  withKey: string
};

export default class ComparisonForm extends React.PureComponent {
  props: Props;

  handleChange(option: { value: string }) {
    this.props.onCompare(option.value);
  }

  render() {
    const { profile, profiles, withKey } = this.props;
    const options = profiles
      .filter(p => p.language === profile.language && p !== profile)
      .map(p => ({ value: p.key, label: p.name }));

    return (
      <div className="display-inline-block">
        <label className="spacer-right">
          {translate('quality_profiles.compare_with')}
        </label>
        <Select
          value={withKey}
          options={options}
          clearable={false}
          className="input-large"
          onChange={this.handleChange.bind(this)}
        />
      </div>
    );
  }
}
