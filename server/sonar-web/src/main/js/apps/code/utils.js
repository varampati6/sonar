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
import { without } from 'lodash';
import {
  addComponent,
  getComponent as getComponentFromBucket,
  addComponentChildren,
  getComponentChildren,
  addComponentBreadcrumbs,
  getComponentBreadcrumbs
} from './bucket';
import { getChildren, getComponent, getBreadcrumbs } from '../../api/components';
import { translate } from '../../helpers/l10n';

const METRICS = [
  'ncloc',
  'code_smells',
  'bugs',
  'vulnerabilities',
  'coverage',
  'duplicated_lines_density',
  'alert_status'
];

const VIEW_METRICS = [
  'releasability_rating',
  'alert_status',
  'reliability_rating',
  'security_rating',
  'sqale_rating',
  'ncloc'
];

const PAGE_SIZE = 100;

function requestChildren(componentKey, metrics, page) {
  return getChildren(componentKey, metrics, { p: page, ps: PAGE_SIZE }).then(r => {
    if (r.paging.total > r.paging.pageSize * r.paging.pageIndex) {
      return requestChildren(componentKey, metrics, page + 1).then(moreComponents => {
        return [...r.components, ...moreComponents];
      });
    }
    return r.components;
  });
}

function requestAllChildren(componentKey, metrics) {
  return requestChildren(componentKey, metrics, 1);
}

function expandRootDir(metrics) {
  return function({ components, total, ...other }) {
    const rootDir = components.find(
      component => component.qualifier === 'DIR' && component.name === '/'
    );
    if (rootDir) {
      return requestAllChildren(rootDir.key, metrics).then(rootDirComponents => {
        const nextComponents = without([...rootDirComponents, ...components], rootDir);
        const nextTotal = total + rootDirComponents.length - /* root dir */ 1;
        return { components: nextComponents, total: nextTotal, ...other };
      });
    } else {
      return { components, total, ...other };
    }
  };
}

function prepareChildren(r) {
  return {
    components: r.components,
    total: r.paging.total,
    page: r.paging.pageIndex,
    baseComponent: r.baseComponent
  };
}

function skipRootDir(breadcrumbs) {
  return breadcrumbs.filter(component => {
    return !(component.qualifier === 'DIR' && component.name === '/');
  });
}

function storeChildrenBase(children) {
  children.forEach(addComponent);
}

function storeChildrenBreadcrumbs(parentComponentKey, children) {
  const parentBreadcrumbs = getComponentBreadcrumbs(parentComponentKey);
  if (parentBreadcrumbs) {
    children.forEach(child => {
      const breadcrumbs = [...parentBreadcrumbs, child];
      addComponentBreadcrumbs(child.key, breadcrumbs);
    });
  }
}

function getMetrics(isView) {
  return isView ? VIEW_METRICS : METRICS;
}

/**
 * @param {string} componentKey
 * @param {boolean} isView
 * @returns {Promise}
 */
function retrieveComponentBase(componentKey, isView) {
  const existing = getComponentFromBucket(componentKey);
  if (existing) {
    return Promise.resolve(existing);
  }

  const metrics = getMetrics(isView);

  return getComponent(componentKey, metrics).then(component => {
    addComponent(component);
    return component;
  });
}

/**
 * @param {string} componentKey
 * @param {boolean} isView
 * @returns {Promise}
 */
export function retrieveComponentChildren(componentKey, isView) {
  const existing = getComponentChildren(componentKey);
  if (existing) {
    return Promise.resolve({
      components: existing.children,
      total: existing.total,
      page: existing.page
    });
  }

  const metrics = getMetrics(isView);

  return getChildren(componentKey, metrics, { ps: PAGE_SIZE, s: 'qualifier,name' })
    .then(prepareChildren)
    .then(expandRootDir(metrics))
    .then(r => {
      addComponentChildren(componentKey, r.components, r.total, r.page);
      storeChildrenBase(r.components);
      storeChildrenBreadcrumbs(componentKey, r.components);
      return r;
    });
}

function retrieveComponentBreadcrumbs(componentKey) {
  const existing = getComponentBreadcrumbs(componentKey);
  if (existing) {
    return Promise.resolve(existing);
  }

  return getBreadcrumbs(componentKey).then(skipRootDir).then(breadcrumbs => {
    addComponentBreadcrumbs(componentKey, breadcrumbs);
    return breadcrumbs;
  });
}

/**
 * @param {string} componentKey
 * @param {boolean} isView
 * @returns {Promise}
 */
export function retrieveComponent(componentKey, isView) {
  return Promise.all([
    retrieveComponentBase(componentKey, isView),
    retrieveComponentChildren(componentKey, isView),
    retrieveComponentBreadcrumbs(componentKey)
  ]).then(r => {
    return {
      component: r[0],
      components: r[1].components,
      total: r[1].total,
      page: r[1].page,
      breadcrumbs: r[2]
    };
  });
}

export function loadMoreChildren(componentKey, page, isView) {
  const metrics = getMetrics(isView);

  return getChildren(componentKey, metrics, { ps: PAGE_SIZE, p: page })
    .then(prepareChildren)
    .then(expandRootDir(metrics))
    .then(r => {
      addComponentChildren(componentKey, r.components, r.total, r.page);
      storeChildrenBase(r.components);
      storeChildrenBreadcrumbs(componentKey, r.components);
      return r;
    });
}

/**
 * Parse response of failed request
 * @param {Error} error
 * @returns {Promise}
 */
export function parseError(error) {
  const DEFAULT_MESSAGE = translate('default_error_message');

  try {
    return error.response
      .json()
      .then(r => r.errors.map(error => error.msg).join('. '))
      .catch(() => DEFAULT_MESSAGE);
  } catch (ex) {
    return Promise.resolve(DEFAULT_MESSAGE);
  }
}
