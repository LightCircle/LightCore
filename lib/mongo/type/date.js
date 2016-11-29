/**
 * Created by sh on 15/4/13.
 */

"use strict";

var _ = require("underscore")
  , moment = require("moment-timezone");

exports.dataParse = function (val, type, addition) {

  if (_.isDate(val)) {
    return val;
  }

  addition = addition || {};

  var date = moment(new Date(val))
    , timezone = addition.tz || "UTC";

  return date.isValid() ? date.tz(timezone).toDate() : null;
};

exports.queryParse = function (val, type, addition) {

  if (_.isDate(val)) {
    return val;
  }

  addition = addition || {};

  var date = moment(new Date(val))
    , timezone = addition.tz || "UTC";

  return date.isValid() ? date.tz(timezone).toDate() : null;
};
