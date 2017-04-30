/**
 * @file 存取用户信息的controller
 * @author r2space@gmail.com
 * @module light.model.user
 * @version 1.0.0
 */


"use strict";

var _         = require("underscore")
  , errors    = require("../error")
  , log       = require("../log")
  , auth      = require("../security")
  , rider     = require("./datarider")
  , constant  = require("./constant")
  ;


/**
 *
 * deprecated
 * 请使用 security 的simpleLogin
 *
 * @param handler
 * @param callback
 */
exports.verify = function(handler, callback) {

  var condition = { condition: {id: handler.params.name, valid: constant.VALID} };
  rider.user.get(handler.copy(condition), function (err, result) {
    if (err) {
      log.debug("Unable to retrieve the user.");
      return callback(new errors.db.Find());
    }

    // 用户不存在
    if (!result) {
      log.debug("User does not exist.");
      return callback(new errors.db.NotExist());
    }

    // 用户密码不正确
    if (result.password !== auth.sha256(handler.params.password)) {
      log.debug("The user password is not correct.");
      return callback(new errors.db.NotCorrect());
    }

    // 擦除密码
    delete result.password;

    return callback(err, result);
  });
};

/**
 *
 * deprecated
 *
 * @desc 检查用户名和密码是否匹配
 * @param {Object} handler 上下文对象
 *        handler.params :
 *          name
 *          password
 *          code
 * @param {Function} callback 回调函数，返回跟用户名和密码匹配的用户
 */
exports.isPasswordRight = function (handler, callback) {

  handler.addParams("condition", { id: handler.params.name, valid: constant.VALID });
  rider.user.get(handler, function (err, result) {
    if (err) {
      return callback(new errors.db.Find());
    }

    // 用户不存在
    if (!result) {
      return callback(new errors.db.NotExist());
    }

    // 用户密码不正确
    if (result.password !== auth.sha256(handler.params.password)) {
      return callback(new errors.db.NotCorrect());
    }
    // 把ID变成字符串
    result._id = result._id.toHexString();

    delete result.password; // 擦除密码
    return callback(err, result);
  });
};

// TODO: 统一缓存处理
var cachedRoles = {};
exports.roleUsers = function(handler, callback) {

  var roles = handler.params.roles;

  // 先从缓存里取值
  if (cachedRoles[roles]) {
    callback(undefined, cachedRoles[roles]);
    return;
  }

  // 从数据库取值
  handler.addParams("condition", { roles: { $all: roles }, valid: 1 });
  handler.addParams("select", "_id");
  exports.getList(handler, function(err, result) {

    var users = [];
    _.each(result.items, function(item) {
      users.push(item._id);
    });

    cachedRoles[roles] = users;
    callback(err, users);
  });
};
