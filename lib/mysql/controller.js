/**
 * @file controller的共通类
 * @author r2space@gmail.com
 * @module light.lib.mysql.controller
 * @version 1.0.0
 */

'use strict';

const path   = require('path')
  , fs       = require('fs')
  , _        = require('underscore')
  , moment   = require('moment')
  , ObjectID = require('mongodb').ObjectID
  , errors   = require('../error')
  , log      = require('../log')
  , type     = require('../mongo/type')
  , model    = require('./model');


/**
 * 构造函数
 * @type {Controller}
 */
class Controller {
  constructor(handler) {
    this.params = {};
    this.handler = handler;
    this.timezone = handler.timezone;

    this.sql = handler.params.script;
    this.filters = handler.params.condition;
  }


  add(callback) {

    this.params.valid = 1;
    this.params.createAt = new Date();
    this.params.createBy = this.handler.uid;
    this.params.updateAt = this.params.createAt;
    this.params.updateBy = this.handler.uid;

    this.filter();
    this.convert();

    log.debug(this.params, this.handler.uid);
    new model().query(this.sql, this.params, callback);
  };


  remove(callback) {

    this.filter();

    log.debug(this.params, this.handler.uid);
    new model().query(this.sql, this.params, callback);
  };


  update(callback) {

    this.params.updateAt = new Date();
    this.params.updateBy = this.handler.uid;

    this.filter();
    this.convert();

    log.debug(this.params, this.handler.uid);
    new model().query(this.sql, this.params, callback);
  };


  list(callback) {
    log.debug(this.handler.params, this.handler.uid);
    new model().query(this.sql, this.handler.params, callback);
  };


  /**
   * @desc 直接指定SQL和参数执行, 不会对参数进行类型转换等.
   * @param sql
   * @param params
   * @param callback
   */
  query(sql, params, callback) {

    if (_.isFunction(params)) {
      callback = params;
      params = undefined;
    }

    new model().query(sql, params, callback);
  };


  escape(params) {
    return new model().escape(params);
  };


  /**
   * @desc 根据定义, 对条件进行类型转换
   * @returns {*}
   */
  filter() {

    // 如果定义了自由条件，则对检索条件框架不做任何处理
    if (this.handler.params.free) {

      this.params = this.handler.params.free;
      return this.params;
    }

    // 没有检索条件，返回空
    let data = this.handler.params.condition || this.handler.params.filter || this.handler.params;

    _.each(this.filters, function (filter) {

      let value = data[filter.parameter];

      // 如果没有取到值, 则尝试使用预约语解析
      if (_.isUndefined(value)) {
        value = parseReserved(this.handler, filter.parameter);
      }

      // 对参数进行类型转换
      if (_.isUndefined(this.params[filter.parameter])) {
        this.params[filter.parameter] = type.parse(value, filter.type, {tz: this.timezone});
      }
    }.bind(this));

    return this.params;
  };


  /**
   * @desc 对数据进行类型转换
   * @returns {*}
   */
  convert() {

    let data = this.handler.params.data || this.handler.params;

    _.each(this.filters, function (filter) {

      let value = data[filter.parameter];

      // 如果没有取到值, 则尝试使用预约语解析
      if (_.isUndefined(value)) {
        value = parseReserved(this.handler, filter.parameter);
      }

      // 对参数进行类型转换
      if (_.isNull(this.params[filter.parameter])) {
        this.params[filter.parameter] = type.parse(value, filter.type);
      }
    }.bind(this));

    return this.params;
  };


  readFile(option, callback) {
    const sql = 'SELECT `_id`, `data` FROM `' + this.handler.domain + '`.`file` ' +
      'WHERE `_id` = \'<%= condition.id %>\' AND `valid` = 1';

    this.query(sql, {condition: {id: this.handler.params.id}}, (err, result) => {
      if (err) {
        return callback(err);
      }

      if (result.length < 0) {
        return callback(new errors.db.Find('file not found.'));
      }

      fs.writeFile(option.path, result[0].data, 'binary', callback);
    });
  };

  writeFile(option, callback) {

    const buffer = fs.readFileSync(option.path);

    if (this.handler.params.id) {
      const update = 'UPDATE `' + this.handler.domain + '`.`file` SET `data` = ?, length = ?, updateAt = ? ' +
        'WHERE `_id` = \'' + this.handler.params.id + '\' AND `valid` = 1';
      return this.query(update, [buffer, buffer.length, new Date()], callback);
    }

    const insert = 'INSERT INTO `' + this.handler.domain + '`.`file` (`_id`, `length`, `data`) VALUES (?, ?, ?)';
    this.query(insert, [new ObjectID().toHexString(), buffer.length, buffer], callback);
  }

}

/**
 * @desc 获取预约语对应的值
 *  $uid 当前用户ID
 *  $sysdate 日期型，系统当前日期 没有时间信息
 *  $systime 日期型，系统当前日期 包含时间信息
 * @ignore
 * @param handler
 * @param keyword
 * @returns {*}
 */
function parseReserved(handler, keyword) {
  if (keyword === '$uid') {
    return handler.uid;
  }

  if (keyword === '$sysdate') {
    return new Date();
  }

  if (keyword === '$systime') {
    return new Date();
  }

  if (keyword === '$corp') {
    return handler.corp;
  }

  return null;
}

module.exports = Controller;