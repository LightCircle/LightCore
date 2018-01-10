/**
 * Created by sh on 15/4/10.
 */

'use strict';

const mapping = require('../mapping')
  , type      = require('../type');


exports.parse = function (object, define, addition) {
  if (typeof define.contents === 'undefined') {
    return type.queryParse(object, define, addition);
  }

  return mapping.queryParseAll(object, define.contents, addition);
};

exports.compare = function (field, value) {

  // in比较，如果传递的是字符串，尝试转换成数组
  if (typeof value === 'string') {
    return {[field]: {$in: value.split(',').map(item => item.trim())}};
  }

  return {[field]: {$in: value}};
};
