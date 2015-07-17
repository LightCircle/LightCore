/**
 * @file 参数异常类。
 * @module light.framework.error.parameter
 * @author qiou_kay@163.com
 * @version 1.0.0
 */

"use strict";

var util   = require("util")
  , errors = require("./common");

/**
 * @desc 参数异常类
 * @param {String} msg 错误信息
 */
var ParamError = function (msg) {
  this.code = this.code || "P0000";
  msg = msg || "Param Error";
  ParamError.super_.call(this, msg, this.constructor);
};

util.inherits(ParamError, errors.AbstractError);

/**
 * @desc 密码异常类
 * @param {String} msg 错误信息
 */
var PasswordError = function (msg) {
  this.code = this.code || "P0001";
  msg = msg || "Password Error";
  PasswordError.super_.call(this, msg, this.constructor);
};

util.inherits(PasswordError, errors.AbstractError);

/**
 * @desc 类型异常类
 * @param {String} msg 错误信息
 */
var TypeError = function (msg) {
  this.code = this.code || "P0002";
  msg = msg || "Type Error";
  TypeError.super_.call(this, msg, this.constructor);
};

util.inherits(TypeError, errors.AbstractError);

/**
 * @desc 参数为空异常类
 * @param {String} msg 错误信息
 */
var EmptyError = function (msg) {
  this.code = this.code || "P0003";
  msg = msg || "Empty Error";
  EmptyError.super_.call(this, msg, this.constructor);
};

util.inherits(EmptyError, errors.AbstractError);

/**
 * exports
 */
exports.ParamError    = ParamError;
exports.PasswordError = PasswordError;
exports.TypeError     = TypeError;
exports.EmptyError    = EmptyError;
