/**
 * @file lib/db/sqlserver/document.js
 */

'use strict';


const XML = require('xml2js')
  , async = require('async');

/**
 * 将数据库的结果集转换成JSON格式
 * @param rows
 * @param callback
 */
exports.parse = function (rows, callback) {

  // 处理行
  async.map(rows, (columns, done) => {

    // 处理列
    async.reduce(columns, {}, (memo, item, next) => {

      // xml类型的值，转换成json
      if (item.metadata.type.type === 'XML') {

        if (!item.value) {
          memo[item.metadata.colName] = item.value;
          return next(null, memo);
        }

        return new XML.Parser().parseString(item.value, (err, json) => {
          if (err) {
            return next(err);
          }

          memo[item.metadata.colName] = slim(json.root);
          next(err, memo);
        });
      }

      // 其他类型，原值返回
      memo[item.metadata.colName] = item.value;
      next(null, memo);

    }, done);

  }, callback);

};

exports.build = function () {

};

function slim(json) {

  // 基本类型的LIST，去掉element关键字
  if (Array.isArray(json.element)) {
    return json.element;
  }

  // TODO: MAP类型

  // TODO: 复杂的嵌套类型

  return json;
}