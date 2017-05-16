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
import { max } from 'd3-array';
import { scaleLinear, scaleBand } from 'd3-scale';
import { ResizeMixin } from './../mixins/resize-mixin';
import { TooltipsMixin } from './../mixins/tooltips-mixin';

export const Histogram = React.createClass({
  propTypes: {
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    yTicks: React.PropTypes.arrayOf(React.PropTypes.any),
    yValues: React.PropTypes.arrayOf(React.PropTypes.any),
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    padding: React.PropTypes.arrayOf(React.PropTypes.number),
    barsHeight: React.PropTypes.number,
    onBarClick: React.PropTypes.func
  },

  mixins: [ResizeMixin, TooltipsMixin],

  getDefaultProps() {
    return {
      xTicks: [],
      xValues: [],
      padding: [10, 10, 10, 10],
      barsHeight: 10
    };
  },

  getInitialState() {
    return { width: this.props.width, height: this.props.height };
  },

  handleClick(point) {
    this.props.onBarClick(point);
  },

  renderTicks(xScale, yScale) {
    if (!this.props.yTicks.length) {
      return null;
    }
    const ticks = this.props.yTicks.map((tick, index) => {
      const point = this.props.data[index];
      const x = xScale.range()[0];
      const y = Math.round(yScale(point.y) + yScale.bandwidth() / 2 + this.props.barsHeight / 2);
      const label = tick.label ? tick.label : tick;
      const tooltip = tick.tooltip ? tick.tooltip : null;
      return (
        <text
          key={index}
          className="bar-chart-tick histogram-tick"
          onClick={this.props.onBarClick && this.handleClick.bind(this, point)}
          style={{ cursor: this.props.onBarClick ? 'pointer' : 'default' }}
          data-title={tooltip}
          data-toggle={tooltip ? 'tooltip' : null}
          x={x}
          y={y}
          dx="-1em"
          dy="0.3em">
          {label}
        </text>
      );
    });
    return <g>{ticks}</g>;
  },

  renderValues(xScale, yScale) {
    if (!this.props.yValues.length) {
      return null;
    }
    const ticks = this.props.yValues.map((value, index) => {
      const point = this.props.data[index];
      const x = xScale(point.x);
      const y = Math.round(yScale(point.y) + yScale.bandwidth() / 2 + this.props.barsHeight / 2);
      return (
        <text
          key={index}
          onClick={this.props.onBarClick && this.handleClick.bind(this, point)}
          className="bar-chart-tick histogram-value"
          style={{ cursor: this.props.onBarClick ? 'pointer' : 'default' }}
          x={x}
          y={y}
          dx="1em"
          dy="0.3em">
          {value}
        </text>
      );
    });
    return <g>{ticks}</g>;
  },

  renderBars(xScale, yScale) {
    const bars = this.props.data.map((d, index) => {
      const x = Math.round(xScale(d.x)) + /* minimum bar width */ 1;
      const y = Math.round(yScale(d.y) + yScale.bandwidth() / 2);
      return (
        <rect
          key={index}
          className="bar-chart-bar"
          onClick={this.props.onBarClick && this.handleClick.bind(this, d)}
          style={{ cursor: this.props.onBarClick ? 'pointer' : 'default' }}
          x={0}
          y={y}
          width={x}
          height={this.props.barsHeight}
        />
      );
    });
    return <g>{bars}</g>;
  },

  render() {
    if (!this.state.width || !this.state.height) {
      return <div />;
    }

    const availableWidth = this.state.width - this.props.padding[1] - this.props.padding[3];
    const availableHeight = this.state.height - this.props.padding[0] - this.props.padding[2];

    const maxX = max(this.props.data, d => d.x);
    const xScale = scaleLinear().domain([0, maxX]).range([0, availableWidth]);
    const yScale = scaleBand()
      .domain(this.props.data.map(d => d.y))
      .rangeRound([0, availableHeight]);

    return (
      <svg className="bar-chart" width={this.state.width} height={this.state.height}>
        <g transform={`translate(${this.props.padding[3]}, ${this.props.padding[0]})`}>
          {this.renderTicks(xScale, yScale)}
          {this.renderValues(xScale, yScale)}
          {this.renderBars(xScale, yScale)}
        </g>
      </svg>
    );
  }
});
