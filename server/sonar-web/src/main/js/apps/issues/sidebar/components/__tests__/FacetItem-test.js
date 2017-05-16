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
import FacetItem from '../FacetItem';

const renderFacetItem = (props: {}) =>
  shallow(
    <FacetItem
      active={false}
      facetMode="count"
      name="foo"
      onClick={jest.fn()}
      stat={null}
      value="bar"
      {...props}
    />
  );

it('should render active', () => {
  expect(renderFacetItem({ active: true })).toMatchSnapshot();
});

it('should render inactive', () => {
  expect(renderFacetItem({ active: false })).toMatchSnapshot();
});

it('should render stat', () => {
  expect(renderFacetItem({ stat: 13 })).toMatchSnapshot();
});

it('should render disabled', () => {
  expect(renderFacetItem({ disabled: true })).toMatchSnapshot();
});

it('should render half width', () => {
  expect(renderFacetItem({ halfWidth: true })).toMatchSnapshot();
});

it('should render effort stat', () => {
  expect(renderFacetItem({ facetMode: 'effort', stat: 1234 })).toMatchSnapshot();
});

it('should call onClick', () => {
  const onClick = jest.fn();
  const wrapper = renderFacetItem({ onClick });
  click(wrapper, { currentTarget: { dataset: { value: 'bar' } } });
  expect(onClick).toHaveBeenCalled();
});
