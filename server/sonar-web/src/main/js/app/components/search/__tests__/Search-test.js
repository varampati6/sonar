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
import { shallow, mount } from 'enzyme';
import type { ShallowWrapper } from 'enzyme';
import Search from '../Search';
import { elementKeydown, clickOutside } from '../../../../helpers/testUtils';

function render(props?: Object) {
  return shallow(
    <Search
      appState={{ organizationsEnabled: false }}
      currentUser={{ isLoggedIn: false }}
      {...props}
    />
  );
}

function component(key: string, qualifier: string = 'TRK') {
  return { key, name: key, qualifier };
}

function next(form: ShallowWrapper, expected: string) {
  elementKeydown(form.find('input'), 40);
  expect(form.state().selected).toBe(expected);
}

function prev(form: ShallowWrapper, expected: string) {
  elementKeydown(form.find('input'), 38);
  expect(form.state().selected).toBe(expected);
}

function select(form: ShallowWrapper, expected: string) {
  form.instance().handleSelect(expected);
  expect(form.state().selected).toBe(expected);
}

it('selects results', () => {
  const form = render();
  form.setState({
    more: { TRK: 15, BRC: 0 },
    open: true,
    results: {
      TRK: [component('foo'), component('bar')],
      BRC: [component('qwe', 'BRC')]
    },
    selected: 'foo'
  });
  expect(form.state().selected).toBe('foo');
  next(form, 'bar');
  next(form, 'qualifier###TRK');
  next(form, 'qwe');
  next(form, 'qwe');
  prev(form, 'qualifier###TRK');
  prev(form, 'bar');
  select(form, 'foo');
  prev(form, 'foo');
});

it('opens selected on enter', () => {
  const form = render();
  form.setState({
    open: true,
    results: { TRK: [component('foo')] },
    selected: 'foo'
  });
  const openSelected = jest.fn();
  form.instance().openSelected = openSelected;
  elementKeydown(form.find('input'), 13);
  expect(openSelected).toBeCalled();
});

it('shows warning about short input', () => {
  const form = render();
  form.setState({ shortQuery: true });
  expect(form.find('.navbar-search-input-hint')).toMatchSnapshot();
  form.setState({ query: 'foobar x' });
  expect(form.find('.navbar-search-input-hint')).toMatchSnapshot();
});

it('closes on escape', () => {
  const form = render();
  form.instance().openSearch();
  expect(form.state().open).toBe(true);
  elementKeydown(form.find('input'), 27);
  expect(form.state().open).toBe(false);
});

it('closes on click outside', () => {
  const form = mount(
    <Search appState={{ organizationsEnabled: false }} currentUser={{ isLoggedIn: false }} />
  );
  form.instance().openSearch();
  expect(form.state().open).toBe(true);
  clickOutside();
  expect(form.state().open).toBe(false);
});
