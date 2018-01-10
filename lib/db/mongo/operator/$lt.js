/**
 * Created by sh on 15/4/10.
 */

"use strict";

var _ = require("underscore")
  , mapping = require("../mapping")
  , type = require("../type")
  , util = require("./util")
  ;


exports.parse = function (object, define, addition) {
  if (_.isUndefined(define.contents)) {
    var defineType = util.getType(define);
    // 支持数组的$eq
    if (defineType == "array" && !_.isArray(object)) {
      return object;
    }
    return type.queryParse(object, define, addition);
  } else {
    return mapping.queryParseAll(object, define.contents, addition);
  }
};


exports.compare = function (field, value) {
  return _.object([field], [{$lt: value}]);
};
