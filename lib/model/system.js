/**
 * @file 系统设定相关
 * @author r2space@gmail.com
 * @module light.model.system
 * @version 1.0.0
 */

"use strict";

var fs       = require("fs")
  , path     = require("path")
  , _        = require("underscore")
  , async    = require("async")
  , config   = require("../configuration")
  , cache    = require("../cache")
  , signal   = require("../signal")
  , log      = require("../log")
  , constant = require("../constant")
  , helper   = require("../helper")
  ;


/**
 * 应用版本更新确认
 *  API: /api/system/version
 * @param handler
 * @param callback
 */
exports.version = function (handler, callback) {
  callback(undefined, {version: config.app.version});
};


/**
 * 应用心跳确认
 *  API: /api/system/health
 * @param handler
 * @param callback
 */
exports.health = function (handler, callback) {
  callback(undefined, {
    codeVersion     : function () {
      try {
        return fs.readFileSync(process.cwd() + '/.git/refs/heads/master', 'utf8').trim();
      } catch (error) {
        return "";
      }
    }(),
    lightCoreVersion: function () {
      try {
        return fs.readFileSync(process.cwd() + '/node_modules/light-core/.git/refs/heads/master', 'utf8').trim();
      } catch (error) {
        return "";
      }
    }(),
    ENV             : _.extend({}, process.env, {LIGHTDB_PASS: '******'})
  });
};


/**
 * 接受API信号，与Framework的signal搭配使用
 * 负责通知已经注册的监听器，处理信号
 *  API: /api/system/signal
 * @param handler
 * @param callback
 */
exports.signal = function (handler, callback) {
  signal.receive(handler, callback);
};


/**
 * 获取用户代码一览
 */
exports.code = function () {
  return {
    user: {
      controllers : helper.tree(process.cwd() + "/controllers"),
      views       : helper.tree(process.cwd() + "/views"),
      test        : helper.tree(process.cwd() + "/test"),
      stylesheets : helper.tree(process.cwd() + "/public/static/stylesheets"),
      javascripts : helper.tree(process.cwd() + "/public/static/javascripts"),
      images      : helper.tree(process.cwd() + "/public/static/images")
    },

    system: {
      source: _.union(
        helper.tree(__core + "/lib")
      ),
      unit  : _.union(
        helper.tree(__core + "/test")
      )
    }
  }
};
