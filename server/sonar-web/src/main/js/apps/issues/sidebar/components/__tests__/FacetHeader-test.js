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
import { shallow } from 'enzyme';
import { click } from '../../../../../helpers/testUtils';
import FacetHeader from '../FacetHeader';

it('should render open facet with value', () => {
  expect(
    shallow(<FacetHeader name="foo" onClick={jest.fn()} open={true} values={1} />)
  ).toMatchSnapshot();
});

it('should render open facet without value', () => {
  expect(shallow(<FacetHeader name="foo" onClick={jest.fn()} open={true} />)).toMatchSnapshot();
});

it('should render closed facet with value', () => {
  expect(
    shallow(<FacetHeader name="foo" onClick={jest.fn()} open={false} values={1} />)
  ).toMatchSnapshot();
});

it('should render closed facet without value', () => {
  expect(shallow(<FacetHeader name="foo" onClick={jest.fn()} open={false} />)).toMatchSnapshot();
});

it('should render without link', () => {
  expect(shallow(<FacetHeader name="foo" open={false} />)).toMatchSnapshot();
});

it('should call onClick', () => {
  const onClick = jest.fn();
  const wrapper = shallow(<FacetHeader name="foo" onClick={onClick} open={false} />);
  click(wrapper.find('a'));
  expect(onClick).toHaveBeenCalled();
});

it('should clear', () => {
  const onClear = jest.fn();
  const wrapper = shallow(
    <FacetHeader name="foo" onClear={onClear} onClick={jest.fn()} open={false} values={3} />
  );
  expect(wrapper).toMatchSnapshot();
  click(wrapper.find('.button-red'));
  expect(onClear).toHaveBeenCalled();
});
