/**
 * @file controller的共通类
 * @author r2space@gmail.com
 * @module light.lib.mysql.controller
 * @version 1.0.0
 */

"use strict";

var path     = require("path")
  , _        = require("underscore")
  , log      = require("../log")
  , type     = require("../mongo/type")
  , model    = require("./model");


/**
 * 构造函数
 * @type {Controller}
 */
var Controller = module.exports = function Controller(handler) {

  this.params = {};
  this.handler = handler;

  if (handler.params.__api) {
    this.sql = handler.params.__api.script;
    this.filters = handler.params.__api.filters;
  }
};


Controller.prototype.add = function (callback) {

  this.filter();
  this.convert();

  log.debug(this.params, this.handler.uid);
  new model().query(this.sql, this.params, callback);
};


Controller.prototype.remove = function (callback) {

  this.filter();

  log.debug(this.params, this.handler.uid);
  new model().query(this.sql, this.params, callback);
};


Controller.prototype.update = function (callback) {

  this.filter();
  this.convert();

  log.debug(this.params, this.handler.uid);
  new model().query(this.sql, this.params, callback);
};


Controller.prototype.list = function (callback) {

  this.filter();

  log.debug(this.params, this.handler.uid);
  new model().query(this.sql, this.params, callback);
};


/**
 * @desc 直接指定SQL和参数执行, 不会对参数进行类型转换等.
 * @param sql
 * @param params
 * @param callback
 */
Controller.prototype.query = function (sql, params, callback) {

  if (_.isFunction(params)) {
    callback = params;
    params = undefined;
  }

  new model().query(sql, params, callback);
};


Controller.prototype.escape = function (params) {
  return new model().escape(params);
};


/**
 * @desc 根据定义, 对条件进行类型转换
 * @returns {*}
 */
Controller.prototype.filter = function () {

  // 如果定义了自由条件，则对检索条件框架不做任何处理
  if (this.handler.params.free) {

    this.params = this.handler.params.free;
    return this.params;
  }

  // 没有检索条件，返回空
  var data = this.handler.params.condition || this.handler.params.filter || this.handler.params;

  _.each(this.filters, function (filter) {

    var value = data[filter.parameter];

    // 如果没有取到值, 则尝试使用预约语解析
    if (_.isUndefined(value)) {
      value = parseReserved(this.handler, filter.parameter);
    }

    // 对参数进行类型转换
    this.params[filter.parameter] = type.parse(value, filter.type);
  }.bind(this));

  return this.params;
};


/**
 * @desc 对数据进行类型转换
 * @returns {*}
 */
Controller.prototype.convert = function () {

  var data = this.handler.params.data || this.handler.params;

  _.each(this.filters, function (filter) {

    var value = data[filter.parameter];

    // 如果没有取到值, 则尝试使用预约语解析
    if (_.isUndefined(value)) {
      value = parseReserved(this.handler, filter.parameter);
    }

    // 对参数进行类型转换
    this.params[filter.parameter] = type.parse(value, filter.type);
  }.bind(this));

  return this.params;
};


/**
 * @desc 获取预约语对应的值
 *  $uid 当前用户ID
 *  $sysdate 日期型，系统当前日期 没有时间信息
 *  $systime 日期型，系统当前日期 包含时间信息
 * @ignore
 * @param handler
 * @param keyword
 * @returns {*}
 */
function parseReserved(handler, keyword) {
  if (keyword === "$uid") {
    return handler.uid;
  }

  if (keyword === "$sysdate") {
    return new Date();
  }

  if (keyword === "$systime") {
    return new Date();
  }

  if (keyword === "$corp") {
    return handler.corp;
  }

  return null;
}