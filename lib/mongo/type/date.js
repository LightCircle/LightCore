/**
 * Created by sh on 15/4/13.
 */

"use strict";

var _ = require("underscore")
  , moment = require("moment");

exports.dataParse = function (val) {

  if (_.isDate(val)) {
    return val;
  }

  var date = moment(new Date(val));

  return date.isValid() ? date.toDate() : null;
};

exports.queryParse = function (val) {

  if (_.isDate(val)) {
    return val;
  }

  var date = moment(new Date(val));

  return date.isValid() ? date.toDate() : null;
};