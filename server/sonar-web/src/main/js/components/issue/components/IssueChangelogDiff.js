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
import { formatMeasure } from '../../../helpers/measures';
import { translate, translateWithParameters } from '../../../helpers/l10n';

export type ChangelogDiff = {
  key: string,
  oldValue?: string,
  newValue?: string
};

export default function IssueChangelogDiff(props: { diff: ChangelogDiff }) {
  const { diff } = props;
  if (diff.key === 'file') {
    return (
      <p>
        {translateWithParameters(
          'issue.change.file_move',
          diff.oldValue || '',
          diff.newValue || ''
        )}
      </p>
    );
  }

  let message: string;
  if (diff.newValue != null) {
    let newValue: string = diff.newValue;
    if (diff.key === 'effort') {
      newValue = formatMeasure(diff.newValue, 'WORK_DUR');
    }
    message = translateWithParameters(
      'issue.changelog.changed_to',
      translate('issue.changelog.field', diff.key),
      newValue
    );
  } else {
    message = translateWithParameters(
      'issue.changelog.removed',
      translate('issue.changelog.field', diff.key)
    );
  }

  if (diff.oldValue != null) {
    let oldValue: string = diff.oldValue;
    if (diff.key === 'effort') {
      oldValue = formatMeasure(diff.oldValue, 'WORK_DUR');
    }
    message += ` (${translateWithParameters('issue.changelog.was', oldValue)})`;
  }
  return <p>{message}</p>;
}
