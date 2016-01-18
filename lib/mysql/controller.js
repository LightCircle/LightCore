/**
 * @file controller的共通类
 * @author r2space@gmail.com
 * @module light.lib.mysql.controller
 * @version 1.0.0
 */

"use strict";

var path     = require("path")
  , async    = require("async")
  , _        = require("underscore")
  , model    = require("./model");

/**
 * 构造函数
 * @type {Controller}
 */
var Controller = module.exports = function Controller(handler) {
  this.params = handler.params;
  this.sql = handler.params.__api.script;
};


Controller.prototype.add = function (callback) {
  callback(null, {});
};


Controller.prototype.remove = function (callback) {
  callback(null, {});
};


Controller.prototype.update = function (callback) {
  callback(null, {});
};


Controller.prototype.list = function (callback) {
  new model().query(this.sql, this.params, callback);
};
