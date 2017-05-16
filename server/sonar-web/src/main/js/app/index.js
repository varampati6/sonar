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
import exposeLibraries from './utils/exposeLibraries';
import startAjaxMonitoring from './utils/startAjaxMonitoring';
import startReactApp from './utils/startReactApp';
import installExtensionsHandler from './utils/installExtensionsHandler';
import { installGlobal } from '../helpers/l10n';
import './styles/index';

require('script!../libs/select2-jquery-ui-fix.js');
require('script!../libs/inputs.js');
require('script!../libs/jquery-isolated-scroll.js');
require('script!../libs/application.js');

startAjaxMonitoring();
installGlobal();
startReactApp();
exposeLibraries();
installExtensionsHandler();
