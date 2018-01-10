/**
 * Created by sh on 15/4/10.
 */

"use strict";

var mapping = require("../mapping");


exports.parse = function (object, define, addition) {
  return mapping.queryParseAll(object, {
    type: Object, contents: {
      $search: {type: String},
      $language: {type: String}
    }
  }, addition);
};
