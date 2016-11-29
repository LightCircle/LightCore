/**
 * Created by sh on 15/4/13.
 */

"use strict";

var _ = require("underscore")
  , helper = require("../../helper");

exports.dataParse = function (val, contentsType, addition) {
  if (_.str.isBlank(val)) {
    return {};
  }

  var oldVal = val;
  if (_.isString(val)) {
    try {
      val = JSON.parse(val);
    } catch (e) {
    }
    if (_.isBoolean(val) || _.isNumber(val)) {
      return oldVal;
    }
  }
  if (!_.isUndefined(contentsType)) {
    var parser = helper.resolve(contentsType, __dirname + "/");
    _.each(val, function (v, k) {
      val[k] = parser.dataParse(v, contentsType, addition);
    });
  }

  return val;
};

exports.queryParse = function (val, contentsType, addition) {

  if (_.str.isBlank(val)) {
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
    var parser = helper.resolve(contentsType, __dirname + "/");
    _.each(val, function (v, k) {
      val[k] = parser.dataParse(v, contentsType, addition);
    });
  }

  return val;
};
