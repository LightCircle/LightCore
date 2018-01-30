/**
 * @file mapping
 * @author qiou_kay@163.com
 * @module light.core.mongo.mapping
 * @version 1.0.0
 */
'use strict';

const Base = require('../mapping');

exports.default = function (object, define, addition) {
  return new Base().setDefaults(object, define, addition);
};

exports.dataParseAll = function (object, define, addition) {
  return new Base().dataParse(object, define, addition);
};

exports.queryParseAll = function (object, define, addition) {
  return new Base().queryParse(object, define, addition);
};
