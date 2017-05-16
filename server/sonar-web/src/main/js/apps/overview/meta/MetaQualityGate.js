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
import { Link } from 'react-router';
import { translate } from '../../../helpers/l10n';
import { getQualityGateUrl } from '../../../helpers/urls';

const MetaQualityGate = ({ gate }) => {
  return (
    <div className="overview-meta-card">
      <h4 className="overview-meta-header">
        {translate('overview.quality_gate')}
      </h4>

      <ul className="overview-meta-list">
        <li>
          {gate.isDefault &&
            <span className="note spacer-right">
              {'(' + translate('default') + ')'}
            </span>}
          <Link to={getQualityGateUrl(gate.key)}>
            {gate.name}
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default MetaQualityGate;
