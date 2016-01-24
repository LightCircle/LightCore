/**
 * @file 存取数据用的MySQL模块
 * @author r2space@gmail.com
 * @module light.lib.mysql.model
 * @version 1.0.0
 */

"use strict";


var mysql = require("mysql")
  , pool = require("./connection");


/**
 * 构造函数
 */
var Model = module.exports = function Model() {
};


Model.prototype.db = function (callback) {
  pool.db().getConnection(callback);
};

Model.prototype.escape = function (params) {
  return mysql.escape(params);
};

Model.prototype.query = function (sql, params, callback) {

  // 获取数据库连接
  pool.db().getConnection(function (err, connection) {
    if (err) {
      return callback(err);
    }

    // 自定义参数书写格式
    customFormat(connection);

    // 执行SQL
    connection.query(sql, params, function (err, result) {
      connection.release();
      if (err) {
        return callback(err);
      }

      callback(err, result);
    });
  });
};

function customFormat(connection) {
  connection.config.queryFormat = function (query, values) {
    if (!values) return query;
    return query.replace(/\:(\w+)/g, function (txt, key) {
      if (values.hasOwnProperty(key)) {
        return this.escape(values[key]);
      }
      return txt;
    }.bind(this));
  };
}
