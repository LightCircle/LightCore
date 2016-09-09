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
  , ObjectID  = require("mongodb").ObjectID
  , excel     = require("./excel")
  , constant  = require("../constant")
  , rider     = require("../datarider")
  , log       = require("../../log")
  , helper    = require("../../helper")
  , Model     = require("../../mongo/model")
  , parser    = require("../../mongo/type/objectid")
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
  this.handler = handler;
  this.handler.domain = handler.domain || process.env.APPNAME;
  this.mapping = options.mapping || [];

  // 自定义controller
  if (options.controller) {
    this.controller = helper.resolve(options.controller);
  }

  // 数据源
  this.source = rider[options.table];
};


/**
 * 执行导入功能
 * @param name 文件名称
 * @param callback
 */
ETL.prototype.exec = function (name, callback) {

  this.name = name;

  this.transform(function (err, data) {
    if (err) {
      return callback(err);
    }

    this.load(data, function (err) {
      callback(err, {total: this.total});
    });
  });
};

/**
 * 转换数据
 * @param callback
 */
ETL.prototype.transform = function (callback) {

  this.source.list(this.handler, {}, function (err, result) {
    if (err) {
      return callback(err);
    }

    async.mapSeries(result, this.parse, callback);
  });
};


/**
 * 处理每行数据
 * @param row
 * @param callback
 */
ETL.prototype.parse = function (row, callback) {

  async.waterfall([

    // 获取关联数据
    function (next) {

      async.eachSeries(this.mapping, function (mapping, loop) {
        this.handler.params.data = row;
        getLinkData(this.handler, mapping, loop);
      }.bind(this), next);

    }.bind(this),

    // 类型转换
    function (next) {
      _.each(this.mapping, function (item) {
        var val = row[key];

        // 数据格式化
        if (item.format) {
          row[key] = validator.format(row[key], item.format);
        }

        // 数组类型转换
        if (item.type && !_.isUndefined(val)) {
          if (item.type.toLowerCase() == 'array') {
            row[key] = val.join(',');
          }
        }
      });

      next(undefined, row);
    }.bind(this)

  ], callback);
};


/**
 * 后期处理
 * @param data
 * @param callback
 */
ETL.prototype.load = function (data, callback) {

  // 尝试调用自动以方法
  dump(this.controller, this.handler, this.row, function (err) {
    if (err) {
      return callback(err);
    }

    this.total = data.length;

    // 只获取 col 被指定的项目, 并且以 col 的值排序
    var mapping = _.sortBy(_.filter(this.mapping, function (item) {
      return !_.isUndefined(item.col);
    }), 'col');

    excel.dump(this.name, _.map(data, function (row) {
        return _.map(mapping, function (item) {
          return row[item.key];
        });
      })
    );

    callback();
  }.bind(this));
};


function dump(controller, handler, data, callback) {

  if (!controller) {
    return callback(undefined);
  }

  var func = controller["dump"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, handler, data, function (err) {
    callback(err);
  });
}


/**
 * 获取关联表的数据, 注意: fields虽然是数组, 但是只支持指定一个项目
 * @param handler
 * @param option
 * @param callback
 * @returns {*}
 */
function getLinkData(handler, option, callback) {
  if (!option.table) {
    return callback();
  }

  var model = new Model(handler.domain, handler.code, option.table)
    , data = handler.params.data
    , values = mpath.get(option.key, data);

  var select = _.reduce(option.fields, function (memo, item) {
    memo[item] = 1;
    return memo;
  }, {});

  values = _.isArray(values) ? values : [values];
  async.mapSeries(values, function (value, loop) {

    var condition = _.clone(option.conditions);

    // 确认 conditions 里定义的参照变量是以 '$' 开头的, 这里提取参照变量的实际值进行替换, 转换为mongodb的条件
    _.each(condition, function (val, key) {
      if (!(_.isString(val) && val.startsWith("$"))) {
        return;
      }

      if (val.substr(1) == option.key) {
        condition[key] = (key == '_id') ? parser.dataParse(value) : value;
      } else {
        val = mpath.get(val.substr(1), data);
        condition[key] = {$in: _.isArray(val) ? val : [val]};
      }
    });

    model.get(_.extend({valid: 1}, condition), select, function (err, result) {
      if (err) {
        return loop(err);
      }

      if (!result) {
        return loop(undefined, {key: value, val: value});
      }

      result = result[option.fields[0]];
      result = result instanceof ObjectID ? result.toString() : result;
      loop(undefined, {key: value, val: result});
    });

  }, function (err, result) {
    log.debug('fetch link data - ' + option.key + ":" + option.table + ":" + option.fields[0], handler.uid);

    if (option.type && option.type.toLowerCase() == 'array') {
      data[option.key] = _.map(result, function (item) {
        data._original[item.val] = item.key;
        return item.val;
      });
    } else {
      data[option.key] = result[0].val;
      data._original[result[0].val] = result[0].key;
    }

    callback(err);
  });
}
