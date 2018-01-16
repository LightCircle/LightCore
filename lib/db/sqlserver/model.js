/**
 *
 */

'use strict';

const _        = require('lodash')
  , Request    = require('tedious').Request
  , helper     = require('../../helper')
  , connection = require('./connection');


class Model {

  constructor(domain, code, table, options) {

  }

  add() {

  }

  remove() {

  }

  update() {

  }

  list(query, params, callback) {

    const sql = this._getSql(query, params);

    connection.db().acquire((err, conn) => {
      if (err) {
        return callback(err);
      }

      const request = new Request(sql, err => {
        if (err) {
          return callback(err);
        }

        conn.release();
      });

      request.on('row', columns => {
        console.log(columns);
        callback(err, columns);
      });

      conn.execSql(request);
    });

  }

  get() {

  }

  count() {

  }

  increase() {

  }

  writeFile() {

  }

  readFile() {

  }

  // 将模板格式的SQL和参数，转换为待执行的SQL语句
  _getSql(sql, params) {

    // escape sql （参数的 escape 在 parse 方法里做）
    sql = sql.replace(/;/g, '');

    return helper.ejsFormat(sql, params);
  }

  // 根据类型，将参数转换成SQL中使用的参数
  _parse() {


  }

}

module.exports = Model;