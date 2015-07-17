/**
 * @file 标签
 * @author r2space@gmail.com
 * @module light.model.tag
 * @version 1.0.0
 */


"use strict";

var rider     = require("./datarider")
  , async     = require("async")
  , _         = require("underscore")
  , constant  = require("./constant");

/**
 * 添加标签，如果已经存在则计数器加一，如果不存在则新规
 * tag可以一次传递多个
 * @param handler
 * @param callback
 */
exports.add = function (handler, callback) {

  var data = handler.params.data
    , tags = _.isArray(data.name) ? data.name : [data.name];

  // 没指定type，用默认type
  if (!data.type) {
    data.type = constant.DEFAULT_TAG;
  }

  async.forEach(tags, function(tag, loop) {
    // 判断是否存在
    rider.tag.get(handler, {condition: {name: tag, type: data.type}}, function(err, result) {

      // 更新计数器
      if (result && result._id) {
        data.name = tag;
        data.counter = result.counter + 1;
        rider.tag.update(handler, {data: data, id: result._id.toString()}, loop);
      }
      // 新规
      else {
        data.name = tag;
        rider.tag.add(handler, {data: data}, loop);
      }
    });

  }, function(err, result) {
    callback(err, result);
  });
};