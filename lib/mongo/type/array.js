/**
 * Created by sh on 15/4/13.
 */

"use strict";

var _ = require("underscore")
  , helper = require("../../helper");


exports.dataParse = function (val, contentsType, addition) {

  val = toArray(val);

  if (_.isUndefined(contentsType)) {
    return val;
  }

  var parser = helper.resolve(contentsType, __dirname + "/");
  _.each(val, function (obj, index) {
    val[index] = parser.dataParse(obj, contentsType, addition);
  });

  return val;
};

exports.queryParse = function (val, contentsType, addition) {

  val = toArray(val);

  if (_.isUndefined(contentsType)) {
    return val;
  }

  var parser = helper.resolve(contentsType, __dirname + "/");
  _.each(val, function (obj, index) {
    val[index] = parser.queryParse(obj, contentsType, addition);
  });

  return val;
};

function toArray(val) {

  if (_.str.isBlank(val)) {
    return [];
  }

  if (_.isString(val)) {
    try {
      val = JSON.parse(val);
    } catch (e) {
    }
  }

  return _.isArray(val) ? val : [val];
}
