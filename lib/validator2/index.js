/**
 * @file 验证, 依赖validator模块
 * @author r2space@gmail.com
 * @module lib.validator.index
 * @version 1.0.0
 */

"use strict";

var _         = require("underscore")
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

  /**
   * 校验
   * @param handler
   * @param check
   * @param validation
   * @param callback
   */
  isValid: function (handler, check, validation, callback) {

    if (_.isFunction(validation)) {
      callback = validation;
      validation = undefined;
    }

    if (_.isFunction(check)) {
      callback = check;
      check = undefined;
      validation = undefined;
    }

    validation = validation || cache.get(constant.SYSTEM_DB_VALIDATOR);

    var self = this, func, target = [];
    if (check) {

      // find by rule name
      target = _.filter(validation, function(item) {
        return _.contains(check, item.name);
      });
    } else if (handler.req.path) {

      // find by url
      target = _.filter(validation, function(item) {
        return item.group == handler.req.path;
      });
    }

    async.mapSeries(target, function(item, next) {

      func = rule[item.rule];
      if (func) {
        return func.call(self, handler, item, next);
      }

      log.debug("Rule does not define : " + item.rule);
      next();
    }, function(err, result) {
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
