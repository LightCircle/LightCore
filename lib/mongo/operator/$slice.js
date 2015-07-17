/**
 * Created by sh on 15/4/10.
 */

"use strict";

var type = require("../type")
  , _ = require("underscore");


exports.parse = function(object, define) {
  return type.queryParse(object, {type: Array, contents: Number});
};