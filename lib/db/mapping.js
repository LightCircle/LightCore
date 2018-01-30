/**
 * @file lib/db/mapping.js
 */

'use strict';

const ObjectID = require('mongodb').ObjectID
  , moment     = require('moment')
  , type       = require('./mongo/type')
  , operator   = require('./mongo/operator');

class Mapping {

  constructor() {
  }

  static isBasicType(value) {

    if (typeof value === 'undefined' || value === null) {
      return true;
    }

    if (value instanceof ObjectID) {
      return true;
    }

    if (value instanceof moment) {
      return true;
    }

    if (value instanceof RegExp) {
      return true;
    }

    if (value instanceof Date) {
      return true;
    }

    return ['boolean', 'string', 'number'].includes(typeof value);
  }

  static isHash(value) {
    if (Mapping.isBasicType(value)) {
      return false;
    }
    if (Array.isArray(value)) {
      return false;
    }
    return typeof value === 'object';
  }

  /**
   * 根据定义把定义里面定义了default值将没有包含的项补上
   * @param object 待转换的值
   * @param define 数据定义
   * @param addition 处理数据是使用的附加项，如timezone信息等
   */
  setDefaults(object, define, addition) {
    if (!define || !object) {
      return object;
    }

    if (Array.isArray(object)) {
      object.forEach(item => {
        this._setDefaults(item, define, addition);
      });
    } else {
      this._setDefaults(object, define, addition);
    }

    return object;
  }

  _setDefaults(object, define, addition) {

    Object.keys(define).forEach(key => {

      // 该项没有值，且定义有default的情况，添加该项值为默认值
      if (typeof define[key].default !== 'undefined' && typeof object[key] === 'undefined') {
        object[key] = type.dataParse(define[key].default, define[key], addition);
      }

      // 处理没有子文档的情况
      if (!define[key].contents) {
        return;
      }

      // 如果是数组的情况，需要遍历查看
      if (define[key].type === 'Array') {

        // 需要值中包含数组，才对这些数组进行缺省值设定操作
        if (!object[key]) {
          return;
        }

        Array.isArray(object[key]) || (object[key] = [object[key]]);
        if (object[key].length <= 0) {
          return;
        }

        object[key] = object[key].map(item => {
          return this.setDefaults(item, define[key].contents);
        });
      }

      // 如果是对象
      if (define[key].type === 'Object') {
        object[key] = this.setDefaults(object[key], define[key].contents);
      }
    });
  }

  /**
   * 更新系数据类型转换
   * @param object
   * @param define
   * @param addition
   * @returns {*}
   */
  dataParse(object, define, addition) {

    if (!define) {
      return object;
    }

    if (Array.isArray(object)) {
      object.forEach(item => {
        this._dataParse(item, define, addition);
      });
    } else {
      this._dataParse(object, define, addition);
    }

    return object;
  };

  /**
   * 查询系数据类型转换
   * @param object
   * @param define
   * @param addition
   * @returns {*}
   */
  queryParse(object, define, addition) {

    if (!define) {
      return object;
    }

    if (Array.isArray(object)) {
      object.forEach(item => {
        this._dataParse(item, define, addition, 'queryParse');
      });
    } else {
      this._dataParse(object, define, addition, 'queryParse');
    }

    return object;
  };

  _dataParse(object, define, addition, parseType = 'dataParse') {

    Object.keys(object).forEach(key => {

      // 利用操作符对应的方法转换，如果没有找到操作符的定义则不做转换
      const hasMongoOperator = (/^\$.*/i).test(key);
      if (hasMongoOperator) {
        return object[key] = operator.parse(key, object[key], define, addition);
      }

      const option = this._findOption(key, define);

      // 删除没有定义的值
      if (!option.type) {
        return delete object[key];
      }

      // 没有数据，则不再进行转换
      if (typeof object[key] === 'undefined' || object[key] === null) {
        return;
      }

      // 如果object[key]的属性中有mongo操作符，则递归解析，option不变
      const containsMongoOperator = Object.keys(object[key]).find(item => (/^\$.*/i).test(item));
      if (typeof object[key] === 'object' && containsMongoOperator) {
        return this.dataParse(object[key], option, addition);
      }

      // 如果option.contents有值且不是基础类型，则递归解析
      if (option.contents && typeof option.contents === 'object') {
        object[key] = this.dataParse(object[key], option.contents, addition);
      } else {
        // 否则直接转换类型
        object[key] = type[parseType](object[key], option, addition);
      }
    });
  }

  /**
   * 根据key从数据定义中获取类型描述
   * @param key
   * @param define
   * @returns {*}
   */
  _findOption(key, define) {

    let option = undefined;

    // 如果是xxx.xx.x的形式，则取末端属性对应的类型
    if (key.includes('.')) {

      // 过滤掉数组索引，如 xxx.1.xx 中的1
      const keys = String(key).split('.').filter(item => !item.match(/^\d$/g));

      option = define[keys[0]] || {};
      keys.forEach((k, index) => {
        if (index > 0 && option.contents) {
          option = option.contents[k];
        }
      });
    } else {
      option = define[key]
    }

    return option || {};
  }
}

module.exports = Mapping;