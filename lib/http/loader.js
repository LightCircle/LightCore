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
  , moment         = require("moment-timezone")
  , MongoStore     = require("connect-mongo")(session)
  , MySQLStore     = require("express-mysql-session")
  , morgan         = require("morgan")
  , bodyparser     = require("body-parser")
  , bodyparserxml  = require("express-xml-bodyparser")
  , methodoverride = require("method-override")
  , helmet         = require('helmet')
  , socket         = require("../socket")
  , log            = require("../log")
  , constant       = require("../constant")
  , config         = require("../configuration")
  , cache          = require("../cache")
  , job            = require("../model/job")
  , rider          = require("../model/datarider")
  , helper         = require("../helper")
  , mysql          = require("../mysql/connection")
  , tool           = require("../tool")
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
exports.start = function (app, callback) {

  if (!config.app) {
    return;
  }

  var server = http.createServer(app);

  // 启动 WebSocket 服务
  socket.listen(server);

  // 启动 HTTP 服务
  server.listen(app.get("port"), function () {
    log.info("light server listening on port " + app.get("port"));
    if (callback) {
      callback();
    }
  });
};


/**
 * @desc 初始化express模块
 * @param {Object} app Express实例
 * @param {Object} db 数据库连接
 */
function setupExpress(app, db) {

  if (!config.app) {
    return;
  }

  log.debug("initialize express");
  app.set("port", process.env.PORT || 7000);
  app.set("views", path.join(process.cwd(), config.app.views));
  app.set("view engine", "html");
  app.engine("html", ejs.renderFile);


  /**
   * secure your express apps
   */
  app.use(helmet());

  /**
   * Middleware
   * 记录Access log和Error log
   */
  morgan.token("date", function getId() {
    return moment().tz(config.app.timezone || "UTC").format("YYYY-MM-DD HH:mm:ss.SSS");
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
    store             : db ? new MongoStore({db: db}) : new MySQLStore(mysql.db().config.connectionConfig),
    rolling           : true,
    resave            : true,
    saveUninitialized : false
  }));

  app.use(bodyparser.json({limit: "5mb"}));

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
  app.use(express.static("."));
}

/**
 * 从本地加载配置文件
 */
exports.loadConfig = function () {
  if (!process.argv) {
    return;
  }

  var isLocal   = (process.argv.length > 2 && process.argv[2] == '-local');
  if (!isLocal) {
    return;
  }

  // 加载配置文件
  var setting = helper.yamlLoader("/config.yml");
  process.env.LIGHTDB_HOST    = setting.mongodb.host;
  process.env.LIGHTDB_PORT    = setting.mongodb.port;
  process.env.LIGHTDB_USER    = setting.mongodb.user;
  process.env.LIGHTDB_PASS    = setting.mongodb.pass;
  process.env.LIGHTDB_AUTH    = setting.mongodb.auth;// 数据库认证方式 (Option)

  process.env.PORT            = setting.app.port;
  process.env.APPNAME         = setting.app.domain;
  process.env.MASTER          = setting.app.master;  // 主服务器(如果定时器被设定, 则会启动) (Option)
  process.env.DEV             = setting.app.dev;     // 开发模式 (Option)
  process.env.LOCAL           = setting.app.local;   // 从本地文件加载管理数据 (Option)

  if (setting.mysql) {
    process.env.LIGHTMYSQL_HOST = setting.mysql.host;  // (Option)
    process.env.LIGHTMYSQL_PORT = setting.mysql.port;  // (Option)
    process.env.LIGHTMYSQL_USER = setting.mysql.user;  // (Option)
    process.env.LIGHTMYSQL_PASS = setting.mysql.pass;  // (Option)
  }
};

/**
 * 执行开发工具
 */
exports.parseArgv = function () {
  if (!process.argv) {
    return;
  }

  var isPush    = (process.argv.length > 3 && process.argv[3] == '-push')
    , isDump    = (process.argv.length > 3 && process.argv[3] == '-dump')
    , isRestore = (process.argv.length > 3 && process.argv[3] == '-restore');

  // 上传代码
  if (isPush) {
    return tool.push.start(function (err, result) {
      if (err) {
        log.error(err);
      }
      log.debug(result);
      process.exit(1);
    });
  }

  // 下载配置
  if (isDump) {
    return tool.dump.start(function () {
      process.exit(1);
    });
  }

  // 上传配置
  if (isRestore) {
    return tool.restore.start(function () {
      process.exit(1);
    });
  }
};

/**
 * 预先加载, 校验代码
 */
exports.preLoadController = function (ignore) {

  if (process.env.DEV != "true") {
    return;
  }

  var ctrl = [];
  helper.tree("controllers", ctrl, ".js", ignore);
  
  _.each(ctrl, function (item) {
    var source = item.file.replace(process.cwd, ".");
    source.replace(".js", "");
    require(source);
  });
};
