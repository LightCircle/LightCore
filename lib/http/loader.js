/**
 * @file Light平台核心服务的初始化<br>
 *  TODO: 整理 morgan, favicon等 中间件
 * @module light.core.http.loader
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var path           = require("path")
  , fs             = require("fs")
  , http           = require("http")
  , _              = require("underscore")
  , async          = require("async")
  , express        = require("express")
  , ejs            = require("ejs")
  , session        = require("express-session")
  , moment         = require("moment")
  , MongoStore     = require("connect-mongo")(session)
  , morgan         = require("morgan")
  , bodyparser     = require("body-parser")
  , methodoverride = require("method-override")
  , cookieparser   = require("cookie-parser")
  , favicon        = require("serve-favicon")
  //, io             = require("socket.io")
  , log            = require("../log")
  , constant       = require("../constant")
  , config         = require("../configuration")
  , cache          = require("../cache")
  , signal         = require("../signal")
  , job            = require("../model/job")
  , rider          = require("../model/datarider")
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
 * @param {Function} finished 应用完成启动之后被调用，可以在这里做应用程序的初始化
 */
exports.start = function (app, finished) {

  var server = http.createServer(app);

  //io(server).of("/signal").on("connection", function(socket){
  //  socket.on("data", signal.onReceive);
  //});

  server.listen(app.get("port"), function () {
    log.info("light server listening on port " + app.get("port"));

    if (finished) {
      finished();
    }
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
   * 生成标准favicon.ico，防止favicon.ico的404错误
   */
  if (fs.existsSync("public/static/favicon.ico")) {
    app.use(favicon("public/static/favicon.ico"));
  }

  /**
   * Middleware
   * 记录Access log和Error log
   */


  morgan.token('date', function getId(req, res, format) {
    return moment().format("YYYY-MM-DD HH:mm:ss.SSS");
  });
  morgan.token('uid', function getId(req, res, format) {
    if (req && req.session && req.session.user && req.session.user._id) {
      return req.session.user._id.toString();
    } else {
      return '-';
    }
  });
  app.use(morgan("[:date] [I] [:method] :url :status :res[content-length] :uid :response-time -", {
    skip: function (req) {
      return req.url.match(/\/static.*/i);
    }
  }));

  /**
   * Middleware
   * 压缩response data为gzip
   */
  //app.use(express.compress());

  /**
   * Middleware
   * 用于模拟DELETE and PUT方法
   * 可以在form里放在<input type="hidden" name="_method" value="put" />来模拟
   */
  app.use(methodoverride());

  /**
   * Middleware
   * 解析cookie
   */
  app.use(cookieparser(config.app.cookieSecret));

  /**
   * Middleware
   * 提供基于cookie的session
   */
  app.use(session({
    secret: config.app.sessionSecret,
    key: config.app.sessionKey,
    cookie: {maxAge: config.app.sessionTimeout * 60 * 60 * 1000},
    store: new MongoStore({db: db}),
    rolling: true,
    resave: true,
    saveUninitialized: false
  }));

  app.use(bodyparser.json());
  app.use(bodyparser.urlencoded({extended: true}));
  app.use(express.static('public'));
}
