/**
 * Created by sh on 15/4/10.
 */

"use strict";

var _ = require("underscore")
  , mapping = require("../mapping")
  , type = require("../type")
  ;


exports.parse = function(object, define) {
  if (_.isUndefined(define.contents)) {
    return type.queryParse(object, define);
  } else {
    return mapping.queryParseAll(object, define.contents);
  }
};


exports.compare = function (field, value) {
  return _.object([field], [{$nin: value}]);
};
