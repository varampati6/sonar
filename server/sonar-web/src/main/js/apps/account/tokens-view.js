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
import Clipboard from 'clipboard';
import Template from './templates/account-tokens.hbs';
import { getTokens, generateToken, revokeToken } from '../../api/user-tokens';

export default Marionette.ItemView.extend({
  template: Template,

  events() {
    return {
      'submit .js-generate-token-form': 'onGenerateTokenFormSubmit',
      'submit .js-revoke-token-form': 'onRevokeTokenFormSubmit'
    };
  },

  initialize() {
    this.tokens = null;
    this.newToken = null;
    this.errors = [];
    this.requestTokens();
  },

  requestTokens() {
    return getTokens(this.model.id).then(tokens => {
      this.tokens = tokens;
      this.render();
    });
  },

  onGenerateTokenFormSubmit(e) {
    e.preventDefault();
    this.errors = [];
    this.newToken = null;
    const tokenName = this.$('.js-generate-token-form input').val();
    generateToken(this.model.id, tokenName)
      .then(response => {
        this.newToken = response;
        this.requestTokens();
      })
      .catch(error => {
        error.response.json().then(response => {
          this.errors = response.errors;
          this.render();
        });
      });
  },

  onRevokeTokenFormSubmit(e) {
    e.preventDefault();
    const tokenName = $(e.currentTarget).data('token');
    const token = this.tokens.find(token => token.name === `${tokenName}`);
    if (token) {
      if (token.deleting) {
        revokeToken(this.model.id, tokenName).then(this.requestTokens.bind(this));
      } else {
        token.deleting = true;
        this.render();
      }
    }
  },

  onRender() {
    const copyButton = this.$('.js-copy-to-clipboard');
    if (copyButton.length) {
      const clipboard = new Clipboard(copyButton.get(0));
      clipboard.on('success', () => {
        copyButton
          .tooltip({ title: 'Copied!', placement: 'bottom', trigger: 'manual' })
          .tooltip('show');
        setTimeout(() => copyButton.tooltip('hide'), 1000);
      });
    }
    this.newToken = null;
  },

  serializeData() {
    return {
      ...Marionette.ItemView.prototype.serializeData.apply(this, arguments),
      tokens: this.tokens,
      newToken: this.newToken,
      errors: this.errors
    };
  }
});
