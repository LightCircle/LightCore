/**
 * Created by sh on 15/7/6.
 */

"use strict";

var type = require("../type");


exports.parse = function (object, define, addition) {
  return type.dataParse(object, {type: Object, contents: Number}, addition);
};