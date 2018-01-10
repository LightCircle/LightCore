/**
 * Created by sh on 15/4/13.
 */

"use strict";


exports.dataParse = function (val) {
  return String(val);
};

exports.queryParse = function (val) {

  if (val instanceof RegExp) {
    return val;
  }

  return String(val);
};