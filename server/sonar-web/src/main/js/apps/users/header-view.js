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
import CreateView from './create-view';
import Template from './templates/users-header.hbs';

export default Marionette.ItemView.extend({
  template: Template,

  collectionEvents: {
    request: 'showSpinner',
    sync: 'hideSpinner'
  },

  events: {
    'click #users-create': 'onCreateClick'
  },

  showSpinner() {
    this.$('.spinner').removeClass('hidden');
  },

  hideSpinner() {
    this.$('.spinner').addClass('hidden');
  },

  onCreateClick(e) {
    e.preventDefault();
    this.createUser();
  },

  createUser() {
    new CreateView({
      collection: this.collection
    }).render();
  }
});
