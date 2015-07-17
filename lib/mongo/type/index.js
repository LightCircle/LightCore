/**
 * @file mongo type
 * @author r2space@gmail.com
 * @module light.framework.mongo.type
 * @version 1.0.0
 */
"use strict";

var _ = require("underscore")
  , helper = require("../../helper");


/**
 * 基础类型合集
 */
exports.dataTypes = [
  "number",
  "string",
  "boolean",
  "date",
  "objectid",
  "regexp",
  "object",
  "array"
];

/**
 * 更新系的类型转换
 * @param object
 * @param option
 * @returns {*}
 */
exports.dataParse = function (object, option) {

  if (_.isNull(object) || _.isUndefined(object)) {
    return object;
  }

  var typeObj = types(option);

  var type = helper.resolve(typeObj.optionType, __dirname + "/");
  if (_.isUndefined(type)) {
    return object;
  }

  if (_.isArray(object) && typeObj.optionType !== "array") {
    _.each(object, function (obj, index) {
      object[index] = type.dataParse(obj, typeObj.contentsType);
    });
  } else {
    object = type.dataParse(object, typeObj.contentsType);
  }

  return object;
};

/**
 * 查询系的类型转换
 * @param object
 * @param option
 * @returns {*}
 */
exports.queryParse = function (object, option) {

  if (_.isNull(object) || _.isUndefined(object)) {
    return object;
  }

  var typeObj = types(option);

  var type = helper.resolve(typeObj.optionType, __dirname + "/");
  if (_.isUndefined(type)) {
    return object;
  }

  if (_.isArray(object) && typeObj.optionType !== "array") {
    _.each(object, function (obj, index) {
      object[index] = type.queryParse(obj, typeObj.contentsType);
    });
  } else {
    object = type.queryParse(object, typeObj.contentsType);
  }

  return object;
};

/**
 * 根据类型定义获取optionType和contentsType的小写字符串
 * @param option
 * @returns {{optionType: *, contentsType: *}}
 */
function types(option) {

  var optionType = option.type
    , contentsType = option.contents;

  // 将type是Function的转成小写的字符串
  if (option instanceof Function) {
    optionType = option.name;
  }
  if (option.type instanceof Function) {
    optionType = option.type.name;
  }
  optionType = optionType.toLowerCase();

  // 将contents是Function的转成小写的字符串，否则不变
  if (contentsType instanceof Function) {
    contentsType = contentsType.name;
  }
  if (!_.isUndefined(contentsType) && _.isString(contentsType)) {
    contentsType = contentsType.toLowerCase();
  }

  return {
    optionType: optionType, contentsType: contentsType
  };
}