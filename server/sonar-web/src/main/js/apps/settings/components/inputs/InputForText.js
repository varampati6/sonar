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
import { defaultInputPropTypes } from '../../propTypes';

export default class InputForText extends React.PureComponent {
  static propTypes = defaultInputPropTypes;

  handleInputChange(e) {
    this.props.onChange(e.target.value);
  }

  render() {
    return (
      <textarea
        name={this.props.name}
        className="input-super-large text-top"
        rows="5"
        value={this.props.value || ''}
        onChange={e => this.handleInputChange(e)}
      />
    );
  }
}
