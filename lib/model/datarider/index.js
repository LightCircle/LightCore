/**
 * @file 封装DataStore
 *  通过board里定义Class和Action，创建DataStore访问对象
 *  如 user.get() user.list() 等
 * @author r2space@gmail.com
 * @version 1.0.0
 * @ignore
 */

"use strict";

var _         = require("underscore")
  , async     = require("async")
  , helper    = require("../../helper")
  , error     = require("../../error")
  , cache     = require("../../cache/cache")
  , Ctrl      = require("../../mongo/controller")
  , log       = require("../../log")
  , config    = require("../../configuration")
  , MySQL     = require("../../mysql/controller")
  , constant  = require("../constant")
  , data      = require("./data")
  ;


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
   * 重新加载设定内容(当通过画面修改内容时, 需要用这个reset方法反应这些修改到内存中)
   * @params {String} type
   */
  reset: function (type) {

    if (type == constant.MODULES_NAME_BOARD) {
      this.board = cache.get(constant.MODULES_NAME_BOARD);
      this.bind();
    }

    if (type == constant.MODULES_NAME_STRUCTURE) {
      this.structure = cache.get(constant.MODULES_NAME_STRUCTURE);
    }

    if (type == constant.MODULES_NAME_ROUTE) {
      this.route = cache.get(constant.MODULES_NAME_ROUTE);
    }
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

      // MySQL解析
      if (config.mysql && config.mysql.enable && item.kind == 3) {
        self[item.class][item.action] = function (handler, params, callback) {

          // params参数未指定
          if (_.isFunction(params)) {
            callback = params;
            params = undefined;
          }

          // 添加参数
          handler = appendParams(handler, params, item);

          handler.addParams(constant.PARAMS_API, item);
          var mysql = new MySQL(handler)
            , func = mysql[constant.BOARD_TYPE[item.type]];

          if (func) {
            return func.call(mysql, callback);
          }

          log.debug("no method. " + item.class + "#" + item.action);
          callback(new error.class.MethodNotFoundError());
        };
        return;
      }

      // Mongo解析
      self[item.class][item.action] = function (handler, params, callback) {

        var original = {domain: handler.domain, code: handler.code};

        // params参数未指定
        if (_.isFunction(params)) {
          callback = params;
          params = undefined;
        }

        // 添加参数
        handler = appendParams(handler, params, item);

        var func = data[constant.BOARD_TYPE[item.type]];
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

        log.debug("no method. " + item.class + "#" + item.action);
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
