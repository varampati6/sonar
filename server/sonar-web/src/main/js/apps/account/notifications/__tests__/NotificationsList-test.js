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
import { shallow } from 'enzyme';
import NotificationsList from '../NotificationsList';
import Checkbox from '../../../../components/controls/Checkbox';

const channels = ['channel1', 'channel2'];
const types = ['type1', 'type2'];
const notifications = [
  { channel: 'channel1', type: 'type1' },
  { channel: 'channel1', type: 'type2' },
  { channel: 'channel2', type: 'type2' }
];
const checkboxId = (t, c) => `checkbox-io-${t}-${c}`;

it('should match snapshot', () => {
  expect(
    shallow(
      <NotificationsList
        onAdd={jest.fn()}
        onRemove={jest.fn()}
        channels={channels}
        checkboxId={checkboxId}
        types={types}
        notifications={notifications}
      />
    )
  ).toMatchSnapshot();
});

it('should call `onAdd` and `onRemove`', () => {
  const onAdd = jest.fn();
  const onRemove = jest.fn();
  const wrapper = shallow(
    <NotificationsList
      onAdd={onAdd}
      onRemove={onRemove}
      channels={channels}
      checkboxId={checkboxId}
      types={types}
      notifications={notifications}
    />
  );
  const checkbox = wrapper.find(Checkbox).first();

  checkbox.prop('onCheck')(true);
  expect(onAdd).toHaveBeenCalledWith({ channel: 'channel1', type: 'type1' });

  jest.resetAllMocks();

  checkbox.prop('onCheck')(false);
  expect(onRemove).toHaveBeenCalledWith({ channel: 'channel1', type: 'type1' });
});
