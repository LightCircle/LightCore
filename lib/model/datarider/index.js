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
  , cache     = require("../../cache")
  , Ctrl      = require("../../mongo/controller")
  , log       = require("../../log")
  , config    = require("../../configuration")
  , MySQL     = require("../../mysql/controller")
  , constant  = require("../constant")      // 准备废弃
  , CONST     = require("../../constant")
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

    this.structure = cache.get(CONST.SYSTEM_DB_STRUCTURE);
    this.board = cache.get(CONST.SYSTEM_DB_BOARD);
    this.route = cache.get(CONST.SYSTEM_DB_ROUTE);
    this.initialized = true;
    this.bind();
  },

  /**
   * 重新加载设定内容(当通过画面修改内容时, 需要用这个reset方法反应这些修改到内存中)
   * @params {String} type
   */
  reset: function (type) {

    if (type === CONST.SYSTEM_DB_BOARD) {
      this.board = cache.get(CONST.SYSTEM_DB_BOARD);
      this.bind();
    }

    if (type === CONST.SYSTEM_DB_STRUCTURE) {
      this.structure = cache.get(CONST.SYSTEM_DB_STRUCTURE);
    }

    if (type === CONST.SYSTEM_DB_ROUTE) {
      this.route = cache.get(CONST.SYSTEM_DB_ROUTE);
    }
  },

  /**
   * 根据board定义，创建访问类
   * @returns {*}
   */
  bind: function () {

    const METHOD = ['GET', 'POST', 'PUT', 'DELETE', 'GET', 'GET', 'GET', 'GET'];

    // 遍历所有board，以class名注册类，并添加board方法
    this.board.forEach(item => {
      this[item.class] = this[item.class] || {};

      log.debug(`>>>> ${item.api} ${item.class} ${item.action} ${METHOD[item.type]}`);

      // MySQL解析
      if (config.mysql && config.mysql.enable) {
        this[item.class][item.action] = (handler, params, callback) => {

          // params参数未指定
          if (_.isFunction(params)) {
            callback = params;
            params = undefined;
          }

          // 添加参数
          handler = appendParams(handler, params, item);

          const mysql = new MySQL(handler)
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
      this[item.class][item.action] = (handler, params, callback) => {

        const original = {domain: handler.domain, code: handler.code};

        // params参数未指定
        if (_.isFunction(params)) {
          callback = params;
          params = undefined;
        }

        // 添加参数
        handler = appendParams(handler, params, item);

        const func = data[constant.BOARD_TYPE[item.type]];
        if (func) {
          return func.call(this, handler, (err, result) => {

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
  },

  increment: function (handler, callback) {
    new Ctrl(handler, "counter", {}).increment(callback);
  },

  runCommand: function (handler, callback) {
    // TODO: 需要严格限定可以使用该方法的场景 - 现在使用的地方是创建APP时创建数据库用
    handler.params.user = config.db.root.user;
    handler.params.pass = config.db.root.pass;
    new Ctrl(handler).command(callback);
  },

  dropSession: function (handler, callback) {
    new Ctrl(handler, "session").dropSession(callback);
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
