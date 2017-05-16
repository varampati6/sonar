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
import moment from 'moment';
import Tooltip from '../../../components/controls/Tooltip';
import { getPeriodDate, getPeriodLabel } from '../../../helpers/periods';
import { translateWithParameters } from '../../../helpers/l10n';

type DaysPeriod = {
  date: string,
  mode: 'days',
  parameter: string
};

type DatePeriod = {
  date: string,
  mode: 'date',
  parameter: string
};

type VersionPeriod = {
  date: string,
  mode: 'version',
  parameter: string
};

type PreviousAnalysisPeriod = {
  date: string,
  mode: 'previous_analysis'
};

type PreviousVersionPeriod = {
  date: string,
  mode: 'previous_version'
};

type Period =
  | DaysPeriod
  | DatePeriod
  | VersionPeriod
  | PreviousAnalysisPeriod
  | PreviousVersionPeriod;

export default function LeakPeriodLegend({ period }: { period: Period }) {
  const leakPeriodLabel = getPeriodLabel(period);

  if (period.mode === 'days') {
    return (
      <div className="overview-legend overview-legend-spaced-line">
        {translateWithParameters('overview.leak_period_x', leakPeriodLabel)}
      </div>
    );
  }

  const leakPeriodDate = getPeriodDate(period);
  const momentDate = moment(leakPeriodDate);
  const fromNow = momentDate.fromNow();
  const note = ['date'].includes(period.mode)
    ? translateWithParameters('overview.last_analysis_x', fromNow)
    : translateWithParameters('overview.started_x', fromNow);
  const tooltip = ['date'].includes(period.mode)
    ? translateWithParameters('overview.last_analysis_on_x', momentDate.format('LL'))
    : translateWithParameters('overview.started_on_x', momentDate.format('LL'));

  return (
    <Tooltip overlay={tooltip} placement="bottom">
      <div className="overview-legend">
        {translateWithParameters('overview.leak_period_x', leakPeriodLabel)}
        <br />
        <span className="note">{note}</span>
      </div>
    </Tooltip>
  );
}
