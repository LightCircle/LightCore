/**
 * @file json异常类。
 * @module light.core.error.json
 * @author qiou_kay@163.com
 * @version 1.0.0
 */


"use strict";

var util   = require("util")
  , errors = require("./common");

/**
 * @desc 转换异常类
 * @param {String} msg 错误信息
 */
var ParseError = function (msg) {
  this.code = this.code || "J0000";
  msg = msg || "Parse Error";
  ParseError.super_.call(this, msg, this.constructor);
};

util.inherits(ParseError, errors.AbstractError);


exports.ParseError    = ParseError;