/**
 * @file 从数据库中读取配置项<br>
 *  服务器启动时，调用一次load<br>
 *  当更新设定值时，也需要重新调用load，来更新缓存里的值
 * @module light.core.configuration
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var _ = require("underscore");

module.exports = {

  /**
   * @desc 加载配置项
   * @param {Object} data 设置的数据
   * @returns {Object} 返回嵌套格式的配置
   */
  load: function (data) {
    var self = this;

    // 保存设定到实例里
    _.each(data, function (item) {
      if (!item.type) {
        self[item.key] = dataParse(item.value, item.valueType);
        return;
      }
      if (!self[item.type]) {
        self[item.type] = {};
      }

      if (item.key.indexOf(".") == -1) {
        self[item.type][item.key] = dataParse(item.value, item.valueType);
        return;
      }

      // 支持嵌套多层的key
      var createNestedObject = function (obj, array) {
        if (array.length == 0) {
          return dataParse(item.value, item.valueType);
        }

        var key = array.splice(0, 1);
        if (_.isObject(obj[key])) {
          _.extend(obj[key], createNestedObject(obj[key], array));
        } else {
          obj[key] = createNestedObject({}, array);
        }

        return obj;
      };

      self[item.type] = createNestedObject(self[item.type], item.key.split("."));
    });
  }
};

function dataParse(value, type) {
  if (!type) {
    return value;
  }

  switch (type.toLowerCase()) {
    case "string":
      return String(value);
    case "number":
      if (_.isString(value)) {
        var val = value;
        value = Number(value);
        return _.isNaN(value) ? val : value;
      }
      return value;
    case "boolean":
      if (_.isString(value)) {
        return value !== 'false' && value !== '0';
      }
      if (_.isNumber(value)) {
        return value !== 0;
      }
      return value;
    default:
      return value;
  }
}
