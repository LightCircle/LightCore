/**
 * @file 验证, 依赖validator模块
 * @author r2space@gmail.com
 * @module lib.validator.index
 * @version 1.0.0
 */

"use strict";

const _       = require("underscore")
  , async     = require("async")
  , constant  = require("../constant")
  , cache     = require("../cache")
  , log       = require("../log")
  , rule      = require("./rule")
  , sanitize  = require("./sanitize")
  , Error     = require("../error")
  , error     = new Error.parameter.ParamError()
  ;


module.exports = {

  rule: rule,
  sanitize: sanitize,

  /**
   * 格式化数据
   */
  format: function (val, sanitation, callback) {
    const func = sanitize[sanitation.rule];
    if (func) {
      val = func.call(this, val, sanitation.option);
      if (callback) {
        callback(undefined, val);
      }
      return val;
    }

    if (callback) {
      callback(undefined, val);
    }
    return val;
  },

  /**
   * 校验
   * @param handler
   * @param group 可选 指定特定的校验组进行校验
   * @param callback
   */
  isValid: function (handler, group, callback) {

    if (_.isFunction(group)) {
      callback = group;
      group = undefined;
    }

    const validation = cache.get(constant.SYSTEM_DB_VALIDATOR).filter(item => {
      return item.group === (group || handler.req.path);
    });

    async.mapSeries(validation, (item, next) => {

      const func = rule[item.rule];
      if (func) {
        return func.call(this, handler, item, next);
      }

      log.debug("Rule does not define : " + item.rule);
      next();
    }, (err, result) => {
      if (err) {
        return callback(err, result);
      }

      result = _.compact(_.flatten(result));
      if (_.isEmpty(result)) {
        return callback();
      }

      log.error(result);
      callback(error, result);
    });
  },

  /**
   * 所有built-in的校验方法
   * @returns {*}
   */
  all: function() {
    return {
      rule: rule.all(),
      sanitize: sanitize.all()
    };
  }
};
