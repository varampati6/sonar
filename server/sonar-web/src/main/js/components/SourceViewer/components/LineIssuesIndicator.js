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
import classNames from 'classnames';
import SeverityIcon from '../../shared/SeverityIcon';
import { sortBySeverity } from '../../../helpers/issues';
import type { SourceLine } from '../types';
import type { Issue } from '../../issue/types';

type Props = {
  issues: Array<Issue>,
  line: SourceLine,
  onClick: () => void
};

export default class LineIssuesIndicator extends React.PureComponent {
  props: Props;

  handleClick = (e: SyntheticInputEvent) => {
    e.preventDefault();
    this.props.onClick();
  };

  render() {
    const { issues, line } = this.props;
    const hasIssues = issues.length > 0;
    const className = classNames('source-meta', 'source-line-issues', {
      'source-line-with-issues': hasIssues
    });
    const mostImportantIssue = hasIssues ? sortBySeverity(issues)[0] : null;

    return (
      <td
        className={className}
        data-line-number={line.line}
        role={hasIssues ? 'button' : undefined}
        tabIndex={hasIssues ? '0' : undefined}
        onClick={hasIssues ? this.handleClick : undefined}>
        {mostImportantIssue != null && <SeverityIcon severity={mostImportantIssue.severity} />}
        {issues.length > 1 && <span className="source-line-issues-counter">{issues.length}</span>}
      </td>
    );
  }
}
