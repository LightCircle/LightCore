/**
 * @file 存取数据用的MySQL模块
 * @author r2space@gmail.com
 * @module light.lib.mysql.model
 * @version 1.0.0
 */

"use strict";


var mysql = require("mysql")
  , pool  = require("./connection");


/**
 * 构造函数
 */
var Model = module.exports = function Model() {
};


/**
 * 可以获取一个数据库连接
 * @param callback
 */
Model.prototype.db = function (callback) {
  pool.db().getConnection(callback);
};


/**
 * 对SQL参数进行escape, escape做的处理, 可以查看MySQL Node Driver的文档
 * @param params
 */
Model.prototype.escape = function (params) {
  return mysql.escape(params);
};


/**
 * 执行查询操作
 * @param {String} sql SQL语句, 参数是 :param 的格式代入的
 * @param {Object} params SQL内的参数
 * @param callback
 */
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

      // 释放连接到连接池
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

    if (!values) {
      return query;
    }

    return query.replace(/\:{1,2}(\w+)/g, function (txt, key) {

      // 两个::开头的变量, 不进行escape而直接替换内容
      if (txt.startsWith("::")) {
        if (values.hasOwnProperty(key)) {
          return values[key];
        }
        return txt;
      }

      // 单个:开头的变量, 进行escape
      if (values.hasOwnProperty(key)) {
        return this.escape(values[key]);
      }
      return txt;
    }.bind(this));
  };
}
