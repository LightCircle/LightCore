/**
 * @file error
 * @module light.framework.error.class
 * @author qiou_kay@163.com
 * @version 1.0.0
 */
 
"use strict";

var util   = require("util")
  , errors = require("./common");

/**
 * @desc 类没有找到异常类
 * @param {String} msg 错误信息
 */
var ClassNotFoundError = function (msg) {
  this.code = this.code || "C0000";
  msg = msg || "Class Not Found Error";
  ClassNotFoundError.super_.call(this, msg, this.constructor);
};

util.inherits(ClassNotFoundError, errors.AbstractError);

/**
 * @desc 方法没有找到异常类
 * @param {String} msg 错误信息
 */
var MethodNotFoundError = function (msg) {
  this.code = this.code || "C0001";
  msg = msg || "Method Not Found Error";
  MethodNotFoundError.super_.call(this, msg, this.constructor);
};

util.inherits(MethodNotFoundError, errors.AbstractError);

exports.ClassNotFoundError    = ClassNotFoundError;
exports.MethodNotFoundError   = MethodNotFoundError;