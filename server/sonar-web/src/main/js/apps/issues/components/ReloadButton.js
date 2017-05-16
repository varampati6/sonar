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
import Tooltip from '../../../components/controls/Tooltip';
import { translate } from '../../../helpers/l10n';

type Props = {|
  className?: string,
  onClick: () => void
|};

/* eslint-disable max-len */
const icon = (
  <svg width="18" height="24" viewBox="0 0 18 24">
    <path d="M16.6454 8.1084c-.3-.5-.9-.7-1.4-.4-.5.3-.7.9-.4 1.4.9 1.6 1.1 3.4.6 5.1-.5 1.7-1.7 3.2-3.2 4-3.3 1.8-7.4.6-9.1-2.7-1.8-3.1-.8-6.9 2.1-8.8v3.3h2v-7h-7v2h3.9c-3.7 2.5-5 7.5-2.8 11.4 1.6 3 4.6 4.6 7.7 4.6 1.4 0 2.8-.3 4.2-1.1 2-1.1 3.5-3 4.2-5.2.6-2.2.3-4.6-.8-6.6z" />
  </svg>
);
/* eslint-enable max-len */

export default function ReloadButton(props: Props) {
  const handleClick = (event: Event) => {
    event.preventDefault();
    props.onClick();
  };

  return (
    <Tooltip overlay={translate('reload')}>
      <a
        className={classNames('concise-issues-list-header-button', props.className)}
        href="#"
        onClick={handleClick}>
        {icon}
      </a>
    </Tooltip>
  );
}
