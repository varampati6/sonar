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

export default class RadioToggle extends React.PureComponent {
  static propTypes = {
    value: React.PropTypes.string,
    options: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        value: React.PropTypes.string.isRequired,
        label: React.PropTypes.string.isRequired
      })
    ).isRequired,
    name: React.PropTypes.string.isRequired,
    onCheck: React.PropTypes.func.isRequired
  };

  static defaultProps = {
    disabled: false,
    value: null
  };

  componentWillMount() {
    this.renderOption = this.renderOption.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const newValue = e.currentTarget.value;
    this.props.onCheck(newValue);
  }

  renderOption(option) {
    const checked = option.value === this.props.value;
    const htmlId = this.props.name + '__' + option.value;
    return (
      <li key={option.value}>
        <input
          type="radio"
          name={this.props.name}
          value={option.value}
          id={htmlId}
          checked={checked}
          onChange={this.handleChange}
        />

        <label htmlFor={htmlId}>{option.label}</label>
      </li>
    );
  }

  render() {
    return (
      <ul className="radio-toggle">
        {this.props.options.map(this.renderOption)}
      </ul>
    );
  }
}
