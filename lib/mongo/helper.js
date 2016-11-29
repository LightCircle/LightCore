/**
 * @file mongo工具类
 * @author r2space@gmail.com
 * @module light.core.mongo.helper
 * @version 1.0.0
 */

"use strict";

var _ = require("underscore")
  , pluralize = require("pluralize")
  , constant = require("../constant")
  , ObjectID = require("mongodb").ObjectID
  ;

/**
 * collection名统一用小写
 * 与之前使用的mongoose保持兼容，collection名后面加s
 * @param code
 * @returns {string}
 */
exports.collection = function (code) {
  if (code) {
    return pluralize(code.toLowerCase());
  }

  return code;
};

/**
 * 将字段字符串，转换成mongodb的选择字段格式
 * `col1 col2, col3` => {col1: 1, col2: 1, col3: 1}
 * @param {Object} select 空格或逗号分隔的字符串或select对象
 * @return {Object} mongodb格式
 */
exports.fields = function (select) {
  if (!select) {
    return {};
  }

  if (_.isString(select)) {
    var result = {};
    _.each(select.trim().split(/[ ]+|[ ]*,[ ]*/), function (key) {
      result[key] = 1;
    });

    return result;
  }

  return select;
};

exports.sort = function(object) {
  if (_.isArray(object)) {
    return object;
  }

  return _.mapObject(object, function(val, key) {
    if (_.isString(val)) {
      return val.toLowerCase() == "asc" ? 1 : -1;
    }

    return val;
  });
};