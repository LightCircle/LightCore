/**
 * @file MQ
 * @module light.core.mq
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var util      = require("util")
  , _         = require("underscore")
  , config    = require("./configuration")
  , log       = require("./log")
  , amqp      = require("amqp");


var exchangeOption = {
    durable: true,      // 持久形队列，服务重新启动的时候，不会清除
    autoDelete: false,  // 当queue中得消息消费完以后，不自动删除
    confirm: true
  },
  publishOption = {
    mandatory: true,    // 消息不能被路由的时候，服务器返回错误消息，而不是仅仅删除该消息
    deliveryMode: 2     // 持久  1: 为非持久 2: 持久
  },
  queueOption = {
    durable: true,      // 持久形队列，服务重新启动的时候，不会清除
    autoDelete: true    // 当queue中得消息消费完以后，不自动删除
  },
  EXCHANGE = "light";

/**
 * @desc 获取与MQ服务器的连接
 * @param {Object} option 连接参数
 * @param {Function} callback 回调函数
 */
exports.connect = function (option, callback) {

  var connection = amqp.createConnection(option);

  // 错误
  connection.on("error", function (err) {

    log.error(err);
    callback(err);
  });

  // 连接成功
  connection.on("ready", function () {

    log.debug("connected to " + connection.serverProperties.product);
    callback(null, connection);
  });

  // 退出
  process.on("exit", function () {

    log.debug("disconnect " + connection.serverProperties.product);
    //connection.disconnect();
  });
};


/**
 * @desc 发送消息
 * @param {String} routing 指定routing key，要和服务端的bing key相同
 * @param {Object} body 消息本体
 * @param {Function} callback 回调函数
 */
exports.publish = function (routing, body, callback) {

  exports.connect(config.mq, function (err, connection) {
    if (err) {
      return callback(err);
    }

    connection.exchange(EXCHANGE, exchangeOption, function (exchange) {

      exchange.on("close", function() {
        connection.destroy();
        if (callback) {
          callback();
        }
      });

      exchange.publish(routing, body, publishOption);
      exchange.close();
    });
  });
};


/**
 * @desc 等待MQ的回调，只接收一次消息，接到后关闭连接<br>
 *   使用场景为: 任务交给MQ处理，MQ处理完成以后通过该监听器通知调用端处理结束
 * @param {String} routing 指定routing key，要和服务端的bing key相同
 * @param {Function} callback 回调函数
 */
exports.listener = function(routing, callback) {

  exports.connect(config.mq, function (err, connection) {
    if (err) {
      return callback(err);
    }

    var exchange = connection.exchange(EXCHANGE, exchangeOption);
    connection.queue(routing, queueOption, function (q) {
      q.bind(exchange, routing);
      q.subscribe(function (message) {

        exchange.on("close", function() {
          connection.destroy();
        });

        exchange.close();
        callback(null, message);
      });
    });
  });

};