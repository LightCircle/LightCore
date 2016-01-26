/**
 * @file 管理MySQL连接
 *  不支持Cluster连接
 * @author r2space@gmail.com
 * @module light.lib.mysql.connection
 * @version 1.0.0
 */


"use strict";

var mysql     = require("mysql")
  , config    = require("../configuration")
  , instance  = undefined;

/**
 * 获取连接
 * @returns {undefined}
 */
exports.db = function() {
  if (instance) {
    return instance;
  }

  instance = initConnectionPool();
  return instance;
};

/**
 * 初始化连接池
 * @returns {Object}
 */
function initConnectionPool() {

  var setting = {
    host            : process.env.LIGHTMYSQL_HOST || config.mysql.host,
    port            : process.env.LIGHTMYSQL_PORT || config.mysql.port,
    user            : process.env.LIGHTMYSQL_USER || config.mysql.user,
    database        : process.env.LIGHTMYSQL_DB   || config.mysql.dbname,
    connectionLimit : config.mysql.pool || 10
  };

  // 环境变量里, 允许指定mysql密码为空
  if (process.env.LIGHTMYSQL_PASS == "null") {
  } else {
    setting.password = process.env.LIGHTMYSQL_PASS || config.mysql.pass;
  }

  console.log("MySQL name: " + setting.database);
  console.log("MySQL host: " + setting.host);
  console.log("MySQL port: " + setting.port);
  console.log("MySQL user: " + setting.user);
  console.log("MySQL pool: " + setting.connectionLimit);

  return mysql.createPool(setting);
}
