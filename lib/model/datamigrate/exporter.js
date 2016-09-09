/**
 * @file ETL处理，执行数据导出
 *
 *  自定义的controller，可以定义下面的方法，加载数据的时候会被调用
 *   parse
 *
 * @author r2space@gmail.com
 * @module lib.model.importer
 * @version 1.0.0
 */

"use strict";

var async     = require("async")
  , _         = require("underscore")
  , yaml      = require('js-yaml')
  , fs        = require('fs')
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
  , context   = require("../../http/context")
  , Error     = require("../../error")
  , PREFIX    = "temp.";


/**
 * 构造函数
 * @param handler
 * @param options
 * @type {Function}
 */
var ETL = module.exports = function ETL(handler, options) {

  options = options || {};

  this.uid = handler.uid;
  this.keepID = options.keepID;

  // 错误内容
  this.log = [];
  this.total = 0;
  this.success = 0;

  this.handler = handler;
  this.handler.db = this.handler.db || {};
  this.handler.domain = handler.domain || process.env.APPNAME;

  this.type = options.type;
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

  async.series([
    function (done) {
      this.transform(done)
    }.bind(this),
    function (done) {
      this.load(done)
    }.bind(this)
  ], function (err) {
    callback(err, {total: this.total, success: this.success, error: this.log});
  }.bind(this));

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

    async.mapSeries(result, function (row, loop) {

      this.parse(row, loop);

    }.bind(this), function (err, data) {

    });
  });

};


/**
 * 处理每行数据
 * @param row
 * @param callback
 */
ETL.prototype.parse = function (row, callback) {

  var self = this, hasError = false;

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
      _.each(self.mapping, function (item) {

        var val = row[key];

        // 数组类型转换
        if (item.type && !_.isUndefined(val)) {
          if (item.type.toLowerCase() == 'array') {
            row[key] = val.join(',');
          }
        }

        // 数据格式化
        if (item.format) {
          validator.format(row[key], item.format);
        }

      });

      async.eachSeries(_.pluck(self.mapping, 'key'), function (key, loop) {
        var val = row[key]
          , item = _.findWhere(self.mapping, {key: key});

        row._original = row._original || {};

        // 数组类型转换
        if (item.type && !_.isUndefined(val)) {
          if (item.type.toLowerCase() == 'array') {
            row[key] = val.split(/[ ]*,[ ]*/)
          }
        }

        // 获取关联内容
        self.handler.params.data = row;
        getLinkData(self.handler, item, loop);
      }, next);
    },

    // 数据格式化

    // 设定缺省值
    function (next) {
      _.each(self.mapping, function (item) {
        if (!_.isUndefined(item.default)) {
          row[item.key] = item.default;
        }
      });
      next();
    },

    // 尝试调用开发者自定义的类型转换
    function (next) {
      parse(self.controller, self.handler, row, function (err) {
        next(err);
      });
    }

  ], function (err) {
    delete row['_id'];
    delete row['_original'];
    callback(err, hasError, row);
  });
};


/**
 * 后期处理
 * @param callback
 */
ETL.prototype.load = function (callback) {

  // 有校验错误, 且 allowError = false 则不更新最终数据库
  if (!this.allowError && this.log.length > 0) {
    return callback();
  }

  var self = this, more = true;
  this.processed.getCursor({}, function (err, curosr) {
    async.whilst(
      function () {
        return more;
      },
      function (loop) {
        curosr.next(function (err, row) {
          more = row;
          if (more) {

            delete row['_id'];
            return self.add(row, function (err) {
              console.log('>>>>>>>>>>>>', err);
              if (!err) {
                self.success = self.success + 1;
              }
              loop(err);
            });
          }

          loop();
        });
      },
      function () {
        after(self.controller, self.processed, callback);
      }
    );
  });

};



function before(controller, model, callback) {

  if (!controller) {
    return callback(undefined);
  }

  var func = controller["before"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, model, function (err) {
    callback(err);
  });
}

function parse(controller, handler, row, callback) {

  if (!controller) {
    return callback(undefined, row);
  }

  var func = controller["parse"];
  if (!func) {
    return callback(undefined, row);
  }

  func.call(this, handler, row, function (err, parsed) {
    callback(err, parsed);
  });
}

function after(controller, model, callback) {
  if (!controller) {
    return callback(undefined);
  }

  var func = controller["after"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, model, function (err) {
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
