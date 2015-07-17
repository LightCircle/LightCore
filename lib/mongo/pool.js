/**
 * @file 数据库连接池
 *
 *  由于同时需要连接多个DB，通常的连接池保持机制不适合平台使用。
 *  这里，使用一个逻辑连接池来保持与连接，这些连接会放到内存中。
 *  当APP关闭时，才会释放这些连接。
 *
 *  即，每个AP服务器都会保持多个多个数据库连接。
 *
 *  由于第一次访问时，会有多个请求同时创建同名的数据库连接，这样无法只保存一份在逻辑池中。
 *  我们用temporary方式，先保存这些，等过一段时间再明确关闭并释放。
 *
 *  可以通过mongodb的mongostat命令，关注数据库的连接及其他状态。
 * @author r2space@gmail.com
 * @module light.framework.mongo.pool
 * @version 1.0.0
 */


var _ = require("underscore");

/**
 * Connection map
 *  key   : code
 *  value : connection instance
 */
var connections = {};

/**
 * 临时数据库连接
 * @type {Array}
 */
var temporary = [];

/**
 * 临时数据库连接的保持最长时间 20秒
 * @type {number}
 */
var MAX_KEEP_TIME = 20 * 1000;

/**
 * 获取连接
 * @param db
 * @returns {*}
 */
exports.get = function (db) {

  var current = new Date();
  _.each(temporary, function (item, index) {

    if (item.db == db && current - item.time >= MAX_KEEP_TIME) {
      item.connection.close();
      delete temporary[index];
    }
  });
  temporary = _.compact(temporary);

  return connections[db];
};

/**
 * 删除
 * @param db
 */
exports.remove = function (db) {
  delete connections[db];
};

/**
 * 向连接池添加一个连接
 * @param db
 * @param connection
 */
exports.add = function (db, connection) {

  // 如果已经有连接，则存在临时池中
  if (connections[db]) {
    temporary.push({
      db: db,
      connection: connection,
      time: new Date()
    });

    return;
  }
  connections[db] = connection;
};
