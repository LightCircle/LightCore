/**
 * @file 封装DataStore
 *  通过board里定义Class和Action，创建DataStore访问对象
 *  如 user.get() user.list() 等
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var _         = require("underscore")
  , helper    = require("../../helper")
  , error     = require("../../error")
  , cache     = require("../../cache")
  , Ctrl      = require("../../mongo/controller")
  , async     = require("async")
  , data      = require("./data")
  , constant  = require("../constant");


/**
 * 是否已经初始化
 * @type {boolean}
 * @ignore
 */
var initialized = false;

/**
 * DataStore对象
 * @type {{init: Function, reset: Function}}
 */
module.exports = {

  /**
   * 初始化，缓存board，structure，route数据
   */
  init: function () {

    if (this.initialized) {
      return;
    }

    this.structure = cache.get(constant.MODULES_NAME_STRUCTURE);
    this.board = cache.get(constant.MODULES_NAME_BOARD);
    this.route = cache.get(constant.MODULES_NAME_ROUTE);
    this.initialized = true;
    this.bind();
  },

  /**
   * 根据board定义，创建访问类
   * @returns {*}
   */
  bind: function () {

    var self = this;

    // 遍历所有board，以class名注册类，并添加board方法
    _.each(self.board, function (item) {
      self[item.class] = self[item.class] || {};
      self[item.class][item.action] = function (handler, params, callback) {

        var original = {domain: handler.domain, code: handler.code};

        // params参数未指定
        if (_.isFunction(params)) {
          callback = params;
          params = undefined;
        }

        // 添加参数
        handler = appendParams(handler, params, item);

        var func = data[item.action];
        if (func) {
          return func.call(this, handler, function (err, result) {

            // 恢复请求端的domain，code。防止在rider内部修改这些而影响用户后续操作
            handler.domain = original.domain;
            handler.code = original.code;
            callback(err, result);
          });
        }

        handler.domain = original.domain;
        handler.code = original.code;
        callback(new error.class.MethodNotFoundError());
      };
    });
  },

  // TODO: structure的名字不能和这些方法的名字重叠
  drop: function (handler, callback) {
    new Ctrl(handler).dropDatabase(callback);
  },

  aggregate: function (handler, callback) {
    new Ctrl(handler).aggregate(handler.params.aggregate, callback);
  },

  changePassword: function(handler, callback) {
    new Ctrl(handler).changePassword(callback);
  },

  createUser: function (handler, callback) {
    new Ctrl(handler).createUser(callback);
  },

  dropUser: function (handler, callback) {
    new Ctrl(handler).dropUser(callback);
  },

  addUser: function (handler, callback) {
    new Ctrl(handler).addUser(callback);
  }
};


/**
 *
 * @param handler
 * @param params
 * @param board
 * @returns {*}
 * @ignore
 */
function appendParams(handler, params, board) {

  // 如果指定params，则生成新的handler
  if (params) {
    handler = handler.copy(params);
  }

  // 获取API定义
  handler.addParams(constant.PARAMS_API, board);

  return handler;
}
