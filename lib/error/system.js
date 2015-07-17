/**
 * @file 系统异常类。
 * @module light.framework.error.system
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
var SyetemError = function (msg) {
  this.code = this.code || "S0000";
  msg = msg || "System Error";
  SyetemError.super_.call(this, msg, this.constructor);
};

util.inherits(SyetemError, errors.AbstractError);

/**
 * @desc 配置文件设置错误
 * @param {String} msg 错误信息
 */
var ConfigError = function (msg) {

  this.code = "S0001";
  msg = msg || "Config Error";
  ConfigError.super_.call(this, msg, this.constructor);
};
util.inherits(ConfigError, SyetemError);

/**
 * exports
 */
exports.SyetemError    = SyetemError;
exports.ConfigError    = ConfigError;