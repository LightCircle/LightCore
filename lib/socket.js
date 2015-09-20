/**
 * @file Socket请求分发
 * @module light.core.socket
 * @author r2space@gmail.com
 * @version 1.0.0
 */
"use strict";

var util      = require("util")
  , _         = require("underscore")
  , log       = require("./log")
  , signal    = require("./signal")
  , constant  = require("./constant")
  , context   = require("./http/context")
  , helper    = require("./helper")
  , clients   = [];


/**
 * 分发请求
 * @param {Object} request
 * @param {Object} connection
 * @returns {*}
 */
exports.dispatch = function (request, connection) {

  // 处理信号请求
  if (request.resource == signal.DOMAIN) {
    connection.on("message", function (message) {
      var data = JSON.parse(message.utf8Data);
      signal.onReceive(data.key, data.error, data.data);
    });

    return connection.on("close", function () {
      log.info("web socket disconnected.", null);
    });
  }

  // 保存客户端连接
  addClient(request.resourceURL.query.uid, connection);

  connection.on("close", function () {
    log.info("web socket disconnected.", null);
    removeClient();
  });

  // 调用controller
  resolve(request, connection);
};


exports.client = function (uid) {
  return _.filter(clients, function (item) {
    return item.uid = uid;
  });
};


function resolve(request, connection) {

  var path = request.resourceURL.pathname.split("/")
    , clazz = path[1]
    , action = path[2]
    , inject = helper.resolve(constant.PATH_CONTROLLER + clazz);

  if (inject && inject[action]) {

    var func = inject[action]
      , param = request.resourceURL.query
      , handler = new context().create(param.uid, param.domain, param.code);

    return func.call(this, handler, function (err, result) {
      if (err) {
        log.error(err, handler.uid);
      }

      connection.send(JSON.stringify({error: err, data: result}));
    });
  }
}


function addClient(uid, connection) {
  connection.uid = uid;
  clients.push(connection);
}


function removeClient() {
  clients = _.reject(clients, function (item) {
    return !item.connected;
  });
}
