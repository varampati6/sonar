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
import { translate } from '../../helpers/l10n';

type Props = {|
  canTurnToPrivate: boolean,
  className?: string,
  onChange: string => void,
  visibility: string
|};

export default class VisibilitySelector extends React.PureComponent {
  props: Props;

  handlePublicClick = (event: Event & { currentTarget: HTMLElement }) => {
    event.preventDefault();
    event.currentTarget.blur();
    this.props.onChange('public');
  };

  handlePrivateClick = (event: Event & { currentTarget: HTMLElement }) => {
    event.preventDefault();
    event.currentTarget.blur();
    this.props.onChange('private');
  };

  render() {
    return (
      <div className={this.props.className}>
        <a
          className="link-base-color link-no-underline"
          id="visibility-public"
          href="#"
          onClick={this.handlePublicClick}>
          <i
            className={classNames('icon-radio', {
              'is-checked': this.props.visibility === 'public'
            })}
          />
          <span className="spacer-left">{translate('visibility.public')}</span>
        </a>

        {this.props.canTurnToPrivate
          ? <a
              className="link-base-color link-no-underline huge-spacer-left"
              id="visibility-private"
              href="#"
              onClick={this.handlePrivateClick}>
              <i
                className={classNames('icon-radio', {
                  'is-checked': this.props.visibility === 'private'
                })}
              />
              <span className="spacer-left">{translate('visibility.private')}</span>
            </a>
          : <span
              className="huge-spacer-left text-muted cursor-not-allowed"
              id="visibility-private">
              <i
                className={classNames('icon-radio', {
                  'is-checked': this.props.visibility === 'private'
                })}
              />
              <span className="spacer-left">{translate('visibility.private')}</span>
            </span>}
      </div>
    );
  }
}
