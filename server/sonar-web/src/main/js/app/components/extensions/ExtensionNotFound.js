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
import { Link } from 'react-router';

export default class ExtensionNotFound extends React.PureComponent {
  componentDidMount() {
    const html = document.querySelector('html');
    if (html) {
      html.classList.add('dashboard-page');
    }
  }

  componentWillUnmount() {
    const html = document.querySelector('html');
    if (html) {
      html.classList.remove('dashboard-page');
    }
  }

  render() {
    return (
      <div id="bd" className="page-wrapper-simple">
        <div id="nonav" className="page-simple">
          <h2 className="big-spacer-bottom">The page you were looking for does not exist.</h2>
          <p className="spacer-bottom">
            You may have mistyped the address or the page may have moved.
          </p>
          <p><Link to="/">Go back to the homepage</Link></p>
        </div>
      </div>
    );
  }
}
