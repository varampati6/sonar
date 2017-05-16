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
import Select from 'react-select';
import { translate } from '../../../helpers/l10n';

export default class ProfileRow extends React.PureComponent {
  static propTypes = {
    profile: React.PropTypes.object.isRequired,
    possibleProfiles: React.PropTypes.array.isRequired,
    onChangeProfile: React.PropTypes.func.isRequired
  };

  state = {
    loading: false
  };

  componentWillUpdate(nextProps) {
    if (nextProps.profile !== this.props.profile) {
      this.setState({ loading: false });
    }
  }

  handleChange(option) {
    if (this.props.profile.key !== option.value) {
      this.setState({ loading: true });
      this.props.onChangeProfile(this.props.profile.key, option.value);
    }
  }

  renderProfileName(profileOption) {
    if (profileOption.isDefault) {
      return (
        <span>
          <strong>{translate('default')}</strong>
          {': '}
          {profileOption.label}
        </span>
      );
    }

    return profileOption.label;
  }

  renderProfileSelect() {
    const { profile, possibleProfiles } = this.props;

    const options = possibleProfiles.map(profile => ({
      value: profile.key,
      label: profile.name,
      isDefault: profile.isDefault
    }));

    return (
      <Select
        options={options}
        valueRenderer={this.renderProfileName}
        optionRenderer={this.renderProfileName}
        value={profile.key}
        clearable={false}
        style={{ width: 300 }}
        disabled={this.state.loading}
        onChange={this.handleChange.bind(this)}
      />
    );
  }

  render() {
    const { profile } = this.props;

    return (
      <tr data-key={profile.language}>
        <td className="thin nowrap">{profile.languageName}</td>
        <td className="thin nowrap">{this.renderProfileSelect()}</td>
        <td>
          {this.state.loading && <i className="spinner" />}
        </td>
      </tr>
    );
  }
}
