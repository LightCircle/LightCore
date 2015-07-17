/**
 * @file 异常类。
 * @module light.framework.error.common
 * @author qiou_kay@163.com
 * @version 1.0.0
 */


"use strict";

var util   = require("util");

/**
 * @desc 抽象的错误类
 * @param msg 错误信息
 * @param constr 自定义error方法
 */
var AbstractError = function (msg, constr) {

  // If defined, pass the constr property to V8's
  // captureStackTrace to clean up the output
  Error.captureStackTrace(this, constr || this);

  // If defined, store a custom error message
  this.code = this.code || "E0001";
  this.message = msg || "Error";
};

// Extend our AbstractError from Error
util.inherits(AbstractError, Error);

/**
 * exports
 */
exports.AbstractError = AbstractError;
