/**
 * Created by sh on 15/4/10.
 */

"use strict";

var type = require("../type");


exports.parse = function (object, define, addition) {
  return type.queryParse(object, {type: Number}, addition);
};
