/**
 * function.js
 */

'use strict';

const cache = light.framework.cache
  , CONST = require('../constant');

/**
 * 获取菜单信息，默认返回缓存中的菜单信息
 * @param handler
 * @param callback
 */
exports.list = function (handler, callback) {
  callback(null, cache.get(CONST.SYSTEM_DB_FUNCTION));
};