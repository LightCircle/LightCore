/**
 * @file 应用程序过滤器，在处理响应之前做一些处理（如校验是否登录，设定csrftoken等）
 * @module light.core.http.middleware
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var _              = require("underscore")
  , csrf           = require("csurf")()
  , multiparty     = require("multiparty")
  , cookie         = require("cookie")
  , config         = require("../configuration")
  , validator      = require("../validator")
  , errors         = require("../error")
  , i18n           = require("../i18n")
  , log            = require("../log")
  , helper         = require("../helper")
  , cache          = require("../cache")
  , constant       = require("../constant")
  , context        = require("./context")
  , response       = require("./response")
  , acceptLanguage = require('accept-language')
  , rider          = require("../model/datarider");

/**
 * 判断是否是Multipart上传
 * @param req
 * @returns {boolean}
 */
function isMultipart(req) {

  if (!req || !req.headers) {
    return false;
  }

  var contentType = req.headers["content-type"];
  if (!contentType) {
    return false;
  }

  return /^multipart\/(?:form-data|related)(?:;|$)/i.exec(contentType);
}

function getCookie(req, key) {
  req.headers = req.headers || {};
  return cookie.parse(req.headers.cookie || "")[key];
}

/**
 * @desc 注册ejs用全局国际化函数
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.lang = function (req, res, next) {

  // cookie的语言优先
  var language = getCookie(req, "light.lang");

  // cookie中没有，使用header中的值
  if (!language) {

    var clientLangs = req.headers["accept-language"];
    if (clientLangs) {
      var langs = acceptLanguage.parse(clientLangs);
      _.each(langs, function (item) {
        if (!language && _.contains(['zh', 'ja', 'en'], item.language)) {
          language = item.language;
          res.cookie("light.lang", language);
        }
      });
    }
  }

  // 使用用户信息中的lang
  if (!language && req.session.user) {
    language = req.session.user.lang;
    res.cookie("light.lang", language);
  }

  // 使用缺省值
  i18n.lang = language || "zh";

  // 向画面设定词条（javascript用）
  res.locals.catalog = i18n.catalog;
  res.locals.env = process.env;
  // 设定全局国际化函数（global.i在后台使用，res.locals.i在前台使用）
  global.i = res.locals.i = function (key) {
    return i18n.i.call(i18n, key);
  };

  next();
};

/**
 * @desc Authenticate:<br>
 *  Check the approval status.<br>
 *  The configure of app.js, the handle has been registered.
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.authenticate = function (req, res, next) {

  var safety = false;

  // URL是否与不需要认证的路径匹配（配置文件中定义）

  _.each(config.ignore.auth, function (path) {
    var regexPath = new RegExp(path, "i");
    safety = safety || !_.isNull(req.url.match(regexPath));
  });

  // 不做检测的URL
  if (safety) {
    return next();
  }

  // 确认Session里是否有用户情报
  if (req.session.user) {
    return next();
  }

  // 401 Unauthorized
  throw new errors.http.Unauthorized("Not logged in");
};

/**
 * @desc Csrftoken:<br>
 *  To implant csrf token in the Request.<br>
 *  The configure of app.js, the handle has been registered.
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.csrftoken = function (req, res, next) {

  // 设定token的全局变量
  if (req.csrfToken) {
    res.setHeader("csrftoken", req.csrfToken());
    res.locals.csrftoken = req.csrfToken();
  }
  next();
};

/**
 * @desc 设定客户端请求超时
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.timeout = function (req, res, next) {

  // 判断URL是否属于非超时范围
  var timeout = config.app.timeout * 1000
    , ignore  = _.find(config.ignore.timeout, function (path) {
        return !_.isNull(req.url.match(new RegExp(path.split(" ")[0], "i")));
      });

  // 如果是非超时范围，尝试取特定的超时值
  if (ignore) {
    timeout = parseInt(ignore.split(" ")[1]);
    timeout = _.isNaN(timeout) ? undefined : timeout * 1000;
  }

  if (timeout) {
    res.setTimeout(timeout, function () {
      res.status(408).send('Request Timeout');
    });
  }

  next();
};

/**
 * @desc 生成URL变更标识用的字符串，
 * 注意，URL不能使用相对路径
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.urlstamp = function (req, res, next) {

  // 注册一个stamp值
  res.locals.stamp = config.app.stamp;

  // 注册一个变换为动态URL的函数，可以在view里使用
  res.locals.dynamic = function (url) {

    // 添加静态资源前缀
    url = config.app.static + url;

    // 添加stamp
    return (_.include(url, "?") ? url + "&stamp=" + config.app.stamp : url + "?stamp=" + config.app.stamp);
  };

  next();
};

/**
 * @desc 进行CSFR校验，如果在配置文件里定义了除外对象，则不进行校验
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.csrfcheck = function (req, res, next) {

  var safety = false;
  _.each(config.ignore.csrf, function (path) {
    var regexPath = new RegExp(path, "i");
    safety = safety || !_.isNull(req.url.match(regexPath));
  });

  if (safety) {
    next();
  } else {
    csrf(req, res, next);
  }

};


/**
 * @desc Multipart对应
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.multipart = function (req, res, next) {
  if (isMultipart(req)) {
    new multiparty.Form({uploadDir: config.app.tmp}).parse(req, function (err, fields, files) {

      _.each(fields, function (val, key) {
        if (_.isArray(val) && val.length === 1) {
          req.body[key] = val[0];
        } else {
          req.body[key] = val;
        }
      });

      var result = [];
      _.each(_.values(files), function (field) {
        _.each(field, function (file) {
          if (!_.isEmpty(file.originalFilename) && file.size > 0) {
            result.push(file);
          }
        });
      });
      req.files = result;

      next();
    });
  } else {
    next();
  }
};

/**
 * @desc 修改移动端Session有效时间（与Web页面取不同值时，使用）
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.mobileexpire = function (req, res, next) {

  if (_.isUndefined(config.app.sessionTimeoutMobile) || helper.isBrowser(req)) {
    return next();
  }

  req.session.cookie.maxAge = config.app.sessionTimeoutMobile * 1000 * 10;
  next();
};

/**
 * @desc 访问权限控制
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.permission = function (req, res, next) {
  if (_.isUndefined(req.session.user)) {
    return next();
  }

  var handler = new context().bind(req, res)
    , code = handler.code ? handler.code : constant.DEFAULT_TENANT
    , authority = handler.user.authority || []
    , access = req.session.access || {}
    ;

  canAccess(handler, access[code], authority, function (err, noPermission) {
    if (err) {
      log.error(err);
      return response.send(res, new errors.system.SyetemError(err));
    }

    if (noPermission) {
      log.error("Access deny");
      return response.send(res, new errors.security.NoPermissionError());
    }

    next();
  });
};

/**
 * @desc 判断是否可以访问
 *  access表里定义的是，只有权限才可以访问的资源，如果没有定义，则默认是允许访问。
 *  这里，只对"route"，"board"类型的资源进行校验。
 *  TODO: 其他类型的校验方式的共同化，需要另行考虑
 * @param handler
 * @param accessList
 * @param authority
 * @param callback
 * @returns {Promise|*|{type, required, items}}
 */
