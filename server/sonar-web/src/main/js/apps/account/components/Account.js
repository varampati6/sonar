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
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import Nav from './Nav';
import UserCard from './UserCard';
import { getCurrentUser, areThereCustomOrganizations } from '../../../store/rootReducer';
import { translate } from '../../../helpers/l10n';
import handleRequiredAuthentication from '../../../app/utils/handleRequiredAuthentication';
import '../account.css';

class Account extends React.PureComponent {
  componentDidMount() {
    if (!this.props.currentUser.isLoggedIn) {
      handleRequiredAuthentication();
    }
  }

  render() {
    const { currentUser, children } = this.props;

    if (!currentUser.isLoggedIn) {
      return null;
    }

    const title = translate('my_account.page');
    return (
      <div id="account-page">
        <Helmet defaultTitle={title} titleTemplate={'%s - ' + title} />
        <header className="account-header">
          <div className="account-container clearfix">
            <UserCard user={currentUser} />
            <Nav user={currentUser} customOrganizations={this.props.customOrganizations} />
          </div>
        </header>

        {children}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  currentUser: getCurrentUser(state),
  customOrganizations: areThereCustomOrganizations(state)
});

export default connect(mapStateToProps)(Account);
