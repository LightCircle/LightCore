/**
 * @file 详细的校验规则
 *
 *  依赖三个外部模块的校验
 *   - validator的校验方法 参见 https://github.com/chriso/validator.js
 *   - underscore的校验方法
 *   - underscore.string的校验方法
 *
 * @author r2space@gmail.com
 * @module lib.validator.rule
 * @version 1.0.0
 */


"use strict";

var mpath     = require("mpath")
  , _         = require("underscore")
  , _str      = require("underscore.string")
  , validator = require("validator")
  , async     = require("async")
  , helper    = require("../helper")
  , constant  = require("../constant")
  , Model     = require("../mongo/model")
  , parser    = require("../mongo/type/objectid")
  ;


/**
 * 必须, 判断给定的值是否存在
 * @param handler
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.required = function (handler, rule, callback) {

  if (!isEmpty(mpath.get(rule.key, handler.params))) {
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

  var db = handler.db || {}
    , model = new Model(handler.domain, handler.code, rule.option.table, {user: db.user, pass: db.pass})
    , value = mpath.get(rule.key, handler.params);

  if (_.isUndefined(value)) {
    return callback();
  }

  var condition = _.clone(rule.option.conditions);
  _.each(condition, function (val, key) {
    if (!(_.isString(val) && val.startsWith("$"))) {
      return;
    }
    condition[key] = (key == '_id') ? parser.dataParse(value) : value;
  });

  model.count(_.extend({valid: 1}, condition), function (err, result) {
    if (err) {
      return callback(err);
    }

    if (result <= 0) {
      return callback();
    }

    callback(null, {name: rule.name, message: rule.message, value: value});
  });
};

/**
 * 检查指定的值是在表里存在, 不存在则错误, 支持数组格式的数据
 * @param {function} handler
 * @param {object} rule
 * @param {string} rule.name    规则名称, 在系统中唯一, 程序中引用这个规则时使用
 * @param {string} rule.key     handler中数据保存的路径, 对这个路径的值进行校验
 * @param {string} rule.rule    规则 exists, unique 等
 * @param {string} rule.message 检查错误时的消息
 * @param {string} rule.option  规则检查时, 需要指定的额外的参数
 * @param {string} rule.option.table
 * @param {string} rule.option.conditions
 * @param callback
 */
exports.exists = function (handler, rule, callback) {

  var db = handler.db || {}
    , model = new Model(handler.domain, handler.code, rule.option.table, {user: db.user, pass: db.pass})
    , values = mpath.get(rule.key, handler.params);

  if (_.isUndefined(values)) {
    return callback(undefined, {name: rule.name, message: rule.message, value: undefined});
  }

  // 对应数组格式的数据的检查
  values = _.isArray(values) ? values : [values];
  async.mapSeries(values, function (value, next) {

    var condition = _.clone(rule.option.conditions);

    // 校验定义 conditions 里定义的参照变量是以 '$' 开头的, 这里提取参照变量的实际值进行替换, 转换为mongodb的条件
    _.each(condition, function (val, key) {
      if (!(_.isString(val) && val.startsWith("$"))) {
        return;
      }

      if (val.substr(1) == rule.key) {
        // 这里, 对_id进行了类型转换, 应该使用model的类型自动转换功能
        condition[key] = (key == '_id') ? parser.dataParse(value) : value;
      } else {
        var ref = mpath.get(val.substr(1), handler.params);
        condition[key] = {$in: _.isArray(ref) ? ref : [ref]};
      }
    });

    // 获取件数
    model.count(_.extend({valid: 1}, condition), function (err, result) {
      if (err) {
        return next(err);
      }

      if (result > 0) {
        return next();
      }

      var original = handler.params.data._original[value] || value;
      next(null, {name: rule.name, message: rule.message, value: original});
    });
  }, function (err, result) {
    callback(err, result);
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

  var val = mpath.get(rule.key, handler.params);
  if (_.contains(rule.option, val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.nin = function (handler, rule, callback) {

  var val = mpath.get(rule.key, handler.params);
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

  var val = mpath.get(rule.key, handler.params);
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

  var val = mpath.get(rule.key, handler.params);
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
  var val = mpath.get(rule.key, handler.params);
  if (validator.isDate(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.numeric = function (handler, rule, callback) {

  const val = mpath.get(rule.key, handler.params);

  // TODO: 共通化
  if (rule.strict === false) {
    if (typeof val === 'undefined' || val === null || val === '') {
      return callback();
    }
  }

  if (validator.isNumeric(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.boolean = function (data, rule, callback) {
  var val = mpath.get(rule.key, handler.params);
  if (validator.isBoolean(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.json = function (data, rule, callback) {
  var val = mpath.get(rule.key, handler.params);
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
  var val = mpath.get(rule.key, handler.params);
  if (_.isArray(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.string = function (data, rule, callback) {
  var val = mpath.get(rule.key, handler.params);
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
  var val = mpath.get(rule.key, handler.params);
  if (val == rule.option) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.min = function (data, rule, callback) {
  var val = mpath.get(rule.key, handler.params);
  if (val < rule.option) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.max = function (data, rule, callback) {
  var val = mpath.get(rule.key, handler.params);
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
  var val = mpath.get(rule.key, handler.params)
    , min = rule.option[0]
    , max = rule.option[1];

  if (validator.isLength(val, min, max)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.email = function (data, rule, callback) {
  var val = mpath.get(rule.key, handler.params);
  if (validator.isEmail(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.url = function (data, rule, callback) {
  var val = mpath.get(rule.key, handler.params);
  if (validator.isURL(val)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.ip = function (data, rule, callback) {
  var val = mpath.get(rule.key, handler.params)
    , version = rule.option || 4;

  if (validator.isIP(val, version)) {
    return callback();
  }

  callback(undefined, {name: rule.name, message: rule.message, value: val});
};

exports.hexcolor = function (data, rule, callback) {
  var val = mpath.get(rule.key, handler.params);
  if (validator.isHexColor(val)) {
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
  return _.isNull(val) || _.isUndefined(val) || _.isNaN(val) || _str.isBlank(val);
}