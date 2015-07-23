/**
 * @file 脚本启动器，支持定时执行，支持立即执行
 *
 *  cron - https://github.com/ncb000gt/node-cron
 * @module light.core.job.launcher
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var helper    = require("../helper")
  , exec      = require("child_process").exec
  , async     = require("async")
  , CronJob   = require("cron").CronJob
  , Emitter   = require("events").EventEmitter
  , log       = require("../log")
  , constant  = require("../constant")
  ;


/**
 * Job pool. 保存Job实例，可以用指定的ID停止某个Job
 */
var pool = {}
  , emitter = new Emitter();


/**
 * 定时执行
 * 时间格式与cron相同，如
 *  Seconds: 0-59
 *  Minutes: 0-59
 *  Hours: 0-23
 *  Day of Month: 1-31
 *  Months: 0-11
 *  Day of Week: 0-6
 *
 * @param job
 *  id: job的识别号
 *  time: 启动时间 字符串 * * * * * * 格式，或Date型（如果指定日期，则，会在指定日期被执行）
 *  params: 参数
 *  complete: Job停止时，调用的回调函数
 *  step:
 *    index:
 *    class:
 *    action:
 *    script:
 * @param tick 指定时间，脚本被执行以后，回调tick方法
 */
exports.start = function (job, tick) {

  job.id = job.id || job._id.toString();

  // add tick event
  emitter.on(job.id, function (status, params) {
    tick(status, params);
  });

  log.debug("schedule : " + job.schedule);
  pool[job.id] = new CronJob(
    // job time
    job.schedule,

    // tick
    kick.bind(null, job),

    // complete
    function () {
      if (job.complete) {
        job.complete();
      }
    },

    // immediately
    true
  );
};


/**
 * 立即执行Job
 * @param job
 * @param tick
 */
exports.immediate = function (job, tick) {

  job.id = job.id || helper.randomGUID12();
  emitter.on(job.id, function (err, result) {
    tick(err, result);
  });

  kick(job);
};


/**
 * 停止Job
 * @param id
 */
exports.stop = function (id) {

  if (pool[id]) {
    pool[id].stop();
    delete pool[id];
  }
};


/**
 * 停止
 */
exports.stopAll = function () {
  _.each(pool, function(val, key) {
    console.log(key);
    exports.stop(key);
  });
};


/**
 * 执行脚本或调用指定Class的指定Action
 * @param job
 */
function kick(job) {

  var result = {};

  async.eachSeries(job.step, function(step, next) {

    // 指定了类
    if (step.type == "action") {
      var inject = helper.resolve(constant.PATH_CONTROLLER + step.class), func;
      if (inject) {
        func = inject[step.action];
        if (func) {

          log.debug("run step : " + step.class + "#" + step.action);
          return func.call(this, step, function (err, data) {
            result[job.id] = data;
            next(err);
          });
        }
      }
    }

    // 指定了脚本
    if (step.type == "script") {
      log.debug("run step : " + step.script);
      return exec(step.script, function (err, stdout) {
        result[job.id] = stdout;
        next(err);
      });
    }

    result[job.id] = {};
    next();
  }, function(err) {
    emitter.emit(job.id, err, result);
  });
}
