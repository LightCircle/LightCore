/**
 * Created by sh on 15/4/13.
 */

"use strict";

var _ = require("underscore")
  , ObjectID = require("mongodb").ObjectID;

exports.dataParse = function (val) {
  if (_.isArray(val)) {
    return _.map(val, function (item) {
      return toObjectID(item);
    });
  }
  return toObjectID(val);
};

exports.queryParse = function (val) {
  if (_.isArray(val)) {
    return _.map(val, function (item) {
      return toObjectID(item);
    });
  }
  return toObjectID(val);
};

function toObjectID(val) {
  if (val instanceof ObjectID) {
    return val;
  }
  if (_.isString(val) && val.length == 24) {
    return ObjectID(val);
  }
  return null;
}