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
import { getComponentUrl, getComponentIssuesUrl, getComponentDrilldownUrl } from '../urls';

const SIMPLE_COMPONENT_KEY = 'sonarqube';
const COMPLEX_COMPONENT_KEY = 'org.sonarsource.sonarqube:sonarqube';
const COMPLEX_COMPONENT_KEY_ENCODED = encodeURIComponent(COMPLEX_COMPONENT_KEY);
const METRIC = 'coverage';

let oldBaseUrl;

beforeEach(() => {
  oldBaseUrl = window.baseUrl;
});

afterEach(() => {
  window.baseUrl = oldBaseUrl;
});

describe('#getComponentUrl', () => {
  it('should return component url', () => {
    expect(getComponentUrl(SIMPLE_COMPONENT_KEY)).toBe('/dashboard?id=' + SIMPLE_COMPONENT_KEY);
  });

  it('should encode component key', () => {
    expect(getComponentUrl(COMPLEX_COMPONENT_KEY)).toBe(
      '/dashboard?id=' + COMPLEX_COMPONENT_KEY_ENCODED
    );
  });

  it('should take baseUrl into account', () => {
    window.baseUrl = '/context';
    expect(getComponentUrl(COMPLEX_COMPONENT_KEY)).toBe(
      '/context/dashboard?id=' + COMPLEX_COMPONENT_KEY_ENCODED
    );
  });
});

describe('#getComponentIssuesUrl', () => {
  it('should work without parameters', () => {
    expect(getComponentIssuesUrl(SIMPLE_COMPONENT_KEY, {})).toEqual({
      pathname: '/project/issues',
      query: { id: SIMPLE_COMPONENT_KEY }
    });
  });

  it('should work with parameters', () => {
    expect(getComponentIssuesUrl(SIMPLE_COMPONENT_KEY, { resolved: 'false' })).toEqual({
      pathname: '/project/issues',
      query: { id: SIMPLE_COMPONENT_KEY, resolved: 'false' }
    });
  });
});

describe('#getComponentDrilldownUrl', () => {
  it('should return component drilldown url', () => {
    expect(getComponentDrilldownUrl(SIMPLE_COMPONENT_KEY, METRIC)).toEqual({
      pathname: '/component_measures/metric/' + METRIC,
      query: { id: SIMPLE_COMPONENT_KEY }
    });
  });

  it('should encode component key', () => {
    expect(getComponentDrilldownUrl(COMPLEX_COMPONENT_KEY, METRIC)).toEqual({
      pathname: '/component_measures/metric/' + METRIC,
      query: { id: COMPLEX_COMPONENT_KEY }
    });
  });
});
