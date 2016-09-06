/**
 * @file ETL处理，执行数据导入
 *
 *  数据的路径
 *   通过 clean - extract - transform - load 阶段，导入到指定collection中
 *
 *  参数
 *   domain
 *   options {
 *     controller       自定义逻辑处理
 *     target           导入的最终表
 *     primitive
 *     {
 *       name           从数据源导入的原生数据, 临时表。如果明确指定名称则从该collection开始处理
 *       user           操作数据库时的账户
 *       pass
 *     }
 *     processed
 *     {
 *       name           通过加工的数据, 临时表。也可以指定名称，如果和target名称相同，则直接存放到结果collection中
 *       user           操作数据库时的账户
 *       pass
 *     }
 *     uid              操作者，不指定时为缺省管理者用户
 *     allowError       有错误时，是否继续后续的处理。缺省: false
 *     allowErrorMax    allowError=true时有效, 最大容错数
 *     keepID           是否重新生成ID 缺省: false
 *   }
 *
 *  自定义的controller，可以定义下面的方法，加载数据的时候会被调用
 *   init
 *   before
 *   parse
 *   after
 *
 * @author r2space@gmail.com
 * @module lib.model.importer
 * @version 1.0.0
 */

"use strict";

var async = require("async")
  , _ = require("underscore")
  , yaml = require('js-yaml')
  , fs = require('fs')
  , excel = require("./excel")
  , constant = require("../constant")
  , helper = require("../../helper")
  , Model = require("../../mongo/model")
  , validator = require("../../validator")
  , context = require("../../http/context")
  , PREFIX = "temp.";


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

  this.handler = handler;
  this.file = options.file || {};
  this.db = options.db || {};
  this.check = options.check || [];
  this.mapping = options.mapping || [];

  this.allowError = _.isUndefined(options.allowError) ? false : options.allowError;
  this.allowErrorMax = parseInt(options.allowErrorMax || 10);

  // 自定义controller
  if (options.controller) {
    this.controller = helper.resolve(options.controller);
  }

  // 存放源数据的collection
  var table = options.primitive || PREFIX + helper.randomGUID4();
  this.primitive = new Model(handler.domain, undefined, table, undefined, handler.db.user, handler.db.pass);

  // 存放加工好的数据collection
  this.processed = new Model(handler.domain, undefined, options.table, undefined, handler.db.user, handler.db.pass);
};

/**
 * 执行导入功能
 * @param callback
 */
ETL.prototype.exec = function (callback) {

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
  ], callback);

};


/**
 * 导入前初始化
 * @param callback
 */
ETL.prototype.initialize = function (callback) {

  // TODO: add default initialize
  init(this.controller, this.primitive, callback);
};


/**
 * 加载数据
 * @param callback
 */
ETL.prototype.extract = function (callback) {

  if (this.file.type == 'excel') {

    var self = this, data = excel.parse(this.file, this.mapping);

    return async.each(data, function (sheet, next) {
      async.each(sheet, function (row, done) {
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
              return next(undefined, row);
            }

            loop();
          },

          // 处理每行数据
          function (row, next) {
            self.parse(row, next);
          },

          // 将数据插入到, 存放加工完数据的表中
          function (parsed, next) {
            console.log(">>>>>>>>>", parsed);
            if (parsed === false) {
              return next();
            }
            self.processed.add(getInsertData(parsed, self.uid), next);
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

  // 尝试调用开发者自定义的 ctrl 对行数据进行加工
  if (hasCustomParser(this.controller)) {
    return customParse(this.controller, this.primitive, row, callback);
  }

  // 类型转换
  _.each(row, function (val, key) {
    var item = _.findWhere(_.values(this.mapping), {key: key});
    if (item && item.type && !_.isUndefined(val)) {

      // 数组类型
      if (item.type.toLocaleLowerCase() == 'array') {
        row[key] = val.split(/[ ]*,[ ]*/)
      }
    }
  }.bind(this));

  this.handler.params.data = row;
  validator.isValid(this.handler, this.check, function (err, message) {

    // 校验有错误的时候, 判断是否停止处理还是继续处理剩下的数据
    if (err) {
      if (this.allowError && this.log.length < this.allowErrorMax) {
        this.log = _.union(this.log, message);
        return callback(undefined, false);
      }
      return callback(err, false);
    }

    delete row['_id'];
    callback(undefined, getInsertData(row, this.uid));
  }.bind(this));
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

function customParse(controller, model, row, callback) {

  if (!controller) {
    return callback(undefined, row);
  }

  var func = controller["parse"];
  if (!func) {
    return callback(undefined, row);
  }

  func.call(this, model, row, function (err, parsed) {
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

function hasCustomParser(controller) {
  if (!controller) {
    return false;
  }

  return controller["parse"];
}

function getInsertData(original, uid) {

  var now = new Date();

  original.valid = _.isUndefined(original.valid) ? constant.VALID : original.valid;
  original.createAt = original.createAt || now;
  original.createBy = uid;
  original.updateAt = original.updateAt || now;
  original.updateBy = uid;

  return original;
}

// config
var doc = yaml.safeLoad(fs.readFileSync('../../../config/staff.yml', 'utf8'));
var handler = new context().create(constant.ADMIN_ID, 'ff340b0c4d5e', 'Default');
handler.db = {user: 'dev', pass: 'dev'};

// test
var cache = require("../../cache");
cache.set("validator", doc.validator);

new ETL(handler, doc).exec();
