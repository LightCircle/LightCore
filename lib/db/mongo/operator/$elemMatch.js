/**
 * Created by sh on 15/4/10.
 */

"use strict";

var mapping = require("../mapping");


exports.parse = function (object, define, addition) {
  if (define.type && define.type.toLowerCase() == "object") {
    return object;
  }
  return mapping.queryParseAll(object, define, addition);
};
