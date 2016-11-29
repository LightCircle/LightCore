/**
 * Created by sh on 15/4/10.
 */

"use strict";

var mapping = require("../mapping");


exports.parse = function (object, define, addition) {
  return mapping.queryParseAll(object, define, addition);
};


exports.compare = function (field, value) {
  return {$or: value};
};
