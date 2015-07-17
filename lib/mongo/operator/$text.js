/**
 * Created by sh on 15/4/10.
 */

"use strict";

var mapping = require("../mapping")
  , _ = require("underscore");


exports.parse = function(object, define) {
  return mapping.queryParseAll(object, {type: Object, contents: {
    $search: {type: String},
    $language: {type:String}
  }});
};