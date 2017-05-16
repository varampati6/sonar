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
import { Link } from 'react-router';
import classNames from 'classnames';
import DeprecatedBadge from './DeprecatedBadge';
import InternalBadge from './InternalBadge';
import { TooltipsContainer } from '../../../components/mixins/tooltips-mixin';
import { isDomainPathActive, actionsFilter } from '../utils';
import type { Domain as DomainType } from '../../../api/web-api';

type Props = {
  domains: Array<DomainType>,
  showDeprecated: boolean,
  showInternal: boolean,
  searchQuery: string,
  splat: string
};

export default class Menu extends React.PureComponent {
  props: Props;

  render() {
    const { domains, showInternal, showDeprecated, searchQuery, splat } = this.props;
    const filteredDomains = (domains || [])
      .map(domain => {
        const filteredActions = domain.actions.filter(action =>
          actionsFilter(showDeprecated, showInternal, searchQuery, domain, action)
        );
        return { ...domain, filteredActions };
      })
      .filter(domain => domain.filteredActions.length);

    return (
      <div className="api-documentation-results panel">
        <TooltipsContainer>
          <div className="list-group">
            {filteredDomains.map(domain => (
              <Link
                key={domain.path}
                className={classNames('list-group-item', {
                  active: isDomainPathActive(domain.path, splat)
                })}
                to={'/web_api/' + domain.path}>
                <h3 className="list-group-item-heading">
                  {domain.path}
                  {domain.deprecated && <DeprecatedBadge />}
                  {domain.internal && <InternalBadge />}
                </h3>
                {domain.description &&
                  <div
                    className="list-group-item-text markdown"
                    dangerouslySetInnerHTML={{ __html: domain.description }}
                  />}
              </Link>
            ))}
          </div>
        </TooltipsContainer>
      </div>
    );
  }
}
