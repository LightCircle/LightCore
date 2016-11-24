/**
 * Created by sh on 15/4/10.
 */

"use strict";

var mapping = require("../mapping")
  , _ = require("underscore");


exports.parse = function(object, define) {
  if (define.type && define.type.toLowerCase() == "object") {
    return object;
  }
  return mapping.queryParseAll(object, define);
};
