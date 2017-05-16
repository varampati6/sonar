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
import Select from 'react-select';
import ThresholdInput from '../ThresholdInput';
import { change } from '../../../../helpers/testUtils';

describe('on strings', () => {
  it('should render text input', () => {
    const input = shallow(
      <ThresholdInput name="foo" value="2" metric={{ type: 'INTEGER' }} onChange={jest.fn()} />
    ).find('input');
    expect(input.length).toEqual(1);
    expect(input.prop('name')).toEqual('foo');
    expect(input.prop('value')).toEqual('2');
  });

  it('should change', () => {
    const onChange = jest.fn();
    const input = shallow(
      <ThresholdInput name="foo" value="2" metric={{ type: 'INTEGER' }} onChange={onChange} />
    ).find('input');
    change(input, 'bar');
    expect(onChange).toBeCalledWith('bar');
  });
});

describe('on ratings', () => {
  it('should render Select', () => {
    const select = shallow(
      <ThresholdInput name="foo" value="2" metric={{ type: 'RATING' }} onChange={jest.fn()} />
    ).find(Select);
    expect(select.length).toEqual(1);
    expect(select.prop('value')).toEqual('2');
  });

  it('should set', () => {
    const onChange = jest.fn();
    const select = shallow(
      <ThresholdInput name="foo" value="2" metric={{ type: 'RATING' }} onChange={onChange} />
    ).find(Select);
    select.prop('onChange')({ label: 'D', value: '4' });
    expect(onChange).toBeCalledWith('4');
  });

  it('should unset', () => {
    const onChange = jest.fn();
    const select = shallow(
      <ThresholdInput name="foo" value="2" metric={{ type: 'RATING' }} onChange={onChange} />
    ).find(Select);
    select.prop('onChange')(null);
    expect(onChange).toBeCalledWith('');
  });
});
