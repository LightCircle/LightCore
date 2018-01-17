/**
 * @file 平台缓存内容管理
 * @module lib.cache.manager
 * @author r2space@gmail.com
 * @version 1.0.0
 */

'use strict';

const async = require('async')
  , _       = require('underscore')
  , fs      = require('fs')
  , Model   = require('../db/mongo/model')
  , rider   = require('../model/datarider')
  , log     = require('../log')
  , config  = require('../configuration')
  , i18n    = require('../i18n')
  , signal  = require('../signal')
  , CONST   = require('../constant')
  , helper  = require('../helper')
  , cache   = require('./index')
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
    return loadFromFile(callback);
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

    // 排序，优先使用用户定义的Board内容
    model.getBy({valid: 1}, 0, 0, {kind: 1, api: 1, type: 1}, (err, result) => {

      log.debug(`Loading board : ${result.length}`);

      cache.set(CONST.SYSTEM_DB_BOARD, result.map(item => rejectCommonField(item)));
      done(err);
    });
  };

  functions.route = done => {

    const model = new Model(domain, CONST.SYSTEM_DB_PREFIX, CONST.SYSTEM_DB_ROUTE);

    // 排序，优先使用用户定义的Route内容
    model.getBy({valid: 1}, 0, 0, {kind: 1, api: 1}, (err, result) => {

      log.debug(`Loading route : ${result.length}`);

      cache.set(CONST.SYSTEM_DB_ROUTE, result.map(item => rejectCommonField(item)));
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


function loadFromFile(callback) {

  function loadYaml(file) {
    const isTest = typeof global.it === 'function';
    return helper.yamlLoader(`${isTest ? 'test/' : ''}setting/${file}.yml`) || [];
  }

  const configuration = loadYaml(CONST.SYSTEM_DB_CONFIG, 'settings');
  cache.set(CONST.SYSTEM_DB_CONFIG, configuration);
  config.load(configuration);

  const validator = loadYaml(CONST.SYSTEM_DB_VALIDATOR);
  cache.set(CONST.SYSTEM_DB_VALIDATOR, validator);

  const i18ns = loadYaml(CONST.SYSTEM_DB_I18N);
  cache.set(CONST.SYSTEM_DB_I18N, i18ns);
  i18n.load(i18ns);

  const structure = loadYaml(CONST.SYSTEM_DB_STRUCTURE);
  cache.set(CONST.SYSTEM_DB_STRUCTURE, structure);

  const board = loadYaml(CONST.SYSTEM_DB_BOARD);
  cache.set(CONST.SYSTEM_DB_BOARD, board);

  const route = loadYaml(CONST.SYSTEM_DB_ROUTE);
  cache.set(CONST.SYSTEM_DB_ROUTE, route);

  const menu = loadYaml(CONST.SYSTEM_DB_FUNCTION);
  cache.set(CONST.SYSTEM_DB_FUNCTION, menu);

  const tenant = loadYaml(CONST.SYSTEM_DB_TENANT);
  cache.set(CONST.SYSTEM_DB_TENANT, tenant);

  log.debug(`Loading configuration : ${configuration.length}`);
  log.debug(`Loading validator : ${validator.length}`);
  log.debug(`Loading i18n : ${i18ns.length}`);
  log.debug(`Loading structure : ${structure.length}`);
  log.debug(`Loading board : ${board.length}`);
  log.debug(`Loading route : ${route.length}`);
  log.debug(`Loading function : ${menu.length}`);
  log.debug(`Loading tenant : ${tenant.length}`);

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