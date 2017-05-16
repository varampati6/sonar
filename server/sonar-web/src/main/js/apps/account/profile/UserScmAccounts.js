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
import { translate } from '../../../helpers/l10n';

export default class UserScmAccounts extends React.PureComponent {
  static propTypes = {
    user: React.PropTypes.object.isRequired,
    scmAccounts: React.PropTypes.arrayOf(React.PropTypes.string).isRequired
  };

  render() {
    const { user, scmAccounts } = this.props;

    return (
      <div>
        <h2 className="spacer-bottom">{translate('my_profile.scm_accounts')}</h2>
        <ul id="scm-accounts">
          <li className="little-spacer-bottom text-ellipsis" title={user.login}>
            {user.login}
          </li>

          {user.email &&
            <li className="little-spacer-bottom text-ellipsis" title={user.email}>
              {user.email}
            </li>}

          {scmAccounts.map(scmAccount => (
            <li key={scmAccount} className="little-spacer-bottom" title={scmAccount}>
              {scmAccount}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
