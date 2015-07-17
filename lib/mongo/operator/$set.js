/**
 * Created by sh on 15/7/6.
 */

"use strict";

var mapping = require("../mapping")
  , _ = require("underscore");


exports.parse = function(object, define) {
  return mapping.dataParseAll(object, define);
};
