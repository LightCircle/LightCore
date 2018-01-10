/**
 * @file 验证, 依赖validator模块
 * @author r2space@gmail.com
 * @module lib.validator.index
 * @version 1.0.0
 */

'use strict';

const _       = require('underscore')
  , async     = require('async')
  , constant  = require('../constant')
  , cache     = require('../cache')
  , log       = require('../log')
  , rule      = require('./rule')
  , sanitize  = require('./sanitize')
  , error     = require('../error').parameter
  ;


module.exports = {

  rule: rule,
  sanitize: sanitize,

  /**
   * 校验
   * @param handler
   * @param group 可选 指定特定的校验组进行校验
   * @param callback
   */
  isValid: function (handler, group, callback) {

    if (typeof group === 'function') {
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

      log.debug('Rule does not define : ' + item.rule);
      next();
    }, (err, result) => {
      if (err) {
        return callback(err);
      }

      result = _.compact(_.flatten(result));
      if (_.isEmpty(result)) {
        return callback();
      }

      log.info(result);
      callback(new error.ParamError(), result);
    });
  },

  /**
   * 格式化数据
   */
  format: function (handler, val, sanitation, callback) {

    // 没有指定handler调用该方法，参数值顺移
    if (typeof sanitation === 'function') {
      callback = sanitation;
      sanitation = val;
      val = handler;
    }

    const func = sanitize[sanitation.rule];
    if (func) {
      val = func.call(this, val, sanitation.option, handler);
      if (callback) {
        callback(undefined, val);
      }
      return val;
    }

    if (callback) {
      callback(undefined, val);
    }
    return val;
  }
};
