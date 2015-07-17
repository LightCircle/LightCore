/**
 * @file file异常类。
 * @module light.framework.error.file
 * @author qiou_kay@163.com
 * @version 1.0.0
 */



"use strict";

var util   = require("util")
  , errors = require("./common");

/**
 * @desc 文件没有找到异常类
 * @param {String} msg 错误信息
 */
var FileNotFoundError = function (msg) {
  this.code = this.code || "F0000";
  msg = msg || "File Not Found Error";
  FileNotFoundError.super_.call(this, msg, this.constructor);
};

util.inherits(FileNotFoundError, errors.AbstractError);


exports.FileNotFoundError    = FileNotFoundError;