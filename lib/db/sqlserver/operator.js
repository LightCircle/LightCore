/**
 *
 */

'use strict';

const moment = require('moment')
  , ObjectID = require('mongodb').ObjectID
  , error    = require('../../error')
  , mapping  = require('./mapping')

;

class Operator {

  constructor() {
  }

  static parseFree(params) {

    return Object.keys(params).map(key => {

      const value = params[key];

      if (key.startsWith('$')) {
        throw new error.parameter.ParamError('Core has not yet supported the free operator. ' + key);
      }

      if (mapping.isBasicType(value)) {
        return Operator.getCompiler(key, '$eq', value);
      }

      if (Array.isArray(value)) {
        return Operator.getCompiler(key, '$eq', value);
      }

      if (typeof value === 'object') {
        if (value['$in']) {
          params[key] = value['$in'];
          return Operator.getCompiler(key, '$in', key);
        }
      }

      throw new error.parameter.ParamError('Core has not yet supported the free operator. ' + key);
    });

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

    if (typeof value === 'object') {
      // TODO: Map
    }

    return `'${Operator.escapeSql(String(value))}'`;
  }

  static escapeSql(value) {
    return value.replace(/\'/g, "''");
  }

}

module.exports = Operator;