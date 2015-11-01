/**
 * @file 租户
 * @module light.model.tenant
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var _        = require("underscore")
  , async    = require("async")
  , constant = require("../constant")
  , rider    = require("./datarider")
  ;

/**
 * @desc 添加租户
 *   添加租户时，默认创建一个管理员用户，用来操作租户信息
 * @param {Object} handler 上下文对象
 * @param {Function} callback 回调函数，返回添加的用户
 */
exports.add = function(handler ,callback) {

  var tenant = handler.params.data;

  rider.tenant.add(handler, {data: tenant}, function (err, result) {
    if (err) {
      return callback(err);
    }

    // 从缺省租户里，获取默认用户
    handler.code = constant.DEFAULT_TENANT;
    rider.user.get(handler, {condition: {type: constant.DEFAULT_USER_TYPE}}, function(err, user) {
      if (err) {
        return callback(err);
      }

      // 添加默认用户
      handler.code = result.code;
      rider.user.add(handler, {data: user}, function(err, result) {
        if (err) {
          return callback(err);
        }

        callback(err, result);
      });
    });
  });
};
