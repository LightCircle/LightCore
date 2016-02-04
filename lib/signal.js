/**
 * @file 信号发生与处理器。主要用于集群应用之间的交互。
 * @module lib.signal
 * @author fzcs@live.cn
 * @version 1.0.0
 */
"use strict";

var util      = require("util")
  , _         = require("underscore")
  , WS        = require("websocket").client
  , log       = require("./log")
  , config    = require("./configuration")
  , listener  = {};


exports.DOMAIN = "/signal";


/**
 * @desc 发送消息
 * @param {String} server 服务器
 * @param {String} port 服务器端口
 * @param {String} key 消息标识
 * @param {Object} data 消息数据
 * @param {Function} callback 回调函数
 */
exports.send = function (server, port, key, data, callback) {

  var client = new WS();

  client.on("connectFailed", function (error) {
    if (callback) callback(error);
  });

  client.on("connect", function (connection) {

    connection.on("error", function (error) {
      if (callback) callback(error);
    });

    connection.send(JSON.stringify({key: key, data: data}));
    connection.close();

    if (callback) callback();
  });

  log.debug("send signal to " + server + ":" + port);

  if (process.env.DEV) {
    return;
  }

  client.connect(util.format("ws://%s:%s%s", server, port || config.app.port, exports.DOMAIN), "echo-protocol");
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
 * @desc 接受信号，交给注册的Listener处理
 * @param {String} key 信号分类
 * @param {Object} err 错误
 * @param {Object} data 数据
 */
exports.onReceive = function (key, err, data) {

  log.debug("The received signal : " + key);

  var func = listener[key];
  if (func) {
    func.call(this, err, data);
  }
};
