/**
 * @file 平台缓存内容管理
 * @module light.framework.cache.manager
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var async     = require("async")
  , _         = require("underscore")
  , constant  = require("../constant")
  , Model     = require("../mongo/model")
  , log       = require("../log")
  , config    = require("../configuration")
  , i18n      = require("../i18n")
  , signal    = require("../signal")
  , cache     = require("./cache")
  ;


var SIGNAL_KEY = "update.cache";

/**
 * 更新缓存
 * @param domain
 * @param collection
 * @param callback
 */
exports.update = function (domain, collection, callback) {
  cache.del(collection.toLowerCase());
  exports.init(domain, collection, callback);
};


/**
 * 初始化缓存
 * @param domain
 * @param collection
 * @param callback
 * @returns {*}
 */
exports.init = function (domain, collection, callback) {

  if (_.isFunction(collection)) {
    callback = collection;
    collection = undefined;
  }

  domain = domain || constant.SYSTEM_DB;

  // 添加更新信号监听器，当该信号产生时会更新缓存内容
  signal.addListener(SIGNAL_KEY, function(handler, done) {
    log.debug("The received signal to update the cache.", handler.uid);
    exports.update(handler.domain, handler.params.collection, done);
  });

  var functions = {}, db;
  functions.configuration = function (done) {
    var select = "type, key, value, valueType"
      , model = new Model(domain, constant.SYSTEM_DB_PREFIX, constant.SYSTEM_DB_CONFIG);

    model.getBy({valid: 1}, 0, Number.MAX_VALUE, {type: 1, key: 1}, select, function (err, result) {

      // 最先初始化配置内容
      config.load(result);

      log.debug("Loading configuration : " + result.length);
      cache.set(constant.SYSTEM_DB_CONFIG, result);
      done(err);
    });
  };

  functions.validator = function (done) {
    var select = "group,name,rule,key,option,message,sanitize,class,action,condition"
      , model = new Model(domain, constant.SYSTEM_DB_PREFIX, constant.SYSTEM_DB_VALIDATOR);

    model.getBy({valid: 1}, 0, Number.MAX_VALUE, undefined, select, function (err, result) {

      log.debug("Loading validator : " + result.length);
      cache.set(constant.SYSTEM_DB_VALIDATOR, result);
      done(err);
    });
  };

  functions.i18n = function (done) {
    var select = "type,lang,key"
      , model = new Model(domain, constant.SYSTEM_DB_PREFIX, constant.SYSTEM_DB_I18N);

    model.getBy({valid: 1}, 0, Number.MAX_VALUE, undefined, select, function (err, result) {

      i18n.load(result);

      log.debug("Loading i18n : " + result.length);
      cache.set(constant.SYSTEM_DB_I18N, result);
      done(err);
    });
  };

  functions.structure = function (done) {
    var select = "public,lock,type,kind,tenant,version,schema,items,extend,tenant"
      , model = new Model(domain, constant.SYSTEM_DB_PREFIX, constant.SYSTEM_DB_STRUCTURE);

    model.getBy({valid: 1}, 0, Number.MAX_VALUE, undefined, select, function (err, result) {

      log.debug("Loading structure : " + result.length);
      cache.set(constant.SYSTEM_DB_STRUCTURE, result);
      done(err);
    });
  };

  functions.board = function (done) {
    var select = "schema,api,type,kind,path,class,action,filters,selects,sorts,reserved"
      , model = new Model(domain, constant.SYSTEM_DB_PREFIX, constant.SYSTEM_DB_BOARD);

    model.getBy({valid: 1}, 0, Number.MAX_VALUE, undefined, select, function (err, result) {

      log.debug("Loading board : " + result.length);
      cache.set(constant.SYSTEM_DB_BOARD, result);
      done(err);
    });
  };

  functions.route = function (done) {
    var select = "template,url,class,action"
      , model = new Model(domain, constant.SYSTEM_DB_PREFIX, constant.SYSTEM_DB_ROUTE);

    model.getBy({valid: 1}, 0, Number.MAX_VALUE, select, function (err, result) {

      db = model.db;
      log.debug("Loading route : " + result.length);
      cache.set(constant.SYSTEM_DB_ROUTE, result);
      done(err);
    });
  };

  // 加载单个表
  if (collection) {
    var func = functions[collection.toLowerCase()];
    if (func) {
      return async.series([functions[collection.toLowerCase()]], callback);
    }

    log.error("Caching content does not exist. " + collection);
    callback();
  }

  // 加载所有表
  return async.series([
    functions.configuration, functions.validator, functions.i18n, functions.structure, functions.board, functions.route
  ], function (err) {
    callback(err, db);
  });
};
