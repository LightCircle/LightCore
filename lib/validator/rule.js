/**
 * @file 详细的校验规则
 *
 *  依赖三个外部模块的校验
 *   - validator的校验方法 参见 https://github.com/chriso/validator.js
 *   - underscore的校验方法
 *
 * @author r2space@gmail.com
 * @module lib.validator.rule
 * @version 1.0.0
 */


'use strict';

const _       = require('underscore')
  , validator = require('validator')
  , helper    = require('../helper')
  , constant  = require('../constant')
  , Model     = require('../db/mongo/model')
  , parser    = require('../db/mongo/type/objectid')
  ;


/**
 * 必须, 判断给定的值是否存在
 * @param handler
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.required = function (handler, rule, callback) {

  if (!isEmpty(helper.get(handler.params, rule.key))) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message});
};

/**
 * 检查值在指定的表里是否是唯一
 * @param handler
 * @param {object} rule
 * @param callback
 */
exports.unique = function (handler, rule, callback) {

  if (prepare(handler, rule)) {
    return callback();
  }

  fetchCount(handler, rule, (err, count) => {
    if (err) {
      return callback(err);
    }

    if (count <= 0) {
      return callback();
    }

    callback(null, {name: rule.name, message: rule.message, value: helper.get(handler.params, rule.key)});
  });
};

/**
 * 检查指定的值是在表里存在, 不存在则错误, 支持数组格式的数据
 * @param {function} handler
 * @param {object} rule
 * @param callback
 */
exports.exists = function (handler, rule, callback) {

  if (prepare(handler, rule)) {
    return callback();
  }

  fetchCount(handler, rule, (err, count) => {
    if (err) {
      return callback(err);
    }

    if (count > 0) {
      return callback();
    }

    callback(null, {name: rule.name, message: rule.message, value: helper.get(handler.params, rule.key)});
  });
};

/**
 * 给定的数值在检查用列表里存在
 * @param handler
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.in = function (handler, rule, callback) {

  const val = helper.get(handler.params, rule.key);
  if (_.contains(rule.option, val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.nin = function (handler, rule, callback) {

  const val = helper.get(handler.params, rule.key);
  if (!_.contains(rule.option, val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

/**
 * after
 * @param handler
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.after = function (handler, rule, callback) {

  const val = helper.get(handler.params, rule.key);
  if (validator.isAfter(val, rule.option)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

/**
 * before
 * @param handler
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.before = function (handler, rule, callback) {

  const val = helper.get(handler.params, rule.key);
  if (validator.isBefore(val, rule.option)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

/**
 * validator type check : date
 * @param data
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.date = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key);
  if (validator.isDate(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.numeric = function (handler, rule, callback) {

  if (prepare(handler, rule)) {
    return callback();
  }

  const val = helper.get(handler.params, rule.key);

  if (validator.isNumeric(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};


function prepare(handler, rule) {

  // 非严格模式
  if (rule.strict === false) {

    const val = helper.get(handler.params, rule.key);

    if (typeof val === 'undefined' || val === null || val === '') {
      return true;
    }
  }

  // 条件校验
  if (rule.condition.key) {

    const param = helper.get(handler.params, rule.condition.key)
      , value = rule.condition.parameter;

    switch (rule.condition.operator) {
      case '$eq':
        return param === value;
      case '$ne':
        return param !== value;
      case '$gt':
        return param > value;
      case '$gte':
        return param >= value;
      case '$lt':
        return param < value;
      case '$lte':
        return param <= value;
    }
  }

  return false;
}

exports.boolean = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key);
  if (validator.isBoolean(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.json = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key);
  if (validator.isJSON(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

/**
 * underscore validator : array
 * @param data
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.array = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key);
  if (_.isArray(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.string = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key);
  if (_.isString(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

/**
 * compare: equals
 * @param data
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.equals = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key);
  if (val == rule.option) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.min = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key);
  if (val < rule.option) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.max = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key);
  if (val > rule.option) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

/**
 * 校验字符串长度范围
 * @param handler
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.range = function (handler, rule, callback) {
  const val = helper.get(handler.params, rule.key)
    , min = rule.option[0]
    , max = rule.option[1];

  if (validator.isLength(val, min, max)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.email = function (handler, rule, callback) {

  if (prepare(handler, rule)) {
    return callback();
  }

  const val = helper.get(handler.params, rule.key);
  if (validator.isEmail(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.url = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key);
  if (validator.isURL(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.ip = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key)
    , version = rule.option || 4;

  if (validator.isIP(val, version)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.hexcolor = function (data, rule, callback) {
  const val = helper.get(handler.params, rule.key);
  if (validator.isHexColor(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.matches = function (handler, rule, callback) {
  if (prepare(handler, rule)) {
    return callback();
  }

  const val = helper.get(handler.params, rule.key);

  if (new RegExp(rule.option).test(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};


/**
 * 判断是否为空
 * @param val
 * @returns {*}
 */
function isEmpty(val) {
  return _.isNull(val) || _.isUndefined(val) || _.isNaN(val) || helper.isBlank(val);
}


function fetchCount(handler, rule, callback) {

  const domain = handler.domain || process.env.APPNAME
    , code = handler.code || constant.DEFAULT_TENANT;

  // 为了不依赖api的定义，这里直接使用model操作数据库
  const db = handler.db || {}
    , model = new Model(domain, handler.code, rule.option.schema, {user: db.user, pass: db.pass});

  // 变换成条件，如果参数名为_id，转换为ObjectID
  const condition = rule.option.conditions.reduce((pre, cur) => {

    let value = cur.value;
    if (value[0] === '$') {
      value = helper.get(handler.params, value.substr(1));
      value = (cur.parameter === '_id') ? parser.dataParse(value) : value;
    }

    // 如果值是数组类型的，使用 $in 操作符
    return Object.assign(pre, {[cur.parameter]: Array.isArray(value) ? {'$in': value} : value});
  }, {valid: 1});

  model.count(condition, callback);
}

