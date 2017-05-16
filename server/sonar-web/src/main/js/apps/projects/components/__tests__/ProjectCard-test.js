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
import ProjectCard from '../ProjectCard';

const PROJECT = { analysisDate: '2017-01-01', key: 'foo', name: 'Foo', tags: [] };
const MEASURES = {};

it('should display analysis date', () => {
  expect(
    shallow(<ProjectCard measures={MEASURES} project={PROJECT} />).find(
      '.project-card-analysis-date'
    )
  ).toMatchSnapshot();
});

it('should NOT display analysis date', () => {
  const project = { ...PROJECT, analysisDate: undefined };
  expect(
    shallow(<ProjectCard measures={MEASURES} project={project} />)
      .find('.project-card-analysis-date')
      .exists()
  ).toBeFalsy();
});

it('should display loading', () => {
  expect(shallow(<ProjectCard project={PROJECT} />)).toMatchSnapshot();
});

it('should display tags', () => {
  const project = { ...PROJECT, tags: ['foo', 'bar'] };
  expect(shallow(<ProjectCard project={project} />)).toMatchSnapshot();
});
