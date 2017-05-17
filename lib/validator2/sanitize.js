/**
 * @file 校验前处理
 * @author r2space@gmail.com
 * @module lib.validator.sanitize
 * @version 1.0.0
 */


"use strict";

var mpath     = require("mpath")
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

exports.numberFormat = function (data, option) {
  return numeral(data).format(option || '0,0.00');
};

exports.stringFormat = function (data, option) {
  return util.format(option || '%s', data);
};

exports.dateFormat = function (data, option) {

  if (_.isString(option)) {
    return moment(data).tz("UTC").format(option || 'YYYY/MM/DD');
  }

  option = option || {};
  return moment(data).tz(option.timezone || "UTC").format(option.format || 'YYYY/MM/DD');
};

exports.ltrim = function (data) {
  return _.str.ltrim(data);
};

exports.trim = function (data) {
  return _.str.trim(data);
};

exports.rtrim = function (data) {
  return _.str.rtrim(data);
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
