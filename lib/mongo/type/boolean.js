/**
 * Created by sh on 15/4/13.
 */

"use strict";

var _ = require("underscore");

exports.dataParse = function (val) {

  if (_.isBoolean(val)) {
    return val;
  }
  if (_.isString(val)) {
    return val !== 'false' && val !== '0';
  }
  if (_.isNumber(val)) {
    return val !== 0;
  }
  return null;
};

exports.queryParse = function (val) {

  if (_.isBoolean(val)) {
    return val;
  }
  if (_.isString(val)) {
    return val !== 'false' && val !== '0';
  }
  if (_.isNumber(val)) {
    return val !== 0;
  }
  return null;
};