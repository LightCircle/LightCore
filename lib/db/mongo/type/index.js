/**
 * @file mongo type
 * @author r2space@gmail.com
 * @module light.lib.mongo.type
 * @version 1.0.0
 */
"use strict";

var _ = require("underscore")
  , helper = require("../../../helper");


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
 * @desc 用指定的类型名进行类型转换
 *  如果是Array, Object, 则遍历所有元素进行转换
 * @param object 带转换的值
 * @param typeName 转换的类型名称
 * @param addition 转换参数，如timezone等
 * @returns {*}
 */
exports.parse = function (object, typeName, addition) {

  if (_.isNull(object) || _.isUndefined(object)) {
    return object;
  }

  typeName = typeName.toLowerCase();

  var type = helper.resolve(typeName, __dirname + "/");
  if (_.isUndefined(type)) {
    return object;
  }

  if (_.isArray(object) && typeName !== "array") {
    _.each(object, function (obj, index) {
      object[index] = type.dataParse(obj, typeName, addition);
    });
  } else {
    object = type.dataParse(object, typeName, addition);
  }

  return object;
};

/**
 * 更新系的类型转换
 * @param object
 * @param option
 * @param addition 转换参数，如timezone等
 * @returns {*}
 */
exports.dataParse = function (object, option, addition) {

  if (_.isNull(object) || _.isUndefined(object)) {
    return object;
  }

  var typeObj = exports.types(option);

  var type = helper.resolve(typeObj.optionType, __dirname + "/");
  if (_.isUndefined(type)) {
    return object;
  }

  if (_.isArray(object) && typeObj.optionType !== "array") {
    _.each(object, function (obj, index) {
      object[index] = type.dataParse(obj, typeObj.contentsType, addition);
    });
  } else {
    object = type.dataParse(object, typeObj.contentsType, addition);
  }

  return object;
};

/**
 * 查询系的类型转换
 * @param object
 * @param option
 * @param addition 转换参数，如timezone等
 * @returns {*}
 */
exports.queryParse = function (object, option, addition) {

  if (_.isNull(object) || _.isUndefined(object)) {
    return object;
  }

  var typeObj = exports.types(option);

  var type = helper.resolve(typeObj.optionType, __dirname + "/");
  if (_.isUndefined(type)) {
    return object;
  }

  if (_.isArray(object) && typeObj.optionType !== "array") {
    _.each(object, function (obj, index) {
      object[index] = type.queryParse(obj, typeObj.contentsType, addition);
    });
  } else {
    object = type.queryParse(object, typeObj.contentsType, addition);
  }

  return object;
};

/**
 * 根据类型定义获取optionType和contentsType的小写字符串
 * @param option
 * @returns {{optionType: *, contentsType: *}}
 */
exports.types = function (option) {

  if (_.isString(option)) {
    return {optionType: option};
  }

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
};

exports.isBlank = function (str) {
  if (typeof str === 'undefined' || str === null || Number.isNaN(str)) {
    return true;
  }

  return (/^\s*$/).test(str);
};
