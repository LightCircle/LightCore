/**
 * @file lib/db/sqlserver/document.js
 */

'use strict';


const XML    = require('xml2js')
  , async    = require('async')
  , ObjectID = require('mongodb').ObjectID
  , ROOT     = 'root'
  , ELEMENT  = 'element';

class Mapping {

  constructor() {
    this.builder = new XML.Builder({renderOpts: {pretty: false}, xmldec: {standalone: null, encoding: null}});
    this.parser = new XML.Parser({explicitArray: false});
  }

  /**
   * 将数据库的结果集转换成JSON格式
   * @param data
   * @param callback
   */
  parse(data, callback) {

    // 处理行
    async.map(data, (columns, done) => {

      // 处理列
      async.reduce(columns, {}, (memo, item, next) => {

        // XML类型的值，转换成JSON
        if (item.type === 'XML') {
          return this.unWrapXML(item.value, (err, json) => {
            memo[item.name] = json;
            next(null, memo);
          });
        }

        // 其他类型，原值返回
        memo[item.name] = item.value;
        next(null, memo);
      }, done);

    }, callback);

  };

  /**
   * 将LIST和MAP数据转换成XML
   * @param data
   */
  build(data) {

    Object.keys(data).forEach(key => {

      const value = data[key];

      if (Mapping.isBasicType(value)) {
        return;
      }

      if (Array.isArray(value)) {
        return data[key] = this.wrapXML(Mapping._listToElement(value));
      }

      if (typeof value === 'object') {
        return data[key] = this.wrapXML(Mapping._listToElement(value));
      }
    });

    return data;
  };

  static isBasicType(value) {

    if (typeof value === 'undefined' || value === null) {
      return true;
    }

    if (value instanceof ObjectID) {
      return true;
    }

    if (value instanceof Date) {
      return true;
    }

    return ['boolean', 'string', 'number'].includes(typeof value);
  }

  wrapXML(value, key = ROOT) {
    return this.builder.buildObject({[key]: value});
  }

  unWrapXML(data, callback) {

    if (typeof data === 'undefined' || data === null) {
      return callback(null, data);
    }

    this.parser.parseString(data, (err, json) => {
      if (err) {
        return callback(err);
      }

      if (json === null) {
        return callback();
      }

      callback(null, Mapping._elementToList(json[ROOT]));
    });

  }

  // 由于LIST不能直接转换成XML，所以把LIST类型的数据转换成对象 如：[1,2,3] => {element: [1,2,3]}
  static _listToElement(data) {

    // 递归遍历LIST，转换内容
    if (Array.isArray(data)) {
      return {
        [ELEMENT]: data.map(value => {
          if (Mapping.isBasicType(value)) {
            return value;
          }
          return Mapping._listToElement(value);
        })
      };
    }

    // 递归遍历MAP，转换内容
    Object.keys(data).map(key => {
      const value = data[key];
      if (Mapping.isBasicType(value)) {
        return;
      }

      data[key] = Mapping._listToElement(value);
    });

    return data;
  }

  // listToElement 方法的反转
  static _elementToList(data) {

    if (data[ELEMENT]) {
      data = data[ELEMENT];

      // XML转JSON, 当explicitArray 属性被设置时,
      // 数组值仅有一个项目的话，会被转换为值，{a: [1]} => {a: 1}
      // 因为 ELEMENT 项目肯定是数组，所以如果值不是数组那就套上数组
      if (!Array.isArray(data)) {
        data = [data];
      }
    }

    if (Mapping.isBasicType(data)) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(value => {
        if (Mapping.isBasicType(value)) {
          return value;
        }
        return Mapping._elementToList(value);
      });
    }

    Object.keys(data).map(key => {
      const value = data[key];
      if (!Mapping.isBasicType(value)) {
        data[key] = Mapping._elementToList(value);
      }
    });

    return data;
  }

}

module.exports = Mapping;
