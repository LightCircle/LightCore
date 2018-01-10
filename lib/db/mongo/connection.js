/**
 * @file 管理数据库连接
 *  以数据库名位单位，在内存中保持连接，每个数据库连接使用2个连接池
 *  每个app实例都会保持上述连接，如有两个ap，则对db1有4个连接。
 *  当ap停止，会释放连接。
 * @author r2space@gmail.com
 * @module mongo.connection
 * @version 1.0.0
 */

'use strict';

const _       = require('underscore')
  , client    = require('mongodb').MongoClient
  , util      = require('util')
  , constant  = require('../../constant')
  , pool      = require('./pool');

let reconnect = 0;

/**
 * Native: 获取数据库实例
 * @param domain database name
 * @param callback The connected database
 */
exports.db = function (domain, callback) {

  const host = process.env.LIGHTDB_HOST || 'db'
    , port = process.env.LIGHTDB_PORT || 57017
    , dbName = domain;

  console.log('Database host: ' + host);
  console.log('Database port: ' + port);
  console.log('Database name: ' + dbName);

  /**
   * reconnectTries: 重新连接尝试次数，过了这个次数以后，使用该连接，会产生阻塞
   * 现在平台开发端与数据连接，通过HAPROXY做端口转发，HAPROXY会定时切断客户端的tcp连接。
   * 默认为1分钟，现在设定能满足客户端2天的连接。2880 = 1 x 60 x 24 x 2 = 2天
   *
   * 部署到生产环境时，由于与数据库直连，所以不会产生上述情况。
   * 紧当数据库重启2880次，才会出现。所以数据库维护是，最好伴随AP的重启以清除重连计数。
   */
  const option = {
    w: 1,
    poolSize: 2,
    reconnectTries: 2880
  };

  client.connect(util.format('mongodb://%s:%d/%s', host, port, dbName), option, callback);
};


/**
 * Native: 获取数据库连接。
 * 使用完DB后，无需明确关闭数据库。
 * @param domain 数据库名
 * @param user 数据用户
 * @param pass 数据密码
 * @param callback
 */
exports.connect = function (domain, user, pass, callback) {

  if (_.isFunction(domain)) {
    callback = domain;
    domain = undefined;
    user = undefined;
    pass = undefined;
  }

  if (_.isFunction(user)) {
    callback = user;
    user = undefined;
    pass = undefined;
  }

  // 没有指定，取环境里的用户名密码
  domain = domain || constant.SYSTEM_DB;
  user = user || process.env.LIGHTDB_USER;
  pass = pass || process.env.LIGHTDB_PASS;

  // 重用连接
  let db = pool.get(domain);
  if (db) {
    return callback(undefined, db);
  }

  exports.db(domain, (err, db) => {
    if (err) {
      return callback(err);
    }

    db.on('close', function () {
      console.log('connection close.');
    });

    db.on('reconnect', function () {
      console.log('connection reconnect.', ++reconnect);
    });

    // 指定了用户名，密码则进行验证
    if (user && pass) {
      db.authenticate(user, pass, err => {
        if (err) {
          return callback(err);
        }

        pool.add(domain, db);
        return callback(undefined, db);
      });
    } else {

      pool.add(domain, db);
      return callback(undefined, db);
    }
  });
};
