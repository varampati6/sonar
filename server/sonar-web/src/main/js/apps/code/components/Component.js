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
import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';
import ComponentName from './ComponentName';
import ComponentMeasure from './ComponentMeasure';
import ComponentDetach from './ComponentDetach';
import ComponentPin from './ComponentPin';

const TOP_OFFSET = 200;
const BOTTOM_OFFSET = 10;

export default class Component extends React.PureComponent {
  componentDidMount() {
    this.handleUpdate();
  }

  componentDidUpdate() {
    this.handleUpdate();
  }

  handleUpdate() {
    const { selected } = this.props;

    // scroll viewport so the current selected component is visible
    if (selected) {
      setTimeout(() => {
        this.handleScroll();
      }, 0);
    }
  }

  handleScroll() {
    const node = ReactDOM.findDOMNode(this);
    const position = node.getBoundingClientRect();
    const { top, bottom } = position;
    if (bottom > window.innerHeight - BOTTOM_OFFSET) {
      window.scrollTo(0, bottom - window.innerHeight + window.scrollY + BOTTOM_OFFSET);
    } else if (top < TOP_OFFSET) {
      window.scrollTo(0, top + window.scrollY - TOP_OFFSET);
    }
  }

  render() {
    const { component, rootComponent, selected, previous, canBrowse } = this.props;
    const isView = ['VW', 'SVW'].includes(rootComponent.qualifier);

    let componentAction = null;

    if (!component.refKey || component.qualifier === 'SVW') {
      switch (component.qualifier) {
        case 'FIL':
        case 'UTS':
          componentAction = <ComponentPin component={component} />;
          break;
        default:
          componentAction = <ComponentDetach component={component} />;
      }
    }

    const columns = isView
      ? [
          { metric: 'releasability_rating', type: 'RATING' },
          { metric: 'reliability_rating', type: 'RATING' },
          { metric: 'security_rating', type: 'RATING' },
          { metric: 'sqale_rating', type: 'RATING' },
          { metric: 'ncloc', type: 'SHORT_INT' }
        ]
      : [
          { metric: 'ncloc', type: 'SHORT_INT' },
          { metric: 'bugs', type: 'SHORT_INT' },
          { metric: 'vulnerabilities', type: 'SHORT_INT' },
          { metric: 'code_smells', type: 'SHORT_INT' },
          { metric: 'coverage', type: 'PERCENT' },
          { metric: 'duplicated_lines_density', type: 'PERCENT' }
        ];

    return (
      <tr className={classNames({ selected })}>
        <td className="thin nowrap">
          <span className="spacer-right">
            {componentAction}
          </span>
        </td>
        <td className="code-name-cell">
          <ComponentName
            component={component}
            rootComponent={rootComponent}
            previous={previous}
            canBrowse={canBrowse}
          />
        </td>

        {columns.map(column => (
          <td key={column.metric} className="thin nowrap text-right">
            <div className="code-components-cell">
              <ComponentMeasure
                component={component}
                metricKey={column.metric}
                metricType={column.type}
              />
            </div>
          </td>
        ))}
      </tr>
    );
  }
}
