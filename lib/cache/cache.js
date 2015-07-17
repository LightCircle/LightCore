/**
 * @file 内存缓存
 * @module light.framework.cache.cache
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var LRU       = require("lru-cache")
  , _         = require("underscore")
  , log       = require("../log")
  , config    = require("../configuration")
  , manager   = require("./manager")
  , spliter   = "#"
  , instance  = undefined;


/**
 * 获取
 * @returns {*}
 */
exports.get = function () {

  if (!config.cache.enable) {
    return undefined;
  }

  return cache().get(params(arguments));
};


/**
 * 设定
 */
exports.set = function () {

  if (!config.cache.enable) {
    return;
  }

  var keys = params([].splice.call(arguments, 0, arguments.length - 1))
    , vals = arguments[arguments.length - 1];

  log.debug("save to cache: " + keys);
  cache().set(keys, vals);
};


/**
 * 删除
 */
exports.del = function () {

  if (!config.cache.enable) {
    return;
  }

  var key = params(arguments);

  log.debug("delete from cache: " + key);
  cache().del(key);
};


/**
 * 平台缓存内容管理
 * @type {*|exports}
 */
exports.manager = manager;


/**
 * 合并参数成字符串
 * @param p
 * @returns {string}
 */
function params(p) {

  var result = "";
  _.each(p, function (val) {
    result = result + spliter + val;
  });

  return result;
}

/**
 * 缓存实例
 * @type {*|exports}
 */
function cache() {
  if (instance) {
    return instance;
  }

  instance = LRU({
    max: config.cache.max || 500
    //maxAge: config.cache.maxAge * 1000 * 60 || 1000 * 60 * 60 * 24,
  });

  return instance;
}

