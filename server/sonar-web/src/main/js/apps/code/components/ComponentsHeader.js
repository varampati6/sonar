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
import { translate } from '../../../helpers/l10n';

const ComponentsHeader = ({ baseComponent, rootComponent }) => {
  const isView = rootComponent.qualifier === 'VW' || rootComponent.qualifier === 'SVW';

  const columns = isView
    ? [
        translate('metric_domain.Releasability'),
        translate('metric_domain.Reliability'),
        translate('metric_domain.Security'),
        translate('metric_domain.Maintainability'),
        translate('metric', 'ncloc', 'name')
      ]
    : [
        translate('metric', 'ncloc', 'name'),
        translate('metric', 'bugs', 'name'),
        translate('metric', 'vulnerabilities', 'name'),
        translate('metric', 'code_smells', 'name'),
        translate('metric', 'coverage', 'name'),
        translate('metric', 'duplicated_lines_density', 'short_name')
      ];

  return (
    <thead>
      <tr className="code-components-header">
        <th className="thin nowrap">&nbsp;</th>
        <th>&nbsp;</th>
        {columns.map(column => (
          <th key={column} className="thin nowrap text-right code-components-cell">
            {baseComponent && column}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default ComponentsHeader;
