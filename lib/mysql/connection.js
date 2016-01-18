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
    host:             config.mysql.host,
    port:             config.mysql.port,
    database:         config.mysql.dbname,
    user:             config.mysql.user,
    password:         config.mysql.pass,
    connectionLimit:  config.mysql.pool || 10
  };

  console.log("MySQL name: " + setting.database);
  console.log("MySQL host: " + setting.hostname);
  console.log("MySQL port: " + setting.port);
  console.log("MySQL user: " + setting.user);
  console.log("MySQL pool: " + setting.connectionLimit);

  return mysql.createPool(setting);
}
