/**
 * Created by sh on 15/4/13.
 */

"use strict";

var _ = require("underscore")
  , type = require("./index")
  ;

exports.dataParse = function (val, contentsType, addition) {
  if (type.isBlank(val)) {
    return {};
  }

  var oldVal = val;
  if (_.isString(val)) {
    try {
      val = JSON.parse(val);
    } catch (e) {
      return val;
    }
    if (_.isBoolean(val) || _.isNumber(val)) {
      return oldVal;
    }
  }
  if (!_.isUndefined(contentsType)) {
    _.each(val, function (v, k) {
      if (!contentsType[k]) {
        return;
      }

      val[k] = type.dataParse(v, contentsType[k], addition);
    });
  }

  return val;
};

exports.queryParse = function (val, contentsType, addition) {

  if (type.isBlank(val)) {
    return {};
  }

  var oldVal = val;
  if (_.isString(val)) {
    try {
      return JSON.parse(val);
    } catch (e) {
    }
    if (_.isBoolean(val) || _.isNumber(val)) {
      return oldVal;
    }
  }
  if (!_.isUndefined(contentsType)) {
    _.each(val, function (v, k) {
      val[k] = type.dataParse(v, contentsType[k], addition);
    });
  }

  return val;
};
