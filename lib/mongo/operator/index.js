/**
 * @file mongo操作符支持
 *  支持生成比较对象
 *  支持类型转换
 * @module light.framework.mongo.operator
 * @author r2space@hotmail.com
 * @version 1.0.0
 */

"use strict";

var helper = require("../../helper");


/**
 * 生成Mongodb的比较用Object
 * @param operator
 * @param field
 * @param value
 * @returns {*}
 */
exports.compare = function(operator, field, value) {

  operator = helper.resolve(operator, __dirname + "/");
  if (!operator) {
    return {};
  }

  return operator.compare(field, value);
};

/**
 * 数据类型转换
 * @param key
 * @param object
 * @param define
 * @returns {*}
 */
exports.parse = function(key, object, define) {

  var operator = helper.resolve(key, __dirname + "/");
  if (operator) {
    object = operator.parse(object, define);
  }

  return object;
};