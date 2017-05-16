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
import IssueCommentAction from '../IssueCommentAction';
import { click } from '../../../../helpers/testUtils';

it('should render correctly', () => {
  const element = shallow(
    <IssueCommentAction
      issueKey="issue-key"
      currentPopup=""
      onFail={jest.fn()}
      onIssueChange={jest.fn()}
      toggleComment={jest.fn()}
    />
  );
  expect(element).toMatchSnapshot();
});

it('should open the popup when the button is clicked', () => {
  const toggle = jest.fn();
  const element = shallow(
    <IssueCommentAction
      issueKey="issue-key"
      currentPopup=""
      onFail={jest.fn()}
      onIssueChange={jest.fn()}
      toggleComment={toggle}
    />
  );
  click(element.find('button'));
  expect(toggle.mock.calls.length).toBe(1);
  element.setProps({ currentPopup: 'comment' });
  expect(element).toMatchSnapshot();
});
