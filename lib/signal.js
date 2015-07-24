/**
 * @file 信号发生与处理器。主要用于集群应用之间的交互。
 * @module light.core.signal
 * @author fzcs@live.cn
 * @version 1.0.0
 */
"use strict";

var util      = require("util")
  , _         = require("underscore")
  , request   = require("request")
  , async     = require("async")
  , log       = require("./log")
  , listener  = {}
  , API       = "/api/system/signal";


/**
 * 发送消息
 * @param handler
 * {
 *   server: {
 *     name: 服务器
 *     port: 端口
 *   }
 *   key: 信号分类
 *   message: {
 *     信号内容
 *   }
 * }
 * @param callback
 */
exports.send = function (handler, callback) {

  async.each(handler.params.server, function (ap, done) {

    log.debug("Sending a signal : " + handler.params.key + " - " + ap.name + "#" +  ap.port, handler.uid);

    var uri = util.format("http://%s:%s" + API, ap.name, ap.port)   // signal api url
      , agent = handler.req.headers["user-agent"]                   // 模拟为浏览器请求
      , cookie = handler.req.headers["cookie"]                      // 模拟登陆状态
      , message = handler.params;

    return request({
      method: "GET", uri: uri, json: message, headers: {"user-agent": agent, "cookie": cookie}
    }, function (err, response) {
      if (err) {
        return done(err);
      }

      if (response.statusCode != 200) {
        return done(response.statusCode);
      }

      done();
    });
  }, function (err) {
    if (err) {
      log.error(err);
    }

    if (callback) {
      callback(err);
    }
  });
};


/**
 * 注册的Listener处理器
 * @param key
 * @param func
 */
exports.addListener = function (key, func) {
  listener[key] = func;
};


/**
 * 接受信号，交给注册的Listener处理
 * @param handler
 * @param callback
 * @returns {*}
 */
exports.receive = function (handler, callback) {

  log.debug("The received signal : " + handler.params.key, handler.uid);

  var key = handler.params.key, func = listener[key];

  if (func) {
    return func.call(this, handler, callback);
  }

  callback();
};
