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
import Marionette from 'backbone.marionette';
import Template from './templates/metrics-list-footer.hbs';

export default Marionette.ItemView.extend({
  template: Template,

  collectionEvents: {
    all: 'render'
  },

  events: {
    'click #metrics-fetch-more': 'onMoreClick'
  },

  onMoreClick(e) {
    e.preventDefault();
    this.fetchMore();
  },

  fetchMore() {
    this.collection.fetchMore();
  },

  serializeData() {
    return {
      ...Marionette.ItemView.prototype.serializeData.apply(this, arguments),
      total: this.collection.total,
      count: this.collection.length,
      more: this.collection.hasMore()
    };
  }
});
