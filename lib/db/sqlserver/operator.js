/**
 *
 */

'use strict';

const moment = require('moment')
  , ObjectID = require('mongodb').ObjectID
  , error    = require('../../error')
  , helper   = require('../../helper')
  , mapping  = require('./mapping')

;

class Operator {

  constructor() {
  }

  /**
   * 支持一下几种比较，如果不在这个范围内，需要自行写SQL语句
   * - 1. 单纯比较
   *   free = {a: 1}
   * - 2. 比较操作符
   *   free = {a: {$in: [1,2,3]}, b: {$gt: 1}}
   * - 3. 或条件
   *   free = {$or: [{a: 1}, {b: 1}]}
   * 以及上三种条件的组合
   *
   * @param params
   * @param out
   * @returns {Array}
   */
  static parseFree(params, out = {}) {

    const and = Object.keys(params).map(key => {

      const value = params[key];

      // 或条件，值必须为数组
      if (key === '$or') {
        return `(${value.map(item => Operator.parseFree(item, out)).join(' OR ')})`;
      }

      // 支持普通的比较操作
      if (mapping.isBasicType(value) || Array.isArray(value)) {
        const name = `${key}_${helper.randomGUID4()}`;
        out[name] = value;
        return Operator.getCompiler(key, '$eq', name);
      }

      // 比较操作符
      if (typeof value === 'object') {
        return Object.keys(value).map(k => {

          // free多层嵌套时，key有可能重复，所以给加个后缀
          const name = `${key}_${helper.randomGUID4()}`;

          // 如果值是Hash，那就递归解析值
          let v = value[k];
          if (mapping.isHash(v)) {
            v = Operator.parseFree(v, out);
          } else {
            out[name] = v;
          }


          if (k === '$or') {
            // 包含or条件，则递归
            return `(${v.map(item => Operator.parseFree(item, out)).join(' OR ')})`;
          }

          // 是操作符号，直接进行比较
          if (k.startsWith('$')) {
            return Operator.getCompiler(key, k, name);
          }

          // 普通的等号比较
          return Operator.getCompiler(k, '$eq', name);
        });
      }

      throw new error.parameter.ParamError('Core has not yet supported the free operator. ' + key);
    });

    // 多个条件时，用括号括起来
    return and.length > 1 ? `(${and.join(' AND ')})` : and.join(' AND ');
  }

  static getCompiler(key, operator, value) {

    switch (operator) {
      case '$eq':
        return `[${key}] = <%- condition.${value} %>`;
      case '$ne':
        return `[${key}] != <%- condition.${value} %>`;
      case '$gt':
        return `[${key}] > <%- condition.${value} %>`;
      case '$gte':
        return `[${key}] >= <%- condition.${value} %>`;
      case '$lt':
        return `[${key}] < <%- condition.${value} %>`;
      case '$lte':
        return `[${key}] <= <%- condition.${value} %>`;
      case '$regex':
        return `[${key}] LIKE <%- condition.${value} %>`;
      case '$in':
        return `[${key}] IN <%- condition.${value} %>`;
      case '$nin':
        return `[${key}] NOT IN <%- condition.${value} %>`;
      case '$exists':
        return `[${key}] IS NOT NULL`;
    }

    throw new error.parameter.ParamError('Core has not yet supported the operator.');
  }

  // 根据类型，将参数转换成SQL中使用的参数
  static parseParams(value) {

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
      return `'${Operator.escapeSql(value)}'`;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (Array.isArray(value)) {
      if (value.length <= 0) {
        return '(null)';
      }

      const list = value.map(item => Operator.parseParams(item)).join(',');
      return `(${list})`;
    }

    return `'${Operator.escapeSql(String(value))}'`;
  }

  static escapeSql(value) {
    return value.replace(/\'/g, "''");
  }

}

module.exports = Operator;