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
import { shallow } from 'enzyme';
import React from 'react';
import { unconnectedAvatar as Avatar } from '../Avatar';

const gravatarServerUrl = 'http://example.com/{EMAIL_MD5}.jpg?s={SIZE}';

it('should render', () => {
  const avatar = shallow(
    <Avatar
      enableGravatar={true}
      gravatarServerUrl={gravatarServerUrl}
      email="mail@example.com"
      name="Foo"
      size={20}
    />
  );
  expect(avatar).toMatchSnapshot();
});

it('should be able to render with hash only', () => {
  const avatar = shallow(
    <Avatar
      enableGravatar={true}
      gravatarServerUrl={gravatarServerUrl}
      hash="7daf6c79d4802916d83f6266e24850af"
      name="Foo"
      size={30}
    />
  );
  expect(avatar).toMatchSnapshot();
});

it('falls back to dummy avatar', () => {
  const avatar = shallow(
    <Avatar enableGravatar={false} gravatarServerUrl="" name="Foo Bar" size={30} />
  );
  expect(avatar).toMatchSnapshot();
});