function canAccess(handler, accessList, authority, callback) {

  var url = handler.req.url, allowedItems = [], allowedAuth = []
    , getAllowedItems = function (items) {            // 如果类型是route, board, 则判断是否包含本次访问的URL
      return _.filter(items, function (item) {
        return (item.type === "route" || item.type === "board") && _.contains(item.resource, url);
      });
    }
    , getAllowedAuth = function (items, authority) {  // 提取Item中的权限
      return _.intersection(authority, _.flatten(_.union(_.pluck(items, "authes"))));
    };

  if (!accessList) {
    return rider.access.list(handler, function (err, accessList) {
      if (err) {
        return callback(err);
      }

      // 缓存用户的可访问权限
      handler.req.session.access || (handler.req.session.access = {});
      handler.req.session.access[handler.code] = accessList.items;

      allowedItems = getAllowedItems(accessList.items);
      allowedAuth = getAllowedAuth(allowedItems, authority);
      callback(null, !_.isEmpty(getAllowedItems(accessList.items)) && _.isEmpty(allowedAuth));
    });
  }

  allowedItems = getAllowedItems(accessList.items);
  allowedAuth = getAllowedAuth(allowedItems);
  callback(null, !_.isEmpty(allowedItems) && _.isEmpty(allowedAuth));
}

/**
 * @desc 出错时重定向
 * @param {Object} err 错误对象
 * @param {Object} req 请求
 * @param {Object} res 响应
 */
exports.error = function (err, req, res, next) {

  // 如果是浏览器访问，出现未认证错误，则跳转到主页
  if (err.code == 401 && helper.isBrowser(req)) {
    log.warn(err);

    // 防止循环跳转
    if (req.url != config.app.home) {
      return res.redirect(config.app.home);
    }
  }

  throw err;
};

/**
 * @desc 数据校验
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.validator = function (req, res, next) {

  var handler = new context().bind(req, res);

  validator.isValid(handler, function (err, result) {
    if (err) {
      return response.send(res, err, result);
    }

    next();
  });
};
