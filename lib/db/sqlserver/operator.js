/**
 *
 */

'use strict';

const moment = require('moment')
  , ObjectID = require('mongodb').ObjectID
  , CONST    = require('../../constant')
  , error    = require('../../error')
  , helper   = require('../../helper')
  , cache    = require('../../cache')
  , Type     = require('./type')
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
        return Operator.getCompiler({key: key, operator: '$eq', parameter: name});
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
            return Operator.getCompiler({key: key, operator: k, parameter: name});
          }

          // 普通的等号比较
          return Operator.getCompiler({key: k, operator: '$eq', parameter: name});
        });
      }

      throw new error.parameter.ParamError('Core has not yet supported the free operator. ' + key);
    });

    // 多个条件时，用括号括起来
    return and.length > 1 ? `(${and.join(' AND ')})` : and.join(' AND ');
  }

  // 生成比较条件，仅支持部分比较操作符
  static getCompiler(compiler, schema, params) {

    const define = Operator._getXmlColumnDefine(schema, compiler.key);
    if (define) {
      return Operator.getXmlCompiler(define, compiler, params);
    }

    switch (compiler.operator) {
      case '$eq':
        return `[${compiler.key}] = <%- condition.${compiler.parameter} %>`;
      case '$ne':
        return `[${compiler.key}] != <%- condition.${compiler.parameter} %>`;
      case '$gt':
        return `[${compiler.key}] > <%- condition.${compiler.parameter} %>`;
      case '$gte':
        return `[${compiler.key}] >= <%- condition.${compiler.parameter} %>`;
      case '$lt':
        return `[${compiler.key}] < <%- condition.${compiler.parameter} %>`;
      case '$lte':
        return `[${compiler.key}] <= <%- condition.${compiler.parameter} %>`;
      case '$regex':
        return `[${compiler.key}] LIKE <%- condition.${compiler.parameter} %>`;
      case '$in':
        return `[${compiler.key}] IN <%- condition.${compiler.parameter} %>`;
      case '$nin':
        return `[${compiler.key}] NOT IN <%- condition.${compiler.parameter} %>`;
      case '$exists':
        return `[${compiler.key}] IS NOT NULL`;
    }

    throw new error.parameter.ParamError('Core has not yet supported the operator.');
  }

  // 生成XQuery的比较条件，仅支持部分比较操作符
  static getXmlCompiler(define, compiler, params) {

    // XML查询，需要对参数类型进行一次转换
    if (Array.isArray(params.condition[compiler.parameter])) {
      params.condition[compiler.parameter] = params.condition[compiler.parameter].map(item => {
        return new Type.XPathString(item);
      });
    }

    if (typeof params.condition[compiler.parameter] === 'string') {
      params.condition[compiler.parameter] = new Type.XPathString(params.condition[compiler.parameter]);
    }

    const [top, second] = compiler.key.split('.');

    // 转换成XPath查询
    switch (compiler.operator) {
      case '$eq':
        return `[${top}].exist('/root/element${second ? '/' + second : ''}[text()=<%- condition.${compiler.parameter} %>]') = 1`;
      case '$ne':
        return `[${top}].exist('/root/element${second ? '/' + second : ''}[not(text()=<%- condition.${compiler.parameter} %>)]') = 1`;
      case '$gt':
        return `[${top}].exist('/root/element${second ? '/' + second : ''}[text()><%- condition.${compiler.parameter} %>]') = 1`;
      case '$gte':
        return `[${top}].exist('/root/element${second ? '/' + second : ''}[text()>=<%- condition.${compiler.parameter} %>]') = 1`;
      case '$lt':
        return `[${top}].exist('/root/element${second ? '/' + second : ''}[text()<<%- condition.${compiler.parameter} %>]') = 1`;
      case '$lte':
        return `[${top}].exist('/root/element${second ? '/' + second : ''}[text()<=<%- condition.${compiler.parameter} %>]') = 1`;
      case '$regex':
        return `[${top}].exist('/root/element${second ? '/' + second : ''}[contains(., <%- condition.${compiler.parameter} %>)]') = 1`;
      case '$in':
        return `[${top}].exist('/root/element${second ? '/' + second : ''}[text()=<%- condition.${compiler.parameter} %>]') = 1`;
      case '$nin':
        return `[${top}].exist('/root/element${second ? '/' + second : ''}[not(text()=<%- condition.${compiler.parameter} %>)]') = 1`;
      case '$exists':
        return `[${top}].exist('/root/element${second ? '/' + second : ''}[not(text()="")]') = 1`;
    }

    throw new error.parameter.ParamError('Core has not yet supported the operator.');
  }

  // 根据类型，将参数转换成SQL中使用的参数
  static parseParams(value) {

    if (typeof value === 'undefined' || value === null) {
      return 'null';
    }

    if (value instanceof Date) {
      return `'${moment.tz(value, 'UTC').format('YYYY-MM-DD HH:mm:ss.SSS')}'`;
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

    // XML查询的字符串参数需要使用双引号引起来，所以使用了自定义类型
    if (value instanceof Type.XPathString) {
      return `"${value.value}"`;
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

  static _getXmlColumnDefine(schema, column) {

    if (!schema) {
      return null;
    }

    const struct = cache.get(CONST.SYSTEM_DB_STRUCTURE).find(item => item.schema === schema);
    if (!struct) {
      return null;
    }

    const [top] = column.split('.'), define = struct.items[top];
    if (!define) {
      return null;
    }

    if (define.type === 'Object' || define.type === 'Array') {
      return define;
    }

    return null;
  }

}

module.exports = Operator;