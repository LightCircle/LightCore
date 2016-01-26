/**
 * @file 管理数据库连接
 *  以数据库名位单位，在内存中保持连接，每个数据库连接使用2个连接池
 *  每个app实例都会保持上述连接，如有两个ap，则对db1有4个连接。
 *  当ap停止，会释放连接。
 * @author r2space@gmail.com
 * @module light.core.mongo.connection
 * @version 1.0.0
 */

"use strict";

var _         = require("underscore")
  , client    = require("mongodb").MongoClient
  , util      = require("util")
  , constant  = require("../constant")
  , pool      = require("./pool")
  , reconnect = 0
  ;

/**
 * Native: 获取数据库实例
 * @param domain database name
 * @param callback The connected database
 */
exports.db = function (domain, callback) {

  var host = process.env.LIGHTDB_HOST || "db"
    , port = process.env.LIGHTDB_PORT || 57017
    , dbName = domain;

  console.log("Database host: " + host);
  console.log("Database port: " + port);
  console.log("Database name: " + dbName);

  var option = {
    db      : constant.DB_OPTIONS,
    server  : constant.DB_SERVER_OPTIONS,
    replSet : constant.DB_REPLSET_OPTIONS,
    mongos  : constant.DB_MONGOS_OPTIONS
  };

  client.connect(util.format("mongodb://%s:%d/%s", host, port, dbName), option, callback);
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
  var db = pool.get(domain);
  if (db) {
    return callback(undefined, db);
  }

  exports.db(domain, function (err, db) {
    if (err) {
      return callback(err);
    }

    db.on("close", function () {
      console.log("connection close.");
    });

    db.on("reconnect", function () {
      console.log("connection reconnect.", ++reconnect);
    });

    // 指定了用户名，密码则进行验证
    if (user && pass) {
      db.authenticate(user, pass, function (err) {
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
