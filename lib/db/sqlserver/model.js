/**
 * @file lib/db/sqlserver/model.js
 */

'use strict';

const Request  = require('tedious').Request
  , ObjectID   = require('mongodb').ObjectID
  , helper     = require('../../helper')
  , log        = require('../../log')
  , mapping    = require('./mapping')
  , operator   = require('./operator')
  , connection = require('./connection');


class Model {

  constructor(domain, code, table, options) {
    this.domain = domain;
    this.code = code;
    this.table = table;
    this.options = options;
  }

  add(query, data, callback) {

    if (!data['_id']) {
      data['_id'] = new ObjectID().toString();
    }

    this.update(query, data, null, err => {
      if (err) {
        return callback(err);
      }
      callback(err, data);
    });
  }

  remove(query, data, condition, callback) {
    this.update(query, data, condition, callback);
  }

  update(query, data, condition, callback) {

    const params = new mapping().build(data);

    log.info(`Table       : ${this.table}`);
    log.info(`Condition   : ${JSON.stringify(condition)}`);
    const sql = this._getSql(query, {data: params, condition: condition});
    log.info(`SQL         : ${sql}`);

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

        callback(null, rowCount);
      });

      conn.execSql(request);
    });
  }

  list(query, condition, callback) {

    log.info(`Table       : ${this.table}`);
    log.info(`Condition   : ${JSON.stringify(condition)}`);
    const sql = this._getSql(query, {condition: condition});
    log.info(`SQL         : ${sql}`);

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

        rows = rows.map(row => {
          return row.map(item => {
            return {type: item.metadata.type.type, name: item.metadata.colName, value: item.value};
          });
        });

        new mapping().parse(rows, callback);
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

      return callback(null, null);
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

    if (params.data) {
      Object.keys(params.data).forEach(key => {
        params.data[key] = operator.parseParams(params.data[key]);
      });
    }

    if (params.condition) {
      Object.keys(params.condition).forEach(key => {
        params.condition[key] = operator.parseParams(params.condition[key]);
      });
    }

    return helper.ejsFormat(sql, params);
  }

}

module.exports = Model;