/**
 * Created by sh on 15/4/13.
 */

'use strict';

const _    = require('lodash')
  , moment = require('moment-timezone');

exports.dataParse = function (val, type, addition) {

  if (typeof val === 'undefined' || val === null) {
    return val;
  }

  if (_.isDate(val)) {
    return val;
  }

  if (moment.isMoment(val)) {
    return val;
  }

  if (typeof val !== 'string') {
    return null;
  }

  addition = addition || {};

  const timezone = addition.tz || 'UTC'
    , date       = moment.tz(val.replace(/\//g, '-'), timezone);

  return date.isValid() ? date.tz(timezone).toDate() : null;
};

exports.queryParse = function (val, type, addition) {

  if (typeof val === 'undefined' || val === null) {
    return val;
  }

  if (_.isDate(val)) {
    return val;
  }

  if (moment.isMoment(val)) {
    return val;
  }

  if (typeof val !== 'string') {
    return null;
  }

  addition = addition || {};

  const timezone = addition.tz || 'UTC'
    , date       = moment.tz(val.replace(/\//g, '-'), timezone);

  return date.isValid() ? date.tz(timezone).toDate() : null;
};
