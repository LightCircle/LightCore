/**
 *
 */

'use strict';

const _        = require('lodash')
  , Request    = require('tedious').Request
  , ObjectID   = require('mongodb').ObjectID
  , helper     = require('../../helper')
  , log        = require('../../log')
  , connection = require('./connection');


class Model {

  constructor(domain, code, table, options) {
  }

  add(query, data, callback) {

    if (!data['_id']) {
      data['_id'] = new ObjectID();
    }

    this.update(query, data, null, err => {
      if (err) {
        return callback(err);
      }
      callback(err, data);
    });
  }

  remove(query, condition, callback) {
    this.update(query, null, condition, callback);
  }

  update(query, data, condition, callback) {

    const sql = this._getSql(query, {data: data, condition: condition});
    log.debug(sql);

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

      request.on('doneInProc', rowCount => {
        if (typeof rowCount === 'undefined') {
          return;
        }

        callback(null, data);
      });

      conn.execSql(request);
    });
  }

  list(query, condition, callback) {

    const sql = this._getSql(query, condition);
    log.debug(sql);

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

      request.on('doneInProc', (rowCount, more, rows) => {
        if (typeof rowCount === 'undefined') {
          return;
        }

        const result = rows.map(columns => {
          return columns.reduce((memo, item) => {
            memo[item.metadata.colName] = item.value;
            return memo;
          }, {});
        });

        callback(null, result);
      });

      conn.execSql(request);
    });
  }

  get(query, condition, callback) {
    this.list(query, condition, (err, result) => {
      if (err) {
        return callback(err);
      }

      if (result.length > 0) {
        return callback(null, result[0]);
      }

      return null;
    });
  }

  count(query, condition, callback) {
    this.list(query, condition, (err, result) => {
      if (err) {
        return callback(err);
      }

      if (result.length > 0) {
        return callback(null, result[0]['COUNT']);
      }

      return 0;
    });
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