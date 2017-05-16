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
import { shallow, mount } from 'enzyme';
import React from 'react';
import MultiSelect from '../MultiSelect';

const props = {
  selectedElements: ['bar'],
  elements: [],
  onSearch: () => {},
  onSelect: () => {},
  onUnselect: () => {}
};

const elements = ['foo', 'bar', 'baz'];

it('should render multiselect with selected elements', () => {
  const multiselect = shallow(<MultiSelect {...props} />);
  // Will not have any element in the list since its filled with componentDidMount the first time
  expect(multiselect).toMatchSnapshot();

  // Will have some elements
  multiselect.setProps({ elements });
  expect(multiselect).toMatchSnapshot();
  multiselect.setState({ activeIdx: 2 });
  expect(multiselect).toMatchSnapshot();
  multiselect.setState({ query: 'test' });
  expect(multiselect).toMatchSnapshot();
});

it('should render with the focus inside the search input', () => {
  const multiselect = mount(<MultiSelect {...props} />);
  expect(multiselect.find('input').node).toBe(document.activeElement);
});
