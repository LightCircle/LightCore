/**
 * @file ETL处理，执行数据导入
 *
 *  数据的路径
 *   通过 clean - extract - transform - load 阶段，导入到指定collection中
 *
 *  自定义的controller，可以定义下面的方法，加载数据的时候会被调用
 *   init
 *   before
 *   parse
 *   after
 *   valid
 *
 *  TODO:
 *    - keepID
 *    - UI对应
 *
 * @author r2space@gmail.com
 * @module lib.model.importer
 * @version 1.0.0
 */

"use strict";

var async     = require("async")
  , _         = require("underscore")
  , fs        = require("fs")
  , ObjectID  = require("mongodb").ObjectID
  , excel     = require("./excel")
  , common    = require("./common")
  , constant  = require("../constant")
  , rider     = require("../datarider")
  , helper    = require("../../helper")
  , Model     = require("../../mongo/model")
  , validator = require("../../validator2")
  , config    = require("../../configuration")
  , context   = require("../../http/context")
  , file      = require("../../model/file")
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
  this.handler.domain = handler.domain || process.env.APPNAME;

  this.type = options.type;
  this.check = options.check || [];
  this.mapping = options.mapping || [];
  this.validator = options.validator;
  this.uniqueKey = options.uniqueKey;
  this.condition = options.condition;

  this.allowError = _.isUndefined(options.allowError) ? false : options.allowError;
  this.allowErrorMax = parseInt(options.allowErrorMax || 10);
  this.allowUpdate = options.allowUpdate;

  // 自定义controller
  if (options.controller) {
    this.controller = helper.resolve(options.controller);
  }

  // 存放源数据的collection
  var table = options.primitive || PREFIX + helper.randomGUID4();
  this.primitive = new Model(this.handler.domain, undefined, table);

  // 存放加工好的数据collection
  table = options.processed || PREFIX + helper.randomGUID4();
  this.processed = new Model(this.handler.domain, undefined, table);

  // 最终的表
  this.target = rider[options.table];
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
      this.loadGridFile(done);
    }.bind(this),
    function (done) {
      this.initialize(done)
    }.bind(this),
    function (done) {
      this.extract(done)
    }.bind(this),
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
 * 导入前初始化
 * @param callback
 */
ETL.prototype.initialize = function (callback) {

  async.series([
    function (next) {
      this.primitive.dropCollection(next);
    }.bind(this),
    function (next) {
      this.processed.dropCollection(next);
    }.bind(this)
  ], function (err) {
    if (err) {
      return callback(err);
    }

    common.init(this.controller, this.handler, this.primitive, callback);
  }.bind(this));

};


ETL.prototype.loadGridFile = function (callback) {

  // 如果指定的是文件ID, 则从DB里获取文件
  if (this.name instanceof ObjectID || this.name.length == 24) {
    return file.stream(this.handler.copy({id: this.name}), function (err, stream) {
      if (err) {
        return callback(err);
      }

      this.name = config.app.tmp + '/' + helper.randomGUID8();
      stream.pipe(fs.createWriteStream(this.name));
      stream.on('end', callback);
    }.bind(this));
  }

  callback();
};


/**
 * 加载数据
 * @param callback
 */
ETL.prototype.extract = function (callback) {

  if (this.type == 'excel') {

    var self = this, data = excel.parse(this.name, this.mapping);
    fs.unlinkSync(this.name);

    return async.eachSeries(data, function (sheet, next) {
      async.eachSeries(sheet, function (row, done) {
        self.primitive.add(row, done);
      }, next);

    }, function (err) {
      if (err) {
        return callback(err);
      }

      // 尝试调用用户自定义的 befor 方法
      common.before(self.controller, self.handler, self.primitive, callback);
    });
  }

  if (this.file && this.file.type == 'csv') {
    // TODO
  }
};


/**
 * 转换数据
 * @param callback
 */
ETL.prototype.transform = function (callback) {

  var self = this, more = true;

  self.primitive.getCursor({filter: _.extend({valid: {$ne: 0}}, this.condition)}, function (err, curosr) {

    async.whilst(
      function () {
        return more;
      },
      function (loop) {

        async.waterfall([

          // 遍历所有数据
          function (next) {
            curosr.next(next);
          },

          // 测试是否有下一条数据
          function (row, next) {
            more = row;
            if (more) {
              self.total = self.total + 1;
              return next(undefined, row);
            }

            loop();
          },

          // 处理每行数据
          function (row, next) {
            self.parse(row, next);
          },

          // 将数据插入到, 存放加工完数据的表中
          function (hasError, parsed, next) {

            // 校验有错误的时候, 判断是否停止处理还是继续处理剩下的数据
            if (hasError) {
              if (self.allowError && self.log.length < self.allowErrorMax) {
                return next();
              }
              return next(new Error.parameter.ParamError());
            }

            self.processed.add(parsed, next);
          }
        ], function (err) {
          loop(err);
        });
      },
      function (err) {
        callback(err);
      }
    );
  });

};

/**
 * 向最终表添加数据
 * @param row
 * @param callback
 */
ETL.prototype.add = function (row, callback) {

  // 当允许更新的FLG被设定, 需要判断是否有 uniqueKey 相匹配的数据
  if (this.allowUpdate) {

    var condition = _.reduce(this.uniqueKey, function (memo, key) {
      memo[key] = row[key];
      return memo;
    }, { valid: 1 });

    // 判断有, 则更新, 没有就插入一条新数据
    this.handler.params.free = condition;
    return this.target.get(this.handler, function (err, result) {
      if (err) {
        return callback(err);
      }

      if (result && !_.isEmpty(result)) {
        this.handler.params.free = condition;
        this.handler.params.data = row;
        this.target.update(this.handler, callback);
      } else {
        this.handler.params.data = row;
        this.target.add(this.handler, callback)
      }
    }.bind(this));
  }

  this.handler.params.data = row;
  this.target.add(this.handler, callback);
};


/**
 * 处理每行数据
 * @param row
 * @param callback
 */
ETL.prototype.parse = function (row, callback) {

  var self = this, hasError = false;

  async.waterfall([

    // 类型转换
    function (next) {
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
        common.getLinkData(self.handler, item, loop);
      }, next);
    },

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
      common.parse(self.controller, self.handler, row, function (err) {
        next(err);
      });
    },

    // 数据校验
    function (next) {
      self.handler.params.data = row;
      validator.isValid(self.handler, self.check, self.validator, function (err, message) {
        if (err) {
          hasError = true;
          _.each(message, function (item) {
            item.row = self.total;
          });
          self.log = _.union(self.log, message);
        }

        next();
      });
    },

    // 尝试调用开发者自定义的数据校验
    function (next) {
      common.valid(self.controller, self.handler, row, function (err, message) {
        if (err) {
          hasError = true;
          _.each(message, function (item) {
            item.row = self.total;
          });
          self.log = _.union(self.log, message);
        }

        next();
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

  // 尝试调用用户的方法
  common.after(this.controller, this.handler, this.processed, function (err) {
    if (err) {
      return callback(err);
    }

    var self = this, more = true;
    this.processed.getCursor({filter: {valid: {$ne: 0}}}, function (err, curosr) {
      async.whilst(
        function () {
          return more;
        },
        function (loop) {
          curosr.next(function (err, row) {
            more = row;
            if (!more) {
              return loop();
            }

            delete row['_id'];
            self.add(row, function (err) {
              if (!err) {
                self.success = self.success + 1;
              }
              loop(err);
            });
          });
        }, callback);
    });
  }.bind(this));
};
