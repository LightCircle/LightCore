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

var mpath = require("mpath")
  , _ = require("underscore")
  , _str = require("underscore.string")
  , validator = require("validator")
  , async = require("async")
  , helper = require("../helper")
  , constant = require("../constant")
  , Model = require("../mongo/model")
  , parser = require("../mongo/type/objectid")
  , Error = require("../error")
  , error = new Error.parameter.ParamError()
  ;

/**
 * 支持的校验规则
 * @returns {*}
 */
exports.all = function () {

  return [
    {value: "required", name: "Common - Required", option: [], description: ""},
    {value: "contains", name: "Common - Contains", option: ["Data List"], description: ""},
    {value: "unique", name: "Common - Unique", option: ["Collection", "Field"], description: ""},
    {value: "exists", name: "Common - Exists", option: ["Collection", "Field"], description: ""},

    {value: "equals", name: "Compare - Equals", option: ["Compare To"], description: ""},
    {value: "range", name: "Compare - Range", option: ["Min", "Max"], description: ""},
    {value: "max", name: "Compare - Max", option: ["Compare To"], description: ""},
    {value: "min", name: "Compare - Min", option: ["Compare To"], description: ""},

    {value: "email", name: "Function - EMail", option: [], description: ""},
    {value: "hexcolor", name: "Function - HexColor", option: [], description: ""},
    {value: "ip", name: "Function - IP", option: ["[Version]"], description: "v4, v6"},
    {value: "url", name: "Function - URL", option: [], description: ""},

    {value: "after", name: "Date - After", option: ["[Compare To]"], description: ""},
    {value: "before", name: "Date - Before", option: ["[Compare To]"], description: ""},

    {value: "array", name: "Type - Is Array", option: [], description: ""},
    {value: "boolean", name: "Type - Is Boolean", option: ["[Strict]"], description: "strict: 1, true"},
    {value: "date", name: "Type - Is Date", option: ["[Format]"], description: ""},
    {value: "json", name: "Type - Is JSON", option: [], description: ""},
    {value: "number", name: "Type - Is Number", option: [], description: ""},
    {value: "string", name: "Type - Is String", option: [], description: ""},

    {value: "custom", name: "Custom", option: [], description: ""}
  ];
};


/**
 * 自定义校验方法
 * @param handler
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.custom = function (handler, rule, callback) {

  if (!check(handler.params, rule)) {
    return callback(undefined, {});
  }

  var self = this;

  if (rule.class) {

    var inject = helper.resolve(constant.PATH_CONTROLLER + "/" + rule.class), func;
    if (inject && rule.action) {
      func = inject[rule.action];
      if (func) {
        return func.call(self, handler, rule, function (err, result) {
          if (err) {
            return callback(error, result);
          }

          callback(undefined, {});
        });
      }
    }
  }

  callback(undefined, {});
};

/**
 * 必须
 * @param handler
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.required = function (handler, rule, callback) {

  var data = handler.params;

  if (!check(data, rule)) {
    return callback(undefined, {});
  }

  if (!isEmpty(mpath.get(rule.key, data))) {
    return callback(undefined, {});
  }

  callback(error, _.object([rule.name], [rule.message]));
};

/**
 * 检查值在指定的表里是否是唯一
 * @param handler
 * @param {object} rule
 * @param {string[]} rule.option - [0]表名 [1]字段名
 * @param callback
 */
exports.unique = function (handler, rule, callback) {

  var model = new Model(handler.domain, handler.code, rule.option[0])
    , field = rule.option.field
    , values = mpath.get(rule.key, handler.params);

  if (_.isUndefined(values)) {
    return callback();
  }

  values = _.isArray(values) ? values : [values];
  async.eachSeries(values, function (value, next) {

    model.count(_.extend(_.object([field], [value]), {valid: 1}), function (err, result) {
      if (err) {
        return callback(err);
      }

      if (result <= 0) {
        return next();
      }

      callback(error, {name: rule.name, message: rule.message, value: value});
    });
  }, callback);
};

