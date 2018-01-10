/**
 * Created by sh on 15/5/15.
 */

"use strict";


exports.getType = function (define) {
  var type = define.type;
  if (define instanceof Function) {
    type = define.name;
  }
  if (define.type instanceof Function) {
    type = define.type.name;
  }
  return type.toLowerCase();
};