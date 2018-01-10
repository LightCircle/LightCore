/**
 * Created by sh on 15/4/13.
 */

"use strict";

var _ = require("underscore")
  , moment = require("moment-timezone");

exports.dataParse = function (val, type, addition) {

  if (!val) {
    return val;
  }

  if (_.isDate(val)) {
    return val;
  }

  if (moment.isMoment(val)) {
    return val;
  }

  addition = addition || {};

  var timezone = addition.tz || "UTC"
    , date = moment.tz(val.replace(/\//g, "-"), timezone);

  return date.isValid() ? date.tz(timezone).toDate() : null;
};

exports.queryParse = function (val, type, addition) {

  if (!val) {
    return val;
  }

  if (_.isDate(val)) {
    return val;
  }

  if (moment.isMoment(val)) {
    return val;
  }

  addition = addition || {};

  var timezone = addition.tz || "UTC"
    , date = moment.tz(val.replace(/\//g, "-"), timezone);

  return date.isValid() ? date.tz(timezone).toDate() : null;
};
