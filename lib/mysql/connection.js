/**
 * @file 管理MySQL连接
 *  不支持Cluster连接
 * @author r2space@gmail.com
 * @module light.lib.mysql.connection
 * @version 1.0.0
 */


'use strict';

const mysql   = require('mysql');
let instance  = undefined;

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

  const setting = {
    host            : process.env.LIGHTMYSQL_HOST,
    port            : process.env.LIGHTMYSQL_PORT,
    user            : process.env.LIGHTMYSQL_USER,
    password        : process.env.LIGHTMYSQL_PASS,
    database        : process.env.APPNAME,
    connectionLimit : 10
  };

  console.log('MySQL name: ' + setting.database);
  console.log('MySQL host: ' + setting.host);
  console.log('MySQL port: ' + setting.port);
  console.log('MySQL user: ' + setting.user);
  console.log('MySQL pool: ' + setting.connectionLimit);

  return mysql.createPool(setting);
}
