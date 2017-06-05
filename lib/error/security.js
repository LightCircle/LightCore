/**
 * @file 安全异常类。
 * @module light.core.error.security
 * @author qiou_kay@163.com
 * @version 1.0.0
 */


"use strict";

var util   = require("util")
  , errors = require("./common");

/**
 * @desc 没有权限异常类
 * @param {String} msg 错误信息
 */
var NoPermissionError = function (msg) {
  this.code = this.code || "SE0000";
  msg = msg || "No Permission Error";
  NoPermissionError.super_.call(this, msg, this.constructor);
};

util.inherits(NoPermissionError, errors.AbstractError);


/**
 * 数据冲突
 * @param msg
 * @constructor
 */
var ConflictError = function (msg) {
  this.code = this.code || "SE0001";
  msg = msg || "Conflict Error";
  ConflictError.super_.call(this, msg, this.constructor);
};

util.inherits(ConflictError, errors.AbstractError);

exports.NoPermissionError    = NoPermissionError;
exports.ConflictError        = ConflictError;