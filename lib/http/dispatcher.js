/**
 * @file 请求分发器
 * @module light.lib.dispatcher
 * @author r2space@gmail.com
 * @version 1.0.0
 */

'use strict';

const path   = require('path')
  , helper   = require('../helper')
  , config   = require('../configuration')
  , log      = require('../log')
  , rider    = require('../model/datarider')
  , constant = require('../model/constant')
  , context  = require('./context')
  , response = require('./response')
;


/**
 * @desc 解析请求URL，分派处理给controller<br>
 *   - API接口处理<br>
 *   - Route画面路径
 * @param {Object} app Express实例
 */
exports.dispatch = function (app) {

  // 分派datarider
  app.all('/api/*', injectApi);

  // 分派网页请求
  app.all('/*', injectRoute);
};


function injectApi(req, res) {

  const handler = new context().bind(req, res);

  // Find board by url and method
  const item = find(rider.board, handler.req.path), board = item.route, params = item.params;
  if (!board) {

    log.error(`Did not find the api : ${handler.req.path}`);
    return response.sendError(handler.res, {code: 404, message: 'can not dispatch.'});
  }

  // Expand URL parameters
  handler.extendParams(params);

  log.info(`Route api   : ${req.method} ${board.api}, action: ${board.class}/${board.action}, uid: ${handler.uid}`);

  const func = injection('api');
  if (func) {
    return func.call(this, handler, () => {
      bindApi(handler, board);
    });
  }

  bindApi(handler, board);
}


function injectRoute(req, res) {

  const handler = new context().bind(req, res);

  // Find route by url and method
  const item = find(rider.route, handler.req.path), route = item.route, params = item.params;
  if (!route) {

    log.error(`Did not find the route : ${handler.req.path}`);
    return response.sendError(handler.res, {code: 404, message: 'can not dispatch.'});
  }

  // Expand URL parameters
  handler.extendParams(params);

  log.info(`Route html  : ${req.method} ${route.url}, template: ${route.template}, uid: ${handler.uid}`);

  const func = injection('route');
  if (func) {
    return func.call(this, handler, () => {
      bindRoute(handler, route);
    });
  }

  bindRoute(handler, route);
}


/**
 * @desc API接口匹配
 * @param handler
 * @param board
 * @returns {Object} 返回处理后数据
 */
function bindApi(handler, board) {

  // 调用用户定义的controller
  let func = controller(board.path, board.class, board.action);
  if (func) {
    return func.call(this, handler, (err, result) => {

      if (err) {
        log.error(err, handler.uid);
      }
      response.send(handler.res, err, result);
    });
  }

  // 调用系统定义的model
  func = system(board.path, board.class, board.action);
  if (func) {
    return func.call(this, handler, (err, result) => {

      if (err) {
        log.error(err, handler.uid);
      }
      response.send(handler.res, err, result);
    });
  }

  // 调用datarider
  const ctrl = rider[board.class];
  if (ctrl) {
    func = ctrl[board.action];
    if (func) {
      return func.call(this, handler, (err, result) => {

        if (err) {
          log.error(err, handler.uid);
        }
        response.send(handler.res, err, result);
      });
    }
  }

  // 指定的method没有找到
  return response.sendError(handler.res, {code: 404, message: 'can not dispatch.'});
}


/**
 * @desc 画面路径匹配
 * @param handler
 * @param route
 * @returns {Object} 返回处理后HTML
 */
function bindRoute(handler, route) {

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
  if (route.class) {
    const inject = helper.resolve(constant.PATH_CONTROLLER + '/' + route.class);
    if (inject && route.action) {
      const func = inject[route.action];
      if (func) {

        log.debug(`inject     : ${route.class}#${route.action}`);
        return func.call(this, handler, (err, result) => {
          if (err) {
            log.error(err, handler.uid);
            return handler.req.next(err);
          }

          parameter.data = result;

          // 使用ejs模板渲染画面
          render(handler, route, parameter);
        });
      }
    }
  }

  // 使用ejs模板渲染画面
  render(handler, route, parameter);
}


/**
 * @desc 调用用户定义的controller
 * @ignore
 * @param folder
 * @param clazz
 * @param action
 * @returns {*}
 */
function controller(folder = '', clazz, action) {

  const inject = helper.resolve(constant.PATH_CONTROLLER + folder + '/' + clazz);

  if (inject && inject[action]) {
    return inject[action];
  }

  return undefined;
}


function injection(action) {

  const inject = helper.resolve(`${constant.PATH_CONTROLLER}/injection`);

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

  const inject = helper.resolve(folder + '/' + clazz, path.join(__dirname, '../model'));

  if (inject && inject[action]) {
    return inject[action];
  }

  return undefined;
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

  handler.res.render(define.template, Object.assign(parameter, define.parameter), (err, str) => {
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

  const result = {};

  // 查找URL匹配的项目
  result.route = items.find(item => {

    let isMatched = true
      , definePath = (item.url || item.api).split('/')  // 数据库定义URL
      , requestPath = url.split('/')                    // 请求URL
      , params = {};                                    // 保存路径参数

    if (definePath.length !== requestPath.length) {
      return false;
    }

    definePath.forEach((path, index) => {

      // 如果是 : 开头，则认为是URL路径参数
      if (path.charAt(0) === ':') {
        params[path.split(':')[1]] = requestPath[index];
      } else {

        // 比较所有的路径都匹配
        if (isMatched) {
          isMatched = (path === requestPath[index]);
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
