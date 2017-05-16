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
import ComparisonForm from './ComparisonForm';
import ComparisonResults from './ComparisonResults';
import { compareProfiles } from '../../../api/quality-profiles';
import { getProfileComparePath } from '../utils';
import type { Profile } from '../propTypes';

type Props = {
  location: { query: { withKey?: string } },
  organization: ?string,
  profile: Profile,
  profiles: Array<Profile>
};

type State = {
  loading: boolean,
  left?: { name: string },
  right?: { name: string },
  inLeft?: Array<*>,
  inRight?: Array<*>,
  modified?: Array<*>
};

export default class ComparisonContainer extends React.PureComponent {
  mounted: boolean;
  props: Props;
  state: State;

  static contextTypes = {
    router: React.PropTypes.object
  };

  constructor(props: Props) {
    super(props);
    this.state = { loading: false };
  }

  componentDidMount() {
    this.mounted = true;
    this.loadResults();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.profile !== this.props.profile || prevProps.location !== this.props.location) {
      this.loadResults();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  loadResults() {
    const { withKey } = this.props.location.query;
    if (!withKey) {
      this.setState({ left: undefined, loading: false });
      return;
    }

    this.setState({ loading: true });
    compareProfiles(this.props.profile.key, withKey).then(r => {
      if (this.mounted) {
        this.setState({
          left: r.left,
          right: r.right,
          inLeft: r.inLeft,
          inRight: r.inRight,
          modified: r.modified,
          loading: false
        });
      }
    });
  }

  handleCompare = (withKey: string) => {
    const path = getProfileComparePath(
      this.props.profile.name,
      this.props.profile.language,
      this.props.organization,
      withKey
    );
    this.context.router.push(path);
  };

  render() {
    const { profile, profiles, location } = this.props;
    const { withKey } = location.query;
    const { left, right, inLeft, inRight, modified } = this.state;

    return (
      <div className="quality-profile-box js-profile-comparison">
        <header className="spacer-bottom">
          <ComparisonForm
            withKey={withKey}
            profile={profile}
            profiles={profiles}
            onCompare={this.handleCompare}
          />

          {this.state.loading && <i className="spinner spacer-left" />}
        </header>

        {left != null &&
          <ComparisonResults
            left={left}
            right={right}
            inLeft={inLeft}
            inRight={inRight}
            modified={modified}
            organization={this.props.organization}
          />}
      </div>
    );
  }
}
