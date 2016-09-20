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
  this.total = 0;
  this.type = options.type;
  this.condition = options.condition;
  this.table = options.table;
  this.handler = handler;
  this.handler.domain = handler.domain || process.env.APPNAME;
  this.mapping = options.mapping || [];

  // 自定义controller
  if (options.controller) {
    this.controller = helper.resolve(options.controller);
  }

  // 数据源
  this.source = rider[this.table];
};


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

  var self = this
    , condition = {free: _.extend(this.params, this.condition)};

  this.source.list(this.handler, condition, function (err, result) {
    if (err) {
      return callback(err);
    }

    async.mapSeries(result.items, function (row, loop) {
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

  var self = this;
  row._original = {};

  async.waterfall([

    // 获取关联数据
    function (next) {
      async.eachSeries(self.mapping, function (mapping, loop) {
        self.handler.params.data = row;
        common.getLinkData(self.handler, mapping, loop);
      }, next);
    },

    // 类型转换
    function (next) {
      _.each(self.mapping, function (item) {
        var key = item.variable || item.key, val = row[key];

        // 数据格式化
        if (item.sanitize) {
          row[key] = validator.format(row[key], item.sanitize);
        }

        // 数组类型转换
        if (item.type && !_.isUndefined(val)) {
          if (item.type.toLowerCase() == 'array') {
            row[key] = val.join(',');
          }
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
      originalFilename: this.table + '.xlsx',
      headers: {'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
    }];
    file.add(this.handler, callback);
    fs.unlinkSync(this.name);
  }.bind(this));
};
