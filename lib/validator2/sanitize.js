/**
 * @file 校验前处理
 * @author r2space@gmail.com
 * @module lib.validator.sanitize
 * @version 1.0.0
 */


"use strict";

const mpath   = require("mpath")
  , _         = require("underscore")
  , validator = require("validator")
  , moment    = require("moment-timezone")
  , numeral   = require("numeral")
  ;

exports.all = function () {

  return [
    {value: "ltrim", name: "Left trim", description: ""},
    {value: "trim", name: "Trim", description: ""},
    {value: "rtrim", name: "Right trim", description: ""},
    {value: "toBoolean", name: "To boolean", description: ""},
    {value: "toDate", name: "To date", description: ""},
    {value: "toNumber", name: "To number", description: ""},
    {value: "toString", name: "To string", description: ""},
    {value: "escape", name: "Escape", description: ""},
    {value: "unEscape", name: "Un escape", description: ""},

    {value: "numberFormat", name: "Format number", option: ["[Format]"], description: ""},
    {value: "dateFormat", name: "Format date", option: ["[Format]"], description: ""},
    {value: "stringFormat", name: "Format string", option: ["[Format]"], description: ""},

    {value: "join", name: "Array to string", option: "", description: ""},
    {value: "split", name: "String to array", option: "", description: ""},
    {value: "fix", name: "Fix value", option: "", description: ""}

  ];
};

/**
 * 将字符串分隔成数组
 * @param data
 * @param option
 * @returns {*}
 */
exports.split = function (data, option) {

  // 只对字符串类型进行处理
  if (typeof data !== 'string') {
    return data;
  }

  // 分隔符
  option = option || ',';
  return data.split(option);
};

/**
 * 数组合并成字符串
 * @param data
 * @param option
 * @returns {*}
 */
exports.join = function (data, option) {

  // 只对数组类型进行处理
  if (!Array.isArray(data)) {
    return data;
  }

  // 分隔符
  option = option || ',';
  return data.join(option);
};

/**
 * 用固定值替换
 * @param data
 * @param option
 * @returns {*}
 */
exports.fix = function (data, option) {
  return option;
};

/**
 * 进行字符串变化
 * option的值为 '1:男, 2:女'，如果给定的option不满足该格式那么不进行转换
 * @param data
 * @param option
 * @returns {*}
 */
exports.mapping = function (data, option) {

  if (!option) {
    return data;
  }

  let pair = option.split(','), result = data;
  pair.forEach(item => {
    const object = item.split(':');
    if (object.length < 2) {
      return;
    }

    const key = object[0].trim()
      , val = object[1].trim();

    if (String(data) === key) {
      result = val;
    }
  });

  return result;
};


exports.numberFormat = function (data, option) {
  return numeral(data).format(option || '0,0.00');
};

exports.stringFormat = function (data, option) {
  return util.format(option || '%s', data);
};

exports.dateFormat = function (data, option) {
  if (!data) {
    return data;
  }

  // 没有指定格式
  if (!option) {
    return moment(data).tz("UTC").format('YYYY-MM-DD');
  }

  // option为字符串
  if (typeof option === 'string') {

    // 尝试解析timezone
    const zone = option.substr(-5);
    if (zone && zone.match(/[+|-]\d+/)) {
      return moment(data).utcOffset(zone).format(option.substr(0, option.length - 5));
    }

    // 没有timezone信息，不设置timezone
    return moment(data).tz("UTC").format(option);
  }

  // option为对象
  option = option || {};
  return moment(data).tz(option.timezone || "UTC").format(option.format || 'YYYY-MM-DD');
};

exports.ltrim = function (data) {
  if (!data || typeof data !== 'string') {
    return data;
  }

  return data.trimLeft();
};

exports.trim = function (data) {
  if (!data || typeof data !== 'string') {
    return data;
  }

  return data.trim();
};

exports.rtrim = function (data) {
  if (!data || typeof data !== 'string') {
    return data;
  }

  return data.trimRight();
};

exports.toBoolean = function (data) {
  return data !== "0" && data !== "false" && data !== "";
};

exports.toDate = function (data) {
  return moment(data).toDate();
};

exports.toNumber = function (data) {
  return Number(data);
};

exports.toString = function (input) {
  if (typeof input === 'object' && input !== null && input.toString) {
    input = input.toString();
  } else if (input === null || typeof input === 'undefined' || (isNaN(input) && !input.length)) {
    input = '';
  } else if (typeof input !== 'string') {
    input += '';
  }
  return input;
};

exports.escape = function (data) {
  return _.escape(data);
};

exports.unEscape = function (data) {
  return _.unescape(data);
};
