/**
 * 管理sqlserver连接
 */

'use strict';

const ConnectionPool = require('tedious-connection-pool');
let instance = undefined;

/**
 * 获取连接
 * @returns {undefined}
 */
exports.db = function () {
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

  const connectionSetting = {
    server  : process.env.LIGHTSQLSERVER_HOST,
    userName: process.env.LIGHTSQLSERVER_USER,
    password: process.env.LIGHTSQLSERVER_PASS,
    options : {
      database: process.env.APPNAME,
      port    : process.env.LIGHTSQLSERVER_PORT,
    }
  };

  const poolSetting = {
    min: 2, max: 10, log: true
  };

  console.log('SQLServer name: ' + connectionSetting.options.database);
  console.log('SQLServer host: ' + connectionSetting.server);
  console.log('SQLServer port: ' + connectionSetting.options.port);
  console.log('SQLServer user: ' + connectionSetting.userName);

  const pool = new ConnectionPool(poolSetting, connectionSetting);

  pool.on('error', err => {
    console.error(err);
  });

  return pool;
}
