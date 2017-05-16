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
const routes = [
  {
    getIndexRoute(_, callback) {
      require.ensure([], require => {
        callback(null, { component: require('./components/AppContainer').default });
      });
    }
  },
  {
    path: 'licenses',
    getComponent(_, callback) {
      require.ensure([], require => {
        callback(null, require('./licenses/LicensesApp').default);
      });
    }
  },
  {
    path: 'encryption',
    getComponent(_, callback) {
      require.ensure([], require => {
        callback(null, require('./encryption/EncryptionAppContainer').default);
      });
    }
  },
  {
    path: 'server_id',
    getComponent(_, callback) {
      require.ensure([], require => {
        callback(null, require('./serverId/ServerIdAppContainer').default);
      });
    }
  }
];

export default routes;
