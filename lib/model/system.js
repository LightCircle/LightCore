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
  , _str     = require("underscore.string")
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
        return _str.trim(fs.readFileSync(process.cwd() + '/.git/refs/heads/master', 'utf8'));
      } catch (error) {
        return "";
      }
    }(),
    lightCoreVersion: function () {
      try {
        return _str.trim(fs.readFileSync(process.cwd() + '/node_modules/light-core/.git/refs/heads/master', 'utf8'));
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
 * 获取菜单一览
 *  API: /api/system/menu
 * @param handler
 * @param callback
 */
exports.menu = function (handler, callback) {

  var functions, access, accessTargetItemList, accessTargetAuthList
    , authority = handler.req.session.user.authority || []
    , code      = handler.req.session.code || constant.DEFAULT_TENANT
    , kind      = handler.params.kind;

  async.series([

    // function
    function (done) {
      functions = cache.get(handler.domain, "function", "list", kind);
      if (functions) {
        return done();
      }

      light.model.rider.function.list(handler, {condition: {kind: kind}}, function (err, result) {
        if (err) {
          return done(err);
        }

        functions = result;
        cache.set(handler.domain, "function", "list", kind, functions);
        done();
      });
    },

    // access
    function (done) {
      if (!handler.req.session.access) {
        return done();
      }
      access = handler.req.session.access[code];
      done();
    }

  ], function (err) {
    var menus = functions.items;
    if (access) {
      menus = _.filter(functions.items, function (item) {
        var url = item.url;
        // 包含该菜单的access列表
        var accessTargetItemList = _.filter(access, function (item) {
          if (typeof(item.resource) == "string") {
            item.resource = item.resource.split(",");
          }
          return item.type === "function" && _.contains(item.resource, url);
        });
        accessTargetAuthList = _.flatten(_.union(_.pluck(accessTargetItemList, "authes")));
        return _.isEmpty(accessTargetItemList) || !_.isEmpty(_.intersection(authority, accessTargetAuthList));
      });
    }

    callback(err, {items: menus});
  });
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
