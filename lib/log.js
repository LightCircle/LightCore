/**
 * @file 输出Log<br>
 *  通过node的console功能打印log，如果需要将日志输出到文件里，<br>
 *  需要重定向node的执行结果<br>
 *
 *  日志的输出级别可以用环境变量的 LIGHTLOG 来设定<br>
 *   DEBUG : 3<br>
 *   WARN  : 2<br>
 *   INFO  : 1<br>
 *   ERROR : 0<br>
 *
 * @author r2space@gmail.com
 * @module light.framework.log
 * @version 1.0.0
 */

"use strict";

var util     = require("util")
  , moment   = require("moment")
  , _        = require("underscore")
  , constant = require("./constant")
  , helper   = require("./helper")
  ;

/**
 * @desc Stack info.
 * @param {Function} self this function.
 * @returns {Object} current method stack.
 * @ignore
 */
function stack(self) {

  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function (_, stack) {
    return stack;
  };

  var err = new Error();
  Error.captureStackTrace(err, self);

  var result = err.stack;
  Error.prepareStackTrace = orig;

  return result;
}

/**
 * @desc LineNo,
 *  Defines the number of lines of parent source code.
 * @returns {String} line number.
 * @ignore
 */
function lineNo() {
  return stack(stack)[3].getLineNumber();
}

/**
 * @desc FileName,
 *  Defines the name of the parent file.
 * @returns {String} file name.
 * @ignore
 */
function fileName() {
  return stack(stack)[3].getFileName();
}

/**
 * @desc Function name
 * @returns {String} function name
 * @ignore
 */
function functionName() {
  return stack(stack)[3].getFunctionName();
}

/**
 * @desc生成json格式的log对象
 * @param {String} logtype log的类别
 * @param {String} loglevel log的级别
 * @param {String} content 输出的log详细
 * @param {String} userid 操作者
 * @returns {object} log对象
 * @ignore
 */
function toJson(logtype, loglevel, content, userid) {

  return {
    sec       : new Date().getTime()
    , type    : logtype
    , level   : loglevel
    , message : _.isString(content) ? content : JSON.stringify(content)
    , user    : userid ? userid : "-"
    , host    : helper.ip()
    , file    : fileName()
    , line    : lineNo()
    , function: functionName()
  };
}

/**
 * @desc debug log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.debug = function (message, user) {
  log(toJson(constant.LOG_TYPE_APPLICATION, constant.LOG_LEVEL_DEBUG, message, user));
};

/**
 * @desc info log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.info = function (message, user) {
  log(toJson(constant.LOG_TYPE_APPLICATION, constant.LOG_LEVEL_INFO, message, user));
};

/**
 * @desc warning log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.warn = function (message, user) {
  log(toJson(constant.LOG_TYPE_APPLICATION, constant.LOG_LEVEL_WARN, message, user));
};

/**
 * @desc error log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.error = function (message, user) {
  log(toJson(constant.LOG_TYPE_APPLICATION, constant.LOG_LEVEL_ERROR, message, user));
};

/**
 * @desc audit log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.audit = function (message, user) {
  log(toJson(constant.LOG_TYPE_AUDIT, constant.LOG_LEVEL_INFO, message, user));
};

/**
 * @desc operation log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.operation = function (message, user) {
  log(toJson(constant.LOG_TYPE_OPERATION, constant.LOG_LEVEL_INFO, message, user));
};

/**
 * @desc 对log对象进行格式化
 * @param {String} body 消息
 * @returns 格式化之后的消息字符串
 * @ignore
 */
function format(body) {

  var datetime = moment(body.sec).format("YYYY-MM-DD HH:mm:ss.SSS")
    , level    = ["ERROR", "INFO", "WARN", "DEBUG"][body.level]
    , code     = util.format("%s:%s", body.file, body.line);
  return util.format("[%s] [A] [%s] %s - - %s - %s", datetime, level, code, body.user, body.message);
}

/**
 * @desc 输出日志
 * @param body
 * @ignore
 */
function log(body) {
  var level = _.isUndefined(process.env.LIGHTLOG) ? constant.LOG_LEVEL_DEBUG : parseInt(process.env.LIGHTLOG);
  if (body.level > level) {
    return;
  }
  //console.log.call(this, format(body));
  console[["error", "info", "warn", "log"][body.level]].call(this, format(body));
}

