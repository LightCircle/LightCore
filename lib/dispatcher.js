/**
 * @file 请求分发器
 * @module light.lib.dispatcher
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var _         = require("underscore")
  , path      = require("path")
  , helper    = require("./helper")
  , context   = require("./http/context")
  , response  = require("./http/response")
  , config    = require("./configuration")
  , log       = require("./log")
  , rider     = require("./model/datarider")
  , constant  = require("./model/constant")
  ;


/**
 * @desc 解析请求URL，分派处理给controller<br>
 *   - API接口处理<br>
 *   - Route画面路径
 * @param {Object} app Express实例
 */
exports.dispatch = function (app) {

  // 分派datarider
  app.all("/api/*", function (req, res) {
    bindApi(new context().bind(req, res));
  });

  // 分派网页请求
  app.all("/*", function (req, res) {
    bindRoute(new context().bind(req, res));
  });
};


/**
 * @desc API接口匹配
 * @param {Object} handler 上下文对象
 * @returns {Object} 返回处理后数据
 */
function bindApi(handler) {

  var item = find(rider.board, handler.req.path), define = item.route, params = item.params;
  if (!define) {
    return response.sendError(handler.res, {code: 404, message: "can not dispatch."});
  }

  // 扩展URL参数
  handler.extendParams(params);

  // 调用用户定义的controller
  var func = controller(define.path, define.class, define.action);
  if (func) {
    return func.call(this, handler, function (err, result) {

      if (err) {
        log.error(err, handler.uid);
      }
      response.send(handler.res, err, result);
    });
  }

  // 调用系统定义的model
  func = system(define.path, define.class, define.action);
  if (func) {
    return func.call(this, handler, function (err, result) {

      if (err) {
        log.error(err, handler.uid);
      }
      response.send(handler.res, err, result);
    });
  }

  // 调用datarider
  var ctrl = rider[define.class];
  if (ctrl) {
    func = ctrl[define.action];
    if (func) {
      return func.call(this, handler, function (err, result) {

        if (err) {
          log.error(err, handler.uid);
        }
        response.send(handler.res, err, result);
      });
    }
  }

  // 指定的method没有找到
  return response.sendError(handler.res, {code: 404, message: "can not dispatch."});
}


/**
 * @desc 调用用户定义的controller
 * @ignore
 * @param folder
 * @param clazz
 * @param action
 * @returns {*}
 */
function controller(folder, clazz, action) {

  var inject = helper.resolve(constant.PATH_CONTROLLER + folder + "/" + clazz);
  if (inject && inject[action]) {
    return inject[action];
  }

  return undefined;
}


/**
 * @desc 调用LightModel定义的model
 * @ignore
 * @param folder
 * @param clazz
 * @param action
 * @returns {*}
 */
function system(folder, clazz, action) {

  var inject = helper.resolve(folder + "/" + clazz, path.join(__dirname, "model"));

  if (inject && inject[action]) {
    return inject[action];
  }

  return undefined;
}


/**
 * @desc 画面路径匹配
 * @param {Object} handler 上下文对象
 * @returns {Object} 返回处理后HTML
 */
function bindRoute(handler) {

  // find route by url and method
  const item = find(rider.route, handler.req.path), define = item.route, params = item.params;
  if (!define) {
    return response.sendError(handler.res, {code: 404, message: "can not dispatch."});
  }

  // 扩展URL参数
  handler.extendParams(params);

  // 画面用参数
  let parameter = {
    req    : handler.req,
    res    : handler.res,
    handler: handler,
    user   : handler.user,
    info   : helper.applicationInfo(),
    env    : process.env,
    conf   : config,
    data   : {}
  };

  // 查找自定义controller方法，如果存在就顶用该方法
  if (define.class) {
    const inject = helper.resolve(constant.PATH_CONTROLLER + "/" + define.class);
    if (inject && define.action) {
      const func = inject[define.action];
      if (func) {
        return func.call(this, handler, (err, result) => {
          if (err) {
            log.error(err, handler.uid);
            return handler.req.next(err);
          }

          parameter.data = result;

          // 使用ejs模板渲染画面
          render(handler, define, parameter);
        });
      }
    }
  }

  // 使用ejs模板渲染画面
  render(handler, define, parameter);
}


/**
 * 使用ejs模板渲染画面
 * 通过正则替换静态资源的URL
 *   src="/static/xxx" > src="/static/xxx?stamp=453fc7f4"
 *   href="/static/xxx" > href="/static/xxx?stamp=453fc7f4"
 * @param handler
 * @param define
 * @param parameter
 */
function render(handler, define, parameter) {
  handler.res.render(define.template, _.extend(parameter, define.parameter), (err, str) => {
    if (err) {
      return handler.req.next(err);
    }

    str = str.replace(/(src=\"\/static\/.*)\"/g, `$1?stamp=${config.app.stamp}"`);
    str = str.replace(/(href=\"\/static\/.*)\"/g, `$1?stamp=${config.app.stamp}"`);
    handler.res.send(str);
  });
}


/**
 * @desc 从URL定义一览里，查找是否与指定URL完全匹配的项目。支持URL参数，如
 *  定义的URL
 *   /admin/board/:id
 *  请求的URL
 *   /admin/board/552347b88f6e69d6d9ca9768
 * @ignore
 * @param items
 * @param url
 * @returns {Object}
 */
function find(items, url) {

  var result = {};

  // 查找URL匹配的项目
  result.route = _.find(items, function (item) {

    var isMatched = true
      , definePath = (item.url || item.api || "").split("/")  // 数据库定义URL
      , requestPath = url.split("/")                          // 请求URL
      , params = {};                                          // 保存路径参数

    if (definePath.length != requestPath.length) {
      return false;
    }

    _.each(definePath, function (path, index) {

      // 如果是 : 开头，则认为是URL路径参数
      if (path.charAt(0) == ":") {
        params[path.split(":")[1]] = requestPath[index];
      } else {

        // 比较所有的路径都匹配
        if (isMatched) {
          isMatched = (path == requestPath[index]);
        }
      }
    });

    // 将路径参数，添加到参数列表中
    if (isMatched) {
      result.params = params;
      return true;
    }

    // 没有找到
    return false;
  });

  return result;
}
