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
import ActionsCell from './ActionsCell';
import { translate } from '../../../helpers/l10n';

export default class TemplateHeader extends React.PureComponent {
  static propTypes = {
    organization: React.PropTypes.object,
    template: React.PropTypes.object.isRequired,
    loading: React.PropTypes.bool.isRequired,
    refresh: React.PropTypes.func.isRequired,
    topQualifiers: React.PropTypes.array.isRequired
  };

  render() {
    const { template, organization } = this.props;

    const pathname = organization
      ? `/organizations/${organization.key}/permission_templates`
      : '/permission_templates';

    return (
      <header id="project-permissions-header" className="page-header">
        <div className="note spacer-bottom">
          <Link to={pathname} className="text-muted">
            {translate('permission_templates.page')}
          </Link>
        </div>

        <h1 className="page-title">
          {template.name}
        </h1>

        {this.props.loading && <i className="spinner" />}

        <div className="pull-right">
          <ActionsCell
            organization={this.props.organization}
            permissionTemplate={this.props.template}
            topQualifiers={this.props.topQualifiers}
            refresh={this.props.refresh}
            fromDetails={true}
          />
        </div>
      </header>
    );
  }
}
