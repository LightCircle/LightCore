/**
 * @file 对外接口定义
 * @author r2space@gmail.com
 */

"use strict";

var _ = require("underscore");

module.exports = {

  /**
   * nodejs语言级别可用的模块
   */
  lang: {
    "fs":         require("fs"),
    "http":       require("http"),            // Stability: 3 - Stable
    "util":       require("util"),            // Stability: 4 - API Frozen
    "path":       require("path"),            // Stability: 3 - Stable
    "cluster":    require("cluster"),         // Stability: 2 - Unstable
    "os":         require("os"),              // Stability: 4 - API Frozen
    "events":     require("events"),          // Stability: 4 - API Frozen
    "childproc":  require("child_process")    // Stability: 3 - Stable
  },

  /**
   * 第三方模块
   */
  util: {
    "co":           require("co"),
    "async":        require("async"),
    "ejs":          require("ejs"),
    "mongodb":      require("mongodb"),
    "moment":       require("moment"),
    "numeral":      require("numeral"),
    "underscore":   require("underscore"),
    "socket":       require("socket.io"),
    "socketclient": require("socket.io-client"),
    "xml2js":       require("xml2js"),
    "request":      require("request"),
    "mpath":        require("mpath"),

    /* 废弃或移出预定 */
    //"config":       require("config"),
    "express":      require("express")

  },

  /**
   * 工具模块
   */
  framework: {
    "crypto":     require("./lib/crypto"),
    "error":      require("./lib/error"),
    "log":        require("./lib/log"),
    "helper":     require("./lib/helper"),
    "validator":  require("./lib/validator"),
    "command":    require("./lib/command"),
    "cache":      require("./lib/cache"),
    "captcha":    require("./lib/image/captchapng"),
    "config":     require("./lib/configuration"),
    "test":       require("./lib/test"),
    "job":        require("./lib/job"),
    "signal":     require("./lib/signal"),

    "mongomodel": require("./lib/mongo/model"),
    "mongoctrl":  require("./lib/mongo/controller"),
    "mongo":      require("./lib/mongo/connection"),
    "mongotype":  require("./lib/mongo/type"),
    "mongooper":  require("./lib/mongo/operator"),

    "oracle":     require("./lib/oracle/connection"),

    "context":    require("./lib/http/context"),
    "loader":     require("./lib/http/loader"),
    "middleware": require("./lib/http/middleware"),
    "response":   require("./lib/http/response"),
    "sqlbuilder": require("./lib/sqlbuilder")
  },

  /**
   * 数据定义模块
   */
  model: {
    auth:         require("./lib/model/tool/security"), // 预定废弃，请使用security
    security:     require("./lib/model/tool/security"),
    dispatcher:   require("./lib/model/tool/dispatcher"),
    system:       require("./lib/model/system"),
    rider:        require("./lib/model/datarider"),
    migrate:      require("./lib/model/datamigrate"),
    job:          require("./lib/model/job")
  }
};

/**
 * 整合underscore.string
 */
function initialize() {
  _.str = require("underscore.string");
  _.mixin(_.str.exports());
  global.__framework = __dirname;
}

initialize();
