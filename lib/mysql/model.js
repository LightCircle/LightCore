/**
 * @file 存取数据用的MySQL模块
 * @author r2space@gmail.com
 * @module light.lib.mysql.model
 * @version 1.0.0
 */

"use strict";


var pool = require("./connection");


/**
 * 构造函数
 */
var Model = module.exports = function Model() {
};


Model.prototype.db = function (callback) {
  pool.db().getConnection(callback);
};


Model.prototype.query = function (sql, params, callback) {

  pool.db().getConnection(function (err, connection) {
    if (err) {
      return callback(err);
    }

    connection.query(sql, params, function (err, result) {
      connection.release();
      if (err) {
        return callback(err);
      }

      callback(err, result);
    });
  });
};
