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
 * @author r2space@gmail.com
 * @module lib.model.importer
 * @version 1.0.0
 */

// TODO:
// 3. UI对应
// 4. custom的方法的确认
// 6. 添加或更新
// 9. staff id uniq 的支持

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
  , validator = require("../../validator")
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
  this.count = 0;

  this.handler = handler;
  this.handler.db = this.handler.db || {};
  this.handler.domain = handler.domain || process.env.APPNAME;

  this.type = options.type;
  this.check = options.check || [];
  this.mapping = options.mapping || [];
  this.validator = options.validator;

  this.allowError = _.isUndefined(options.allowError) ? false : options.allowError;
  this.allowErrorMax = parseInt(options.allowErrorMax || 10);

  // 自定义controller
  if (options.controller) {
    this.controller = helper.resolve(options.controller);
  }

  // 存放源数据的collection
  var table = options.primitive || PREFIX + helper.randomGUID4();
  this.primitive = new Model(this.handler.domain, undefined, table);

  // 存放加工好的数据collection
  this.processed = rider[options.table];
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
    callback(err, this.log);
  }.bind(this));

};


/**
 * 导入前初始化
 * @param callback
 */
ETL.prototype.initialize = function (callback) {

  this.primitive.dropCollection(function (err) {
    if (err) {
      return callback(err);
    }

    init(this.controller, this.primitive, callback);
  }.bind(this));

};


/**
 * 加载数据
 * @param callback
 */
ETL.prototype.extract = function (callback) {

  if (this.type == 'excel') {

    var self = this, data = excel.parse(this.name, this.mapping);

    return async.eachSeries(data, function (sheet, next) {
      async.eachSeries(sheet, function (row, done) {
        self.primitive.add(row, done);
      }, next);

    }, function (err) {
      if (err) {
        return callback(err);
      }

      // 尝试调用用户自定义的 befor 方法
      before(self.controller, self.primitive, callback);
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

  self.primitive.getCursor({filter: this.condition}, function (err, curosr) {

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
              self.count = self.count + 1;
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

            self.handler.params.data = parsed;
            self.processed.add(self.handler, next)
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
        getLinkData(self.handler, item, loop);
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
      parse(self.controller, self.handler, row, function (err) {
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
            item.row = self.count;
          });
          self.log = _.union(self.log, message);
        }

        next();
      });
    },

    // 尝试调用开发者自定义的数据校验
    function (next) {
      valid(self.controller, self.handler, row, function (err, message) {
        if (err) {
          hasError = true;
          _.each(message, function (item) {
            item.row = self.count;
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
  after(this.controller, this.processed, callback);
};


function init(controller, model, callback) {

  if (!controller) {
    return callback(undefined);
  }

  var func = controller["initialize"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, model, function (err) {
    callback(err);
  });
}

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

function valid(controller, handler, row, callback) {
  if (!controller) {
    return callback(undefined);
  }

  var func = controller["valid"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, handler, row, function (err) {
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
