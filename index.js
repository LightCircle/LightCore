/**
 * @file 对外接口定义
 * @author r2space@gmail.com
 */

'use strict';

module.exports = {

  CONST:        require('./lib/constant'),
  cache:        require('./lib/cache'),
  crypto:       require('./lib/crypto'),
  error:        require('./lib/error'),
  log:          require('./lib/log'),
  helper:       require('./lib/helper'),
  rider:        require('./lib/model/datarider'),
  migrate:      require('./lib/model/datamigrate'),
  job:          require('./lib/model/job'),
  file:         require('./lib/model/file'),
  context:      require('./lib/http/context'),
  push:         require("./lib/tool/push"),
  test:         require("./lib/test"),
  loader:       require("./lib/http/loader"),
  middleware:   require("./lib/http/middleware"),
  dispatcher:   require("./lib/http/dispatcher"),
  response:     require("./lib/http/response"),
  mysql: {
    controller: require("./lib/db/mysql/controller"),
    model:      require("./lib/db/mysql/model"),
  },
  mongodb: {
    model:      require("./lib/db/mongo/model"),
    controller: require("./lib/db/mongo/controller"),
    connection: require("./lib/db/mongo/connection"),
  },

  /**
   * 第三方模块
   */
  util: {
    'async':        require('async'),
    'ejs':          require('ejs'),
    'mongodb':      require('mongodb'),
    'moment':       require('moment'),
    'numeral':      require('numeral'),
    'underscore':   require('underscore'),// 废弃预定
    'lodash':       require('lodash'),
    'xml2js':       require('xml2js'),
    'request':      require('request'),
    'zip':          require('zip-stream'),
    'cron':         require('cron'),
    'mime':         require('mime-types'),
    'express':      require('express'),
    'mpath':        require('./lib/mpath')
  },

  /**
   * @deprecated
   * nodejs语言级别可用的模块
   */
  lang: {
    "fs":           require("fs"),
    "http":         require("http"),            // Stability: 3 - Stable
    "util":         require("util"),            // Stability: 4 - API Frozen
    "path":         require("path"),            // Stability: 3 - Stable
    "cluster":      require("cluster"),         // Stability: 2 - Unstable
    "os":           require("os"),              // Stability: 4 - API Frozen
    "events":       require("events"),          // Stability: 4 - API Frozen
    "childproc":    require("child_process"),   // Stability: 3 - Stable
    "querystring":  require("querystring")      // Stability: 3 - Stable
  },

  /**
   * @deprecated
   * 工具模块
   */
  framework: {
    "crypto":     require("./lib/crypto"),
    "error":      require("./lib/error"),
    "log":        require("./lib/log"),
    "helper":     require("./lib/helper"),
    "command":    require("./lib/command"),
    "cache":      require("./lib/cache"),
    "captcha":    require("./lib/image/captchapng"),
    "config":     require("./lib/configuration"),
    "test":       require("./lib/test"),
    "job":        require("./lib/job"),
    "signal":     require("./lib/signal"),
    "socket":     require("./lib/socket"),
    "mq":         require("./lib/mq"),
    "validator":  require("./lib/validator"),

    "mongomodel": require("./lib/db/mongo/model"),
    "mongoctrl":  require("./lib/db/mongo/controller"),
    "mongo":      require("./lib/db/mongo/connection"),
    "mongotype":  require("./lib/db/mongo/type"),
    "mongooper":  require("./lib/db/mongo/operator"),

    "oracle":     require("./lib/db/oracle/connection"),
    "mysql":      require("./lib/db/mysql/controller"),

    "context":    require("./lib/http/context"),
    "loader":     require("./lib/http/loader"),
    "middleware": require("./lib/http/middleware"),
    "response":   require("./lib/http/response"),

    "push":       require("./lib/tool/push")
  },

  /**
   * @deprecated
   * 数据定义模块
   */
  model: {
    auth:         require("./lib/security"), // 预定废弃，请使用security
    security:     require("./lib/security"),
    dispatcher:   require("./lib/http/dispatcher"),
    system:       require("./lib/model/system"),
    rider:        require("./lib/model/datarider"),
    migrate:      require("./lib/model/datamigrate"),
    process:      require("./lib/model/process"),
    job:          require("./lib/model/job"),
    file:         require("./lib/model/file") // file里的方法通过API可以使用，但是在APP的后台无法调用，故开放（其他类需要斟酌后陆续添加）
  }
};

function initialize() {
  global.__core = __dirname;
}

initialize();
