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
export function collapsePath(path, limit = 30) {
  if (typeof path !== 'string') {
    return '';
  }

  const tokens = path.split('/');

  if (tokens.length <= 2) {
    return path;
  }

  const head = tokens[0];
  const tail = tokens[tokens.length - 1];
  const middle = tokens.slice(1, -1);
  let cut = false;

  while (middle.join().length > limit && middle.length > 0) {
    middle.shift();
    cut = true;
  }

  const body = [].concat(head, cut ? ['...'] : [], middle, tail);
  return body.join('/');
}

/**
 * Return a collapsed path without a file name
 * @example
 * // returns 'src/.../js/components/navigator/app/models/'
 * collapsedDirFromPath('src/main/js/components/navigator/app/models/state.js')
 * @param {string} path
 * @returns {string|null}
 */
export function collapsedDirFromPath(path) {
  const limit = 30;
  if (typeof path === 'string') {
    const tokens = path.split('/').slice(0, -1);
    if (tokens.length > 2) {
      const head = tokens[0];
      const tail = tokens[tokens.length - 1];
      const middle = tokens.slice(1, -1);

      let cut = false;
      while (middle.join().length > limit && middle.length > 0) {
        middle.shift();
        cut = true;
      }
      const body = [].concat(head, cut ? ['...'] : [], middle, tail);
      return body.join('/') + '/';
    } else {
      return tokens.join('/') + '/';
    }
  } else {
    return null;
  }
}

/**
 * Return a file name for a given file path
 * * @example
 * // returns 'state.js'
 * collapsedDirFromPath('src/main/js/components/navigator/app/models/state.js')
 * @param {string} path
 * @returns {string|null}
 */
export function fileFromPath(path) {
  if (typeof path === 'string') {
    const tokens = path.split('/');
    return tokens[tokens.length - 1];
  } else {
    return null;
  }
}

export function splitPath(path) {
  if (typeof path === 'string') {
    const tokens = path.split('/');
    return {
      head: tokens.slice(0, -1).join('/'),
      tail: tokens[tokens.length - 1]
    };
  } else {
    return null;
  }
}

export function limitComponentName(str) {
  if (typeof str === 'string') {
    const LIMIT = 30;
    return str.length > LIMIT ? str.substr(0, LIMIT) + '...' : str;
  } else {
    return '';
  }
}
