/**
 * @file HTTP异常类。以HTTP Status Codes为基础定义类。<br>
 *  HTTP Status Codes:<br>
 *  200 OK<br>
 *  304 Not Modified<br>
 *  400 Bad Request（已定义）<br>
 *  401 Unauthorized（已定义）<br>
 *  402 Payment Required<br>
 *  403 Forbidden（已定义）<br>
 *  404 Not Found（已定义）<br>
 *  405 Method Not Allowed<br>
 *  406 Not Acceptable<br>
 *  407 Proxy authentication required<br>
 *  408 Request Timeout<br>
 *  409 Conflict<br>
 *  410 Gone<br>
 *  411 Length Required<br>
 *  412 Precondition Failed<br>
 *  413 Request Entity Too Large<br>
 *  414 Request-URI Too Large<br>
 *  415 Unsupported Media Type<br>
 *  420 Enhance Your Calm<br>
 *  500 Internal Server Error（已定义）<br>
 *  501 Not Implemented<br>
 *  502 Bad Gateway<br>
 *  503 Service Unavailable<br>
 *  504 Gateway timeout<br>
 *  505 HTTP Version not supported<br>
 * @module light.core.error.http
 * @author qiou_kay@163.com
 * @version 1.0.0
 */



"use strict";

var util   = require("util")
  , errors = require("./common");

/**
 * @desc HTTP Error
 * @param {String} msg 错误信息
 */
var HttpError = function (msg) {

  this.code = this.code || -1;
  msg = msg || "HTTP Error";
  HttpError.super_.call(this, msg, this.constructor);
};
util.inherits(HttpError, errors.AbstractError);

/**
 * @desc BadRequestError:由于客户端的请求存在问题，导致后台无法处理而产生的错误。
 * @param {String} msg 错误信息
 */
var BadRequestError = function (msg) {

  this.code = 400;
  msg = msg || "Bad Request";
  BadRequestError.super_.call(this, msg, this.constructor);
};
util.inherits(BadRequestError, HttpError);

/**
 * @desc UnauthorizedError:没有验证。
 * @param {String} msg 错误信息
 */
var UnauthorizedError = function (msg) {

  this.code = 401;
  msg = msg || "Unauthorized";
  UnauthorizedError.super_.call(this, msg, this.constructor);
};
util.inherits(UnauthorizedError, HttpError);

/**
 * @desc ForbiddenError:
 * @param {String} msg 错误信息
 */
var ForbiddenError = function (msg) {

  this.code = 403;
  msg = msg || "Forbidden";
  ForbiddenError.super_.call(this, msg, this.constructor);
};
util.inherits(ForbiddenError, HttpError);

/**
 * @desc NotFoundError:请求的资源不存在。
 * @param {String} msg 错误信息
 */
var NotFoundError = function (msg) {

  this.code = 404;
  msg = msg || "Not Found";
  NotFoundError.super_.call(this, msg, this.constructor);
};
util.inherits(NotFoundError, HttpError);

/**
 * @desc InternalServerError:后台的内部错误。需要管理员的协助才能够解决。
 * @param {String} msg 错误信息
 */
var InternalServerError = function (msg) {

  this.code = 500;
  msg = msg || "Internal Server Error";
  InternalServerError.super_.call(this, msg, this.constructor);
};
util.inherits(InternalServerError, HttpError);

/**
 * exports
 */
module.exports = {
    BadRequest:     BadRequestError
  , Unauthorized:   UnauthorizedError
  , NotFound:       NotFoundError
  , InternalServer: InternalServerError
  , Forbidden:      ForbiddenError
  };
