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
import $ from 'jquery';
import Marionette from 'backbone.marionette';
import Template from './templates/coding-rules-layout.hbs';

export default Marionette.LayoutView.extend({
  template: Template,

  regions: {
    filtersRegion: '.search-navigator-filters',
    facetsRegion: '.search-navigator-facets',
    workspaceHeaderRegion: '.search-navigator-workspace-header',
    workspaceListRegion: '.search-navigator-workspace-list',
    workspaceDetailsRegion: '.search-navigator-workspace-details'
  },

  onRender() {
    const navigator = this.$('.search-navigator');
    const top = navigator.offset().top;
    this.$('.search-navigator-workspace-header').css({ top });
    this.$('.search-navigator-side').css({ top }).isolatedScroll();
  },

  showDetails() {
    this.scroll = $(window).scrollTop();
    this.$('.search-navigator').addClass('search-navigator-extended-view');
  },

  hideDetails() {
    this.$('.search-navigator').removeClass('search-navigator-extended-view');
    if (this.scroll != null) {
      $(window).scrollTop(this.scroll);
    }
  },

  detailsShow() {
    return this.$('.search-navigator').is('.search-navigator-extended-view');
  }
});
