/**
 * MS SQLServer 操作类
 *
 * @file lib/db/sqlserver/controller.js
 */

'use strict';

const _   = require('lodash')
  , CONST = require('../../constant')
  , Model = require('./model')
;

class Controller {

  constructor(handler, table) {

    this.handler = handler;
    this.table = table;
    this.uid = handler.uid;
    this.strict = handler.strict;
    this.params = handler.params;
    this.params.data = this.params.data || {};
    this.params.condition = this.params.condition || {};

    this.model = new Model(handler.domain, handler.code, table);
  }

  list(callback) {

    this._setValid();
    this.model.list(this.params.script, _.cloneDeep(this.params.condition), (err, result) => {
      if (err) {
        return callback(err);
      }

      if (this.params.limit > 0) {
        return this._countList(this.params.condition, (err, count) => {
          if (err) {
            return callback(err);
          }

          callback(err, {totalItems: count, items: result});
        });
      }

      callback(err, {totalItems: result.length, items: result});
    });
  }

  add(callback) {

    if (this.strict) {

      // Strict mode, the use of system time
      this.params.data.createAt = new Date();
      this.params.data.createBy = this.uid || CONST.DEFAULT_USER;
      this.params.data.updateAt = new Date();
      this.params.data.updateBy = this.uid || CONST.DEFAULT_USER;
      this.params.data.valid = CONST.VALID;
    } else {

      // In non-strict mode, the user specified time is attempted
      this.params.data.createAt = this.params.data.createAt || new Date();
      this.params.data.createBy = this.params.data.createBy || this.uid || CONST.DEFAULT_USER;
      this.params.data.updateAt = this.params.data.updateAt || new Date();
      this.params.data.updateBy = this.params.data.updateBy || this.uid || CONST.DEFAULT_USER;
      this.params.data.valid = typeof this.params.data.valid === 'undefined' ? CONST.VALID : this.params.data.valid;
    }

    this.model.add(this.params.script, this.params.data, callback);
  }

  remove(callback) {

    this.params.data.updateAt = new Date();
    this.params.data.updateBy = this.uid || CONST.DEFAULT_USER;
    this.params.data.valid = CONST.INVALID;

    this.params.condition.valid = CONST.VALID;

    this.model.remove(this.params.script, this.params.data, this.params.condition, callback);
  }

  update(callback) {

    if (this.strict) {

      // Strict mode, the use of system time
      this.params.data.updateAt = new Date();
      if (this.uid) {
        this.params.data.updateBy = this.uid;
      }
    } else {

      // In non-strict mode, the user specified time is attempted
      this.params.data.updateAt = this.params.data.updateAt || new Date();
      if (this.uid) {
        this.params.data.updateBy = this.params.data.updateBy || this.uid;
      }
    }

    this._setValid();
    this.model.update(this.params.script, this.params.data, this.params.condition, callback);
  }

  get(callback) {

    this._setValid();
    this.model.get(this.params.script, this.params.condition, callback);
  }

  count(callback) {
    this._setValid();
    this.model.count(this.params.script, this.params.condition, callback);
  }

  increase() {
    //TODO:
  }

  writeFile() {
    //TODO:
  }

  readFile() {
    //TODO:
  }

  _countList(condition, callback) {

    let sql = this.params.script;

    // 使用List脚本的条件，获取数据的件数（在原有script基础上删除OFFSET和FETCH NEXT语句，然后检索件数）
    sql = sql.replace('OFFSET[ ]*\d*', '');
    sql = sql.replace('FETCH NEXT[ ]*\d*[ ]*ROWS ONLY', '');
    sql = `SELECT COUNT(1) AS COUNT FROM (${sql}) AS T`;

    this.model.count(sql, this.params.condition, callback);
  }

  _setValid() {
    if (typeof this.params.condition['valid'] === 'undefined') {
      this.params.condition['valid'] = CONST.VALID;
    }
  }

}

module.exports = Controller;