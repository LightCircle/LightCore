/**
 * @file 平台缓存内容管理
 * @module lib.cache.manager
 * @author r2space@gmail.com
 * @version 1.0.0
 */

'use strict';

const async  = require('async')
  , _        = require('underscore')
  , fs       = require('fs')
  , Model    = require('../mongo/model')
  , rider    = require('../model/datarider')
  , log      = require('../log')
  , config   = require('../configuration')
  , i18n     = require('../i18n')
  , signal   = require('../signal')
  , CONST    = require('../constant')
  , cache    = require('./index')
  ;


const SIGNAL_KEY = 'update.cache';
const CACHE_FILE = 'cache.json';


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

  // 监视数据的更新, 重新加载缓存
  setUpdateListener();

  // 尝试从文件加载数据(脱离Mongo运行时使用)
  if (process.env.LOCAL === 'true') {
    return loadCacheFromData(callback);
  }

  domain = domain || CONST.SYSTEM_DB;

  const functions = {};
  functions.configuration = done => {

    const model = new Model(domain, CONST.SYSTEM_DB_PREFIX, CONST.SYSTEM_DB_CONFIG);
    model.getBy({valid: 1}, (err, result) => {

      // 最先初始化配置内容
      config.load(result);

      log.debug(`Loading configuration : ${result.length}`);
      cache.set(CONST.SYSTEM_DB_CONFIG, result.map(item => rejectCommonField(item)));
      done(err);
    });
  };

  functions.validator = done => {

    const model = new Model(domain, CONST.SYSTEM_DB_PREFIX, CONST.SYSTEM_DB_VALIDATOR);
    model.getBy({valid: 1}, (err, result) => {

      log.debug(`Loading validator : ${result.length}`);
      cache.set(CONST.SYSTEM_DB_VALIDATOR, result.map(item => rejectCommonField(item)));
      done(err);
    });
  };

  functions.i18n = done => {

    const model = new Model(domain, CONST.SYSTEM_DB_PREFIX, CONST.SYSTEM_DB_I18N);
    model.getBy({valid: 1}, (err, result) => {

      i18n.load(result);

      log.debug(`Loading i18n : ${result.length}`);
      cache.set(CONST.SYSTEM_DB_I18N, result.map(item => rejectCommonField(item)));
      done(err);
    });
  };

  functions.structure = done => {

    const model = new Model(domain, CONST.SYSTEM_DB_PREFIX, CONST.SYSTEM_DB_STRUCTURE);
    model.getBy({valid: 1}, (err, result) => {

      log.debug(`Loading structure : ${result.length}`);
      cache.set(CONST.SYSTEM_DB_STRUCTURE, result.map(item => rejectCommonField(item)));
      done(err);
    });
  };

  functions.board = done => {

    const model = new Model(domain, CONST.SYSTEM_DB_PREFIX, CONST.SYSTEM_DB_BOARD);
    model.getBy({valid: 1}, (err, result) => {

      log.debug(`Loading board : ${result.length}`);

      // 排序，优先使用用户定义的Board内容
      const board = result.map(item => rejectCommonField(item));
      cache.set(CONST.SYSTEM_DB_BOARD, board.sort((a, b) => a.kind > b.kind));
      done(err);
    });
  };

  functions.route = done => {

    const model = new Model(domain, CONST.SYSTEM_DB_PREFIX, CONST.SYSTEM_DB_ROUTE);
    model.getBy({valid: 1}, (err, result) => {

      log.debug(`Loading route : ${result.length}`);

      // 排序，优先使用用户定义的Route内容
      let route = result.map(item => rejectCommonField(item));
      cache.set(CONST.SYSTEM_DB_ROUTE, route.sort((a, b) => a.kind > b.kind));
      done(err);
    });
  };

  functions.menu = done => {

    const model = new Model(domain, CONST.SYSTEM_DB_PREFIX, CONST.SYSTEM_DB_FUNCTION);
    model.getBy({kind: CONST.FUNC_KIND_DEVELOPER, status: CONST.FUNC_STATUS_ENABLED, valid: 1}, (err, result) => {

      log.debug(`Loading function : ${result.length}`);

      cache.set(CONST.SYSTEM_DB_FUNCTION, result.map(item => rejectCommonField(item)));
      done(err);
    });
  };

  let db = undefined;
  functions.tenant = done => {

    const model = new Model(domain, CONST.SYSTEM_DB_PREFIX, CONST.SYSTEM_DB_TENANT);
    model.getBy({valid: 1}, (err, result) => {

      db = model.db;
      log.debug(`Loading tenant : ${result.length}`);
      cache.set(CONST.SYSTEM_DB_TENANT, result.map(item => rejectCommonField(item)));
      done(err);
    });
  };

  // 加载单个表
  if (collection) {
    const func = functions[collection.toLowerCase()];
    if (func) {
      return async.series([functions[collection.toLowerCase()]], callback);
    }

    log.error('Caching content does not exist. ' + collection);
    callback();
  }

  // 加载所有表
  return async.series([
    functions.configuration, functions.validator, functions.i18n,
    functions.structure, functions.board, functions.route, functions.menu, functions.tenant
  ], err => callback(err, db));
};


/**
 * 添加更新信号监听器，当该信号产生时会更新缓存内容
 */
function setUpdateListener() {

  signal.addListener(SIGNAL_KEY, function (err, params) {

    exports.update(params.domain, params.collection, function () {

      log.debug('The received signal to update the cache. ' + params.collection);

      rider.reset(params.collection);
    });
  });
}


/**
 * @desc 从文件加载缓存. 当需要脱离MongoDB运行的时候, 可以使用这个功能.<br/>
 *  缓存文件的内容可以有很多方式保存到文件中, 如Admin的 /api/system/cachetofile API
 *
 * @param callback
 */
function loadCacheFromData(callback) {

  // 从文件加载
  cache.load(JSON.parse(fs.readFileSync(CACHE_FILE)));

  // 初始化config与i18n
  config.load(cache.get(CONST.SYSTEM_DB_CONFIG));
  i18n.load(cache.get(CONST.SYSTEM_DB_I18N));

  callback();
}


function rejectCommonField(item) {
  // delete item._id;
  delete item.valid;
  delete item.createAt;
  delete item.createBy;
  delete item.updateAt;
  delete item.updateBy;
  return item;
}