/**
 * @file 系统设定相关
 * @author r2space@gmail.com
 * @module light.model.system
 * @version 1.0.0
 */

"use strict";

var fs      = require("fs")
  , path    = require("path")
  , _       = require("underscore")
  , async   = require("async")
  , config  = require("../configuration")
  , cache   = require("../cache")
  , signal  = require("../signal")
  , log     = require("../log")
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
    lb: "",
    ap1: "",
    ap2: "",
    db: ""
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

  var functions, access,accessMenuList,accessTargetItemList,accessTargetAuthList
    , authority  = handler.req.session.user.authority || []
    , domain = handler.req.session.domain
    , kind = handler.params.kind;

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
      var acc = _.find(handler.req.session.access,function (item) {return Object.keys(item)[0] === domain});
      if (acc) {
        access = acc[domain];
        accessMenuList = _.filter(access.items, function (item) {return item.type === "function";});
      }
      done();
    }

  ], function (err) {
    var menus = _.filter(functions.items, function (item) {
      var url = item.url;
      // 包含该菜单的access列表
      accessTargetItemList = _.filter(accessMenuList, function (item) {
        return _.contains(item.resource, url);
      });
      accessTargetAuthList = _.union(_.pluck(accessTargetItemList, "authes"))[0];
      return _.isEmpty(accessTargetItemList) || !_.isEmpty(_.intersection(authority, accessTargetAuthList));
    });

    callback(err, {items: menus});
  });
};

/**
 * 获取用户代码一览
 */
exports.code = function () {
  return {
    user: {
      controller: resolve(process.cwd() + "/controllers"),
      view: resolve(process.cwd() + "/views", null, ".html"),
      unit: resolve(process.cwd() + "/test")
    },

    system: {
      source: _.union(
        resolve(__core + "/lib")
      ),
      unit: _.union(
        resolve(__core + "/test")
      )
    }
  }
};


/**
 * 获取文件一览，包括子文件夹
 * @param folder
 * @param result
 * @param filter 文件类型， 默认 .js
 * @returns {*|Array}
 */
function resolve(folder, result, filter) {

  result = result || [];
  filter = filter || ".js";

  var files = fs.readdirSync(folder);
  _.each(files, function (file) {

    var full = path.resolve(folder, file), stats = fs.statSync(full);

    // 递归文件夹
    if (stats.isDirectory()) {
      resolve(full, result, filter);
    } else {
      if (path.extname(file) == filter) {
        result.push({file: full});
      }
    }
  });

  return result;
}
