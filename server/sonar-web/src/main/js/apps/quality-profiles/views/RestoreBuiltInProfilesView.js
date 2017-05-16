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
import ModalFormView from '../../../components/common/modal-form';
import Template from '../templates/quality-profiles-restore-built-in-profiles.hbs';
import TemplateSuccess from '../templates/quality-profiles-restore-built-in-profiles-success.hbs';
import { restoreBuiltInProfiles } from '../../../api/quality-profiles';

export default ModalFormView.extend({
  template: Template,
  successTemplate: TemplateSuccess,

  getTemplate() {
    return this.selectedLanguage ? this.successTemplate : this.template;
  },

  onRender() {
    ModalFormView.prototype.onRender.apply(this, arguments);
    this.$('select').select2({
      width: '250px',
      minimumResultsForSearch: 50
    });
  },

  onFormSubmit() {
    ModalFormView.prototype.onFormSubmit.apply(this, arguments);
    this.disableForm();
    this.sendRequest();
  },

  sendRequest() {
    const language = this.$('#restore-built-in-profiles-language').val();
    this.selectedLanguage = this.options.languages.find(l => l.key === language).name;
    const data = this.options.organization
      ? { language, organization: this.options.organization }
      : { language };
    restoreBuiltInProfiles(data)
      .then(() => {
        this.done = true;
        this.render();
        this.trigger('done');
      })
      .catch(e => {
        this.enableForm();
        e.response.json().then(r => this.showErrors(r.errors, r.warnings));
      });
  },

  serializeData() {
    return {
      languages: this.options.languages,
      selectedLanguage: this.selectedLanguage
    };
  }
});
