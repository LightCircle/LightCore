/**
 * @file ETL处理，执行数据导出
 *
 *  自定义的controller，可以定义下面的方法，加载数据的时候会被调用
 *   dump
 *
 * @author r2space@gmail.com
 * @module lib.model.importer
 * @version 1.0.0
 */

"use strict";

var async     = require("async")
  , _         = require("underscore")
  , mpath     = require("mpath")
  , fs        = require("fs")
  , excel     = require("./excel")
  , common    = require("./common")
  , constant  = require("../constant")
  , rider     = require("../datarider")
  , config    = require("../../configuration")
  , helper    = require("../../helper")
  , file      = require("../../model/file")
  , validator = require("../../validator2")
  , ObjectID  = require("mongodb").ObjectID
  ;


/**
 * 构造函数
 * @param handler
 * @param options
 * @type {Function}
 */
var ETL = module.exports = function ETL(handler, options) {

  options = options || {};

  this.uid = handler.uid;
  this.fileName = handler.params.fileName;
  this.total = 0;
  this.type = options.type;
  this.table = options.schema;
  this.handler = handler;
  this.handler.domain = handler.domain || process.env.APPNAME;
  this.mapping = options.mappings || [];
  this.condition = filter(handler, options);

  // 自定义controller
  if (options.class) {
    this.controller = helper.resolve('/controllers/' + options.class);
  }

  // 数据源
  this.source = rider[this.table];
};


function filter(handler, options) {

  // 如果指定了free，free优先
  if (handler.params.free) {
    return {free: this.handler.params.free};
  }

  // 目前只支持AND条件
  if (handler.params.condition) {

    let condition = {}, id;
    options.filters.forEach(item => {
      const val = handler.params.condition[item.parameter];
      if (typeof val !== 'undefined') {
        if (item.key === '_id') {
          id = val;
        } else {
          condition[item.key] = val;
        }
      }
    });

    // 如果指定的条件里有_id, 那么忽略所有其他条件
    if (id) {
      return {id: id};
    }

    return {condition: condition};
  }

  return {};
}


/**
 * 执行导出功能
 * @param params 数据检索条件
 * @param callback
 */
ETL.prototype.exec = function (params, callback) {

  if (_.isFunction(params)) {
    callback = params;
    params = {};
  }

  this.params = params;

  this.transform(function (err, data) {
    if (err) {
      return callback(err);
    }

    this.load(data, function (err, result) {
      if (err || !result || _.isEmpty(result)) {
        return callback(err);
      }

      callback(err, {total: this.total, _id: result[0]._id.toString()});
    }.bind(this));
  }.bind(this));
};


/**
 * 转换数据
 * @param callback
 */
ETL.prototype.transform = function (callback) {

  let self = this, func = this.condition.id ? 'get' : 'list';

  this.source[func](this.handler, this.condition, (err, result) => {
    if (err) {
      return callback(err);
    }

    let data = this.condition.id ? [result] : result.items;

    async.mapSeries(data, function (row, loop) {
      self.parse(row, loop);
    }, callback);
  });
};


/**
 * 处理每行数据
 * @param row
 * @param callback
 */
ETL.prototype.parse = function (row, callback) {

  row._original = {};

  async.waterfall([

    // 获取关联数据
    next=> {
      async.eachSeries(this.mapping,  (mapping, loop)=> {
        this.handler.params.data = row;
        common.getLinkData(this.handler, mapping, loop);
      }, next);
    },

    // 数据格式化
    next=> {
      _.each(this.mapping, item => {
        if (item.sanitize) {
          const key = item.variable || item.key;
          row[key] = validator.format(row[key], item.sanitize);
        }
      });

      next(undefined, row);
    }
  ], callback);
};


/**
 * 后期处理
 * @param data
 * @param callback
 */
ETL.prototype.load = function (data, callback) {

  this.name = config.app.tmp + '/' + helper.randomGUID8();

  // 尝试调用自动以方法
  common.dump(this.controller, this.handler, data, function (err, newData) {
    if (err) {
      return callback(err);
    }

    data = newData || data;

    this.total = data.length;

    // 只获取 col 被指定的项目, 并且以 col 的值排序
    var mapping = _.sortBy(_.filter(this.mapping, function (item) {
      return !_.isUndefined(item.col);
    }), 'col');

    // 添加标题栏
    data.unshift(_.reduce(mapping, function (memo, item) {
      memo[item.variable || item.key] = _.isUndefined(item.title) ? item.key : item.title;
      return memo;
    }, {}));

    // 按照col的定义输出列, 当variable被定义, 那么他的值优先被使用
    // 如果col被重复定义, 那么后面的内容将最终得到输出
    excel.dump(this.name, _.map(data, function (row) {
        var result = [];
        _.each(mapping, function (item) {
          var index = parseInt(item.col) - 1;
          result[index] = row[item.variable || item.key];
        });
        return result;
      })
    );

    // 写到 gridfs 里
    this.handler.params.data = {};
    this.handler.params.files = [{
      fileStream: fs.createReadStream(this.name),
      originalFilename: this.fileName || this.table + '.xlsx',
      headers: {'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
    }];
    file.add(this.handler, callback);
    fs.unlinkSync(this.name);
  }.bind(this));
};