/**
 * 检查指定的值是在表里存在, 不存在则错误
 * @param handler
 * @param {object} rule
 * @param {string} rule.domain
 * @param {string} rule.code
 * @param {string[]} rule.option - [0]表名 [1]字段名
 * @param callback
 */
exports.exists = function (handler, rule, callback) {

  var model = new Model(handler.domain, handler.code, rule.option.table)
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

// todo
exports.contains = function (handler, rule, callback) {

  var data = handler.params;

  if (!check(data, rule)) {
    return callback(undefined, {});
  }

  if (_.constant(rule.option, mpath.get(rule.key, data))) {
    return callback(undefined, {})
  }

  callback(error, _.object([rule.name], [rule.message]));
};


// todo date
exports.after = function (handler, rule, callback) {

  if (validator.isAfter(mpath.get(rule.key, handler.params), (rule.option || [])[0])) {
    return callback(undefined, {})
  }

  callback(error, _.object([rule.name], [rule.message]));
};

exports.before = function (handler, rule, callback) {

  if (validator.isBefore(mpath.get(rule.key, handler.params), (rule.option || [])[0])) {
    return callback(undefined, {})
  }

  callback(error, _.object([rule.name], [rule.message]));
};

// todo type
exports.date = function (data, rule, callback) {
  return callback(undefined, {})
};
exports.string = function (data, rule, callback) {
  return callback(undefined, {})
};
exports.number = function (data, rule, callback) {
  return callback(undefined, {})
};
exports.boolean = function (data, rule, callback) {
  return callback(undefined, {})
};
exports.array = function (data, rule, callback) {
  return callback(undefined, {})
};
exports.json = function (data, rule, callback) {
  return callback(undefined, {})
};

// todo compare
exports.equals = function (data, rule, callback) {
  return callback(undefined, {})
};
exports.min = function (data, rule, callback) {
  return callback(undefined, {})
};
exports.max = function (data, rule, callback) {
  return callback(undefined, {})
};

/**
 * 校验字符串长度范围
 *  TODO: 当数字时，需要比较数字的大小，画面提交上来的内容需要sanitize进行转换
 * @param handler
 * @param rule
 * @param callback
 * @returns {*}
 */
exports.range = function (handler, rule, callback) {

  var data = mpath.get(rule.key, handler.params)
    , min = rule.option[0]
    , max = rule.option[1];

  if (validator.isLength(data, min, max)) {
    return callback(undefined, {})
  }

  callback(error, _.object([rule.name], [rule.message]));
};

// todo functions
exports.email = function (data, rule, callback) {
  return callback(undefined, {})
};
exports.url = function (data, rule, callback) {
  return callback(undefined, {})
};
exports.ip = function (data, rule, callback) {
  return callback(undefined, {})
};
exports.hexcolor = function (data, rule, callback) {
  return callback(undefined, {})
};

/**
 * 判断是否为空
 * @param val
 * @returns {*}
 */
function isEmpty(val) {
  return _.isNull(val) || _.isUndefined(val) || _.isNaN(val) || _str.isBlank(val);
}

// /**
//  * 判断是否要进行校验
//  * @param object
//  * @param rule
//  * @returns {*}
//  */
// function check(object, rule) {
//
//   if (!rule.condition) {
//     return true;
//   }
//
//   var parameter = rule.condition.parameter
//     , value = rule.condition.value
//     , operator = rule.condition.operator
//     , data =  mpath.get(parameter, object);
//
//   if (_str.isBlank(parameter)) {
//     return true;
//   }
//   if (_str.isBlank(operator)) {
//     return true;
//   }
//
//   if (operator == "$eq") {
//     return data == value;
//   }
//   if (operator == "$ne") {
//     return data != value;
//   }
//   if (operator == "$in") {
//     return _.contains(value.split(","), data);
//   }
//   if (operator == "$nin") {
//     return !_.contains(value.split(","), data);
//   }
//
//   return true;
// }