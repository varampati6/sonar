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
import { combineReducers } from 'redux';
import definitions, * as fromDefinitions from './definitions/reducer';
import values, * as fromValues from './values/reducer';
import settingsPage, * as fromSettingsPage from './settingsPage/reducer';
import licenses, * as fromLicenses from './licenses/reducer';
import globalMessages, * as fromGlobalMessages from '../../../store/globalMessages/duck';
import type { State as GlobalMessagesState } from '../../../store/globalMessages/duck';
import encryptionPage from './encryptionPage/reducer';

type State = {
  definitions: {},
  encryptionPage: {},
  globalMessages: GlobalMessagesState,
  licenses: {},
  settingsPage: {},
  values: {}
};

const rootReducer = combineReducers({
  definitions,
  values,
  settingsPage,
  licenses,
  encryptionPage,
  globalMessages
});

export default rootReducer;

export const getDefinition = (state: State, key: string) =>
  fromDefinitions.getDefinition(state.definitions, key);

export const getAllCategories = (state: State) =>
  fromDefinitions.getAllCategories(state.definitions);

export const getDefaultCategory = (state: State) =>
  fromDefinitions.getDefaultCategory(state.definitions);

export const getValue = (state: State, key: string) => fromValues.getValue(state.values, key);

export const getSettingsForCategory = (state: State, category: string) =>
  fromDefinitions.getDefinitionsForCategory(state.definitions, category).map(definition => ({
    ...getValue(state, definition.key),
    definition
  }));

export const getChangedValue = (state: State, key: string) =>
  fromSettingsPage.getChangedValue(state.settingsPage, key);

export const isLoading = (state: State, key: string) =>
  fromSettingsPage.isLoading(state.settingsPage, key);

export const getLicenseByKey = (state: State, key: string) =>
  fromLicenses.getLicenseByKey(state.licenses, key);

export const getAllLicenseKeys = (state: State) => fromLicenses.getAllLicenseKeys(state.licenses);

export const getValidationMessage = (state: State, key: string) =>
  fromSettingsPage.getValidationMessage(state.settingsPage, key);

export const getEncryptionState = (state: State) => state.encryptionPage;

export const getGlobalMessages = (state: State) =>
  fromGlobalMessages.getGlobalMessages(state.globalMessages);
