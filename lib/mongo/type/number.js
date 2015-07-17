/**
 * Created by sh on 15/4/13.
 */

"use strict";

var _ = require("underscore");

exports.dataParse = function (val) {

  if (_.isNumber(val)) {
    return val;
  }
  if (_.isString(val)) {
    val = Number(val);
    return _.isNaN(val) ? null : val;
  }

  return null;
};

exports.queryParse = function (val) {

  if (_.isNumber(val)) {
    return val;
  }
  if (_.isString(val)) {
    val = Number(val);
    return _.isNaN(val) ? null : val;
  }

  return null;
};