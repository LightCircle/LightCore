/**
 * @file 启动任务
 * @author r2space@gmail.com
 * @module lib.model.job
 * @version 1.0.0
 */

"use strict";

var _         = require("underscore")
  , context   = require("../http/context")
  , job       = require("../job")
  , log       = require("../log")
  , signal    = require("../signal")
  , Model     = require("../mongo/model")
  , rider     = require("./datarider")
  , constant  = require("./constant");


signal.addListener("start.job", function (err, params) {

  if (isMaster()) {

    var handler = new context().create(constant.ADMIN_ID, params.domain);

    handler.params.id = params.id;
    exports.start(handler, function (err) {
      if (err) {
        log.error(err);
      }
    });
  }
});


signal.addListener("stop.job", function (err, params) {

  if (isMaster()) {

    var handler = new context().create(constant.ADMIN_ID, params.domain);

    handler.params.id = params.id;
    exports.stop(handler, function (err) {
      if (err) {
        log.error(err);
      }
    });
  }
});


/**
 * @ignore
 * @desc 判断当前进程是否为主服务。<br>通过查看环境变量里是否有[ MASTER ]来判断
 * @returns {Boolean} true : 是主服务, false: 非主服务
 */
function isMaster() {
  return process.env.MASTER == "true";
}


/**
 * @desc 初始化任务，启动所有状态为STARTED的任务<br>
 *   - 当主服务时才启动，包含一下两个步骤<br>
 *   - 获取任务一览<br>
 *   - 启动<br>
 * @param {String} domain 数据库名
 * @param {Function} callback 回调函数
 */
exports.init = function (domain, callback) {

  if (!isMaster()) {
    return callback();
  }

  domain = domain || constant.SYSTEM_DB;

  var handler = new context().create(constant.ADMIN_ID, domain)
    , model = new Model(domain, constant.SYSTEM_DB_PREFIX, constant.MODULES_NAME_JOB, {tz: handler.timezone})
    , condition = {valid: 1, run: constant.JOB_STARTED};

  // 获取任务一览
  model.getBy(condition, 0, Number.MAX_VALUE, function (err, result) {
    _.each(result, function (item) {
      if (_.str.isBlank(item.schedule)) {
        return callback();
      }

      job.start(item, function (err, result) {
        updateJob(handler, item._id, err, result);
      });
    });

    callback(err, result);
  });
};


/**
 * @desc 立即执行
 * @param handler
 * @param callback
 * @returns {*}
 */
exports.immediate = function (handler, callback) {

  rider.job.get(handler, function (err, item) {

    job.immediate(item, function (err, result) {
      updateJob(handler, item._id, err, result, callback);
    });
  });
};


/**
 * @desc 重新启动脚本
 * @param handler
 * @param callback
 */
exports.start = function (handler, callback) {

  rider.job.get(handler, function (err, item) {
    if (err) {
      return callback(err);
    }

    if (_.str.isBlank(item.schedule)) {
      return callback();
    }

    // 停止
    job.stop(item._id);

    rider.job.update(handler, {id: handler.params.id, data: {run: constant.JOB_STARTED}}, function (err, result) {
      if (err) {
        return callback(err);
      }

      job.start(item, function (err, result) {
        updateJob(handler, item._id, err, result);
      });

      callback(err, result);
    });
  });
};


/**
 * @desc 停止
 * @param handler
 * @param callback
 */
exports.stop = function (handler, callback) {

  rider.job.update(handler, {id: handler.params.id, data: {run: constant.JOB_PAUSED}}, function (err, result) {
    if (err) {
      return callback(err);
    }

    job.stop(result._id);
    callback(err, result);
  });
};


/**
 * @ignore
 * @desc 更新状态
 * @param handler
 * @param id
 * @param error
 * @param result
 * @param callback
 */
function updateJob(handler, id, error, result, callback) {

  var data = {
    last: new Date(),
    extend: {result: result},
    status: constant.JOB_COMPLETED
  };

  if (error) {
    data.status = constant.JOB_FAILED;
    data.extend.result = error;
    log.error(error);
  }

  // 更新
  var model = new Model(handler.domain, constant.SYSTEM_DB_PREFIX, constant.MODULES_NAME_JOB, {tz: handler.timezone});
  model.update(id, data, function (err, data) {
    if (err) {
      log.error(err);
    }

    if (callback) {
      callback(err, data);
    }
  });
}
