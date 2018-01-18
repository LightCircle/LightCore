/**
 * @file lib/db/sqlserver/model.js
 */

'use strict';

const _        = require('lodash')
  , moment     = require('moment')
  , Request    = require('tedious').Request
  , ObjectID   = require('mongodb').ObjectID
  , helper     = require('../../helper')
  , log        = require('../../log')
  , mapping    = require('./mapping')
  , connection = require('./connection');


class Model {

  constructor(domain, code, table, options) {
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

    log.info(`Condition   : ${JSON.stringify(condition)}`);
    const sql = this._getSql(query, {data: _.cloneDeep(data), condition: _.cloneDeep(condition)});
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

        mapping.parse(rows, callback);
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
        params.data[key] = this._parseParams(params.data[key]);
      });
    }

    if (params.condition) {
      Object.keys(params.condition).forEach(key => {
        params.condition[key] = this._parseParams(params.condition[key]);
      });
    }

    return helper.ejsFormat(sql, params);
  }

  // 根据类型，将参数转换成SQL中使用的参数
  _parseParams(value) {

    if (typeof value === 'undefined' || value === null) {
      return 'null';
    }

    if (value instanceof Date) {
      return `'${moment(value).format('YYYY-MM-DD HH:mm:ss.SSS')}'`;
    }

    if (value instanceof ObjectID) {
      return `'${value.toString()}'`;
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'string') {
      return `'${Model._escapeSql(value)}'`;
    }

    if (Array.isArray(value)) {
      if (value.length <= 0) {
        return '(null)';
      }

      const list = value.map(item => this._parseParams(item)).join(',');
      return `(${list})`;
    }

    // TODO: Map

    if (typeof value === 'number') {
      return value;
    }

    return `'${Model._escapeSql(String(value))}'`;
  }

  static _escapeSql(value) {
    return value.replace(/\'/g, "''");
  }

}

module.exports = Model;