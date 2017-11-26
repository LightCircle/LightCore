/**
 * @file 封装DataStore
 *  通过board里定义Class和Action，创建DataStore访问对象
 *  如 user.get() user.list() 等
 * @author r2space@gmail.com
 * @version 1.0.0
 * @ignore
 */

"use strict";

const _       = require("underscore")
  , async     = require("async")
  , helper    = require("../../helper")
  , error     = require("../../error")
  , cache     = require("../../cache")
  , Ctrl      = require("../../mongo/controller")
  , log       = require("../../log")
  , config    = require("../../configuration")
  , MySQL     = require("../../mysql/controller")
  , CONST     = require("../../constant")
  , data      = require("./data")
  ;


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
          if (typeof params === 'function') {
            callback = params;
            params = undefined;
          }

          // 添加参数
          handler = handler.copy(params || handler.params);
          handler.api = item;

          const mysql = new MySQL(handler)
            , func = mysql[CONST.BOARD_TYPE[item.type]];

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

        // params参数未指定
        if (typeof params === 'function') {
          callback = params;
          params = undefined;
        }

        // 添加参数
        handler = handler.copy(params || handler.params);
        handler.api = item;

        const func = data[CONST.BOARD_TYPE[item.type]];
        if (func) {
          return func.call(this, handler, callback);
        }

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
    // TODO: 允许第二个参数传递condition
    handler.params.condition = handler.params.condition || {};
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
