/**
 * @file 验证, 依赖validator模块
 * @author r2space@gmail.com
 * @module light.framework.validator
 * @version 1.0.0
 */

"use strict";

var _         = require("underscore")
  , async     = require("async")
  , Model     = require("../mongo/model")
  , constant  = require("../constant")
  , cache     = require("../cache")
  , log       = require("../log")
  , rule      = require("./rule")
  , sanitize  = require("./sanitize")
  ;


module.exports = {

  /**
   * 校验
   * @param handler
   * @param check
   * @param callback
   */
  isValid: function (handler, check, callback) {

    if (_.isFunction(check)) {
      callback = check;
      check = undefined;
    }

    var self = this, target, func, validation = cache.get(constant.SYSTEM_DB_VALIDATOR);
    if (check) {

      // find by rule name
      target = _.filter(validation, function(item) {
        return _.contains(check, item.name);
      });
    } else {

      // find by url
      target = _.filter(validation, function(item) {
        return item.group == handler.req.path;
      });
    }

    async.map(target, function(item, next) {

      func = rule[item.rule];
      if (func) {
        return func.call(self, handler, item, next);
      }

      log.debug("Rule does not define : " + item.rule);
      next();
    }, function(err, result) {

      callback(err, result);
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
