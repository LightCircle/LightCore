/**
 * Created by sh on 15/4/10.
 */

"use strict";

var type = require("../type")
  , _ = require("underscore");


exports.parse = function (object) {
  return type.queryParse(object, {type: RegExp});
};

exports.compare = function (field, value) {
  return _.object([field], [{$regex: value}]);
};
