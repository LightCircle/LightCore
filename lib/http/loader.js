/**
 * @file    Light平台核心服务的初始化
 * @module  lib.http.loader
 * @author  r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var path           = require("path")
  , fs             = require("fs")
  , http           = require("http")
  , _              = require("underscore")
  , express        = require("express")
  , ejs            = require("ejs")
  , session        = require("express-session")
  , moment         = require("moment")
  , MongoStore     = require("connect-mongo")(session)
  , morgan         = require("morgan")
  , bodyparser     = require("body-parser")
  , bodyparserxml  = require("express-xml-bodyparser")
  , methodoverride = require("method-override")
  , socket         = require("../socket")
  , log            = require("../log")
  , constant       = require("../constant")
  , config         = require("../configuration")
  , cache          = require("../cache")
  , job            = require("../model/job")
  , rider          = require("../model/datarider")
  , helper         = require("../helper")
  ;


/**
 * @desc 初始化函数
 * @param {Object} app Express实例
 * @param {String} domain 应用识别号
 * @param {Function} callback 回调函数
 */
exports.initialize = function (app, domain, callback) {

  if (_.isFunction(domain)) {
    callback = domain;
    domain = constant.SYSTEM_DB;
  }

  cache.manager.init(domain, function(err, db) {
    if (err) {
      log.error(err);
      return process.exit(1);  // 初始化出错，拒绝启动
    }

    // 初始化rider
    rider.init();

    // 初始化任务
    job.init(domain, function(err) {
      if (err) {
        log.error(err);
        return process.exit(1);// 初始化出错，拒绝启动
      }

      setupExpress(app, db);
      callback(app);
    });
  });
};


/**
 * @desc 启动服务
 * @param {Object} app Express实例
 */
exports.start = function (app) {

  var server = http.createServer(app);

  // 启动 WebSocket 服务
  socket.listen(server);

  // 启动 HTTP 服务
  server.listen(app.get("port"), function () {
    log.info("light server listening on port " + app.get("port"));
  });
};


/**
 * @desc 初始化express模块
 * @param {Object} app Express实例
 * @param {Object} db 数据库连接
 */
function setupExpress(app, db) {

  log.debug("initialize express");
  app.set("port", process.env.PORT || 7000);
  app.set("views", path.join(process.cwd(), config.app.views));
  app.set("view engine", "html");
  app.engine("html", ejs.renderFile);

  /**
   * Middleware
   * 记录Access log和Error log
   */
  morgan.token("date", function getId() {
    return moment().format("YYYY-MM-DD HH:mm:ss.SSS");
  });
  morgan.token("uid", function getId(req) {
    if (req && req.session && req.session.user && req.session.user._id) {
      return req.session.user._id.toString();
    } else {
      return "-";
    }
  });
  app.use(morgan("[:date] [I] [:method] :url :status :res[content-length] :uid :response-time -", {
    skip: function (req) {
      return req.url.match(/\/static.*/i);
    }
  }));

  /**
   * Middleware
   * 用于模拟DELETE and PUT方法
   * 可以在form里放在<input type="hidden" name="_method" value="put" />来模拟
   */
  app.use(methodoverride());

  /**
   * Middleware
   * 解析token，并将token转换成验证用cookie，转换成功则将该sid设置到cookie中
   */
  app.use(function(req, res, next) {
    try {
      var sid = helper.decodeToken(req, config.app.tokenSecret).sid;
      if (sid) {
        req.headers.cookie = sid;
      }
    } catch(err) {
      log.error(err.toString());
    }

    next();
  });

  /**
   * Middleware
   * 提供基于cookie的session
   */
  app.use(session({
    secret            : config.app.sessionSecret,
    key               : config.app.sessionKey,
    cookie            : {maxAge: config.app.sessionTimeout * 60 * 60 * 1000},
    store             : new MongoStore({db: db}),
    rolling           : true,
    resave            : true,
    saveUninitialized : false
  }));

  app.use(bodyparser.json());

  // 支持 application/x-www-form-urlencoded; text/html; charset=utf-8 形式的post请求body解析
  // 如, 支付宝回调的请求使用这种方式
  app.use(bodyparser.urlencoded({
    extended: true, type: function (req) {
      return /x-www-form-urlencoded/.test(req.headers["content-type"]);
    }
  }));

  // 支持 text/xml 格式的内容解析
  app.use(bodyparserxml({explicitArray: false}));

  // 静态资源
  app.use(express.static("public"));
}
