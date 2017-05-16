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
import { withRouter } from 'react-router';

const routes = [
  {
    getComponent(state, callback) {
      require.ensure([], require => {
        const AppContainer = require('./components/AppContainer').default;
        if (state.params.organizationKey) {
          callback(null, AppContainer);
        } else {
          const forSingleOrganization = require('../organizations/forSingleOrganization').default;
          callback(null, forSingleOrganization(AppContainer));
        }
      });
    },
    getIndexRoute(_, callback) {
      require.ensure([], require => {
        callback(null, { component: require('./home/HomeContainer').default });
      });
    },
    childRoutes: [
      {
        getComponent(_, callback) {
          require.ensure([], require => {
            callback(null, withRouter(require('./components/ProfileContainer').default));
          });
        },
        childRoutes: [
          {
            path: 'show',
            getComponent(_, callback) {
              require.ensure([], require => {
                callback(null, require('./details/ProfileDetails').default);
              });
            }
          },
          {
            path: 'changelog',
            getComponent(_, callback) {
              require.ensure([], require => {
                callback(null, require('./changelog/ChangelogContainer').default);
              });
            }
          },
          {
            path: 'compare',
            getComponent(_, callback) {
              require.ensure([], require => {
                callback(null, require('./compare/ComparisonContainer').default);
              });
            }
          }
        ]
      }
    ]
  }
];

export default routes;
