/**
 * Created by sh on 15/7/6.
 */

"use strict";

var mapping = require("../mapping");


exports.parse = function (object, define, addition) {
  return mapping.dataParseAll(object, define, addition);
};
