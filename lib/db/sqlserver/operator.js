/**
 *
 */

'use strict';

const _      = require('lodash')
  , moment   = require('moment')
  , ObjectID = require('mongodb').ObjectID
  , CONST    = require('../../constant')
  , error    = require('../../error')
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
   * @param schema
   * @param out
   * @returns {Array}
   */
  static parseFree(params, schema, out) {

    let and = Object.keys(params).map(key => {

      const value = params[key];

      // 或条件，值必须为数组 {$of: [{valid: 1}, {valid: 2}]}
      if (key === '$or') {
        return `(${value.map(item => Operator.parseFree(item, schema, out)).join(' OR ')})`;
      }

      // 支持普通的比较操作 {valid: 1}
      if (mapping.isBasicType(value)) {
        _.set(out.condition, key, value);
        return Operator.getCompiler({key: key, operator: '$eq', parameter: key}, schema, out);
      }

      // 支持数组的比较操作 {section: [1, 2]}
      if (Array.isArray(value)) {

        // 数组值为空，那么忽略这个条件
        if (value.length >= 0) {
          _.set(out.condition, key, value);
          return Operator.getCompiler({key: key, operator: '$eq', parameter: key}, schema, out);
        }
        return;
      }

      // 处理比较操作符 {valid: {$ne: 1}, section: {$in: [1, 2]}}
      if (typeof value === 'object') {
        return Object.keys(value).map(k => {

          let v = value[k];

          // 如果值是数组，并且数组值为空，那么忽略这个条件
          if (Array.isArray(v) && v.length <= 0) {
            return;
          }

          // 如果值是Hash，那就递归解析值
          if (mapping.isHash(v)) {
            v = Operator.parseFree(v, schema, out);
          } else {
            _.set(out.condition, key, v); // 把值保存到condition中
          }

          // 包含or条件，则递归
          if (k === '$or') {
            return `(${v.map(item => Operator.parseFree(item, schema, out)).join(' OR ')})`;
          }

          // 是操作符号，直接进行比较
          if (k.startsWith('$')) {
            return Operator.getCompiler({key: key, operator: k, parameter: key}, schema, out);
          }

          // 普通的等号比较
          return Operator.getCompiler({key: k, operator: '$eq', parameter: key}, schema, out);
        });
      }

      throw new error.parameter.ParamError('Core has not yet supported the free operator. ' + key);
    });

    // 去除空的条件
    and = and.filter(item => {
      if (Array.isArray(item)) {
        return item.filter(i => typeof i === 'undefined').length <= 0;
      }
      return item;
    });

    // 多个条件时，用括号括起来
    return and.length > 1 ? `(${and.join(' AND ')})` : and.join(' AND ');
  }

  // 生成比较条件，仅支持部分比较操作符
  static getCompiler(compiler, schema, params) {

    const define = Operator._getXmlColumnDefine(schema, compiler.key);
    if (define) {
      return Operator._getXmlCompiler(define, compiler, params);
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
  static _getXmlCompiler(define, compiler, params) {

    const key = compiler.parameter
      , val   = _.get(params.condition, key);

    // XML查询，需要对参数类型进行一次转换
    if (Array.isArray(val)) {
      _.set(params.condition, key,
        val.map(item => {
          return new Type.XPathString(item);
        })
      );
    }

    if (typeof val === 'string') {
      _.set(params.condition, key, new Type.XPathString(val));
    }

    if (typeof val === 'boolean') {
      _.set(params.condition, key, new Type.XPathBoolean(val));
    }

    const [top, second] = compiler.key.split('.')
      , element         = define.type === 'Object' ? '' : '/element';

    // 转换成XPath查询
    switch (compiler.operator) {
      case '$eq':
        return `[${top}].exist('/root${element}${second ? '/' + second : ''}[text()=<%- condition.${key} %>]') = 1`;
      case '$ne':
        return `[${top}].exist('/root${element}${second ? '/' + second : ''}[not(text()=<%- condition.${key} %>)]') = 1`;
      case '$gt':
        return `[${top}].exist('/root${element}${second ? '/' + second : ''}[text()><%- condition.${key} %>]') = 1`;
      case '$gte':
        return `[${top}].exist('/root${element}${second ? '/' + second : ''}[text()>=<%- condition.${key} %>]') = 1`;
      case '$lt':
        return `[${top}].exist('/root${element}${second ? '/' + second : ''}[text()<<%- condition.${key} %>]') = 1`;
      case '$lte':
        return `[${top}].exist('/root${element}${second ? '/' + second : ''}[text()<=<%- condition.${key} %>]') = 1`;
      case '$regex':
        return `[${top}].exist('/root${element}${second ? '/' + second : ''}[contains(., <%- condition.${key} %>)]') = 1`;
      case '$in':
        return `[${top}].exist('/root${element}${second ? '/' + second : ''}[text()=<%- condition.${key} %>]') = 1`;
      case '$nin':
        return `[${top}].exist('/root${element}${second ? '/' + second : ''}[not(text()=<%- condition.${key} %>)]') = 1`;
      case '$exists':
        return `[${top}].exist('/root${element}${second ? '/' + second : ''}[not(text()="")]') = 1`;
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
    if (value instanceof Type.XPathString || value instanceof Type.XPathBoolean) {
      return `"${value.value}"`;
    }

    // 数组型，遍历转换
    if (Array.isArray(value)) {
      if (value.length <= 0) {
        return '(null)';
      }

      const list = value.map(item => Operator.parseParams(item)).join(',');
      return `(${list})`;
    }

    // Hash型，递归转换
    if (typeof value === 'object') {
      Object.keys(value).forEach(item => {
        value[item] = Operator.parseParams(value[item]);
      });
      return value;
    }

    return `'${Operator.escapeSql(String(value))}'`;
  }

  static escapeSql(value) {
    return value.replace(/\'/g, "''");
  }

  // 获取XML字段对应的的字段定义
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