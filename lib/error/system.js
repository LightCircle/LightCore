/**
 * @file 系统异常类。
 * @module light.core.error.system
 * @author qiou_kay@163.com
 * @version 1.0.0
 */


"use strict";

var util   = require("util")
  , errors = require("./common");

/**
 * @desc 系统异常类
 * @param {String} msg 错误信息
 */
var SystemError = function (msg) {
  this.code = this.code || "S0000";
  msg = msg || "System Error";
  SystemError.super_.call(this, msg, this.constructor);
};

util.inherits(SystemError, errors.AbstractError);

/**
 * @desc 配置文件设置错误
 * @param {String} msg 错误信息
 */
var ConfigError = function (msg) {

  this.code = "S0001";
  msg = msg || "Config Error";
  ConfigError.super_.call(this, msg, this.constructor);
};
util.inherits(ConfigError, SystemError);

/**
 * exports
 */
exports.SystemError    = SystemError;
exports.ConfigError    = ConfigError;