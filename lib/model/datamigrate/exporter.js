/**
 * @file ETL处理，执行数据导出
 *
 *  数据的路径
 *   通过 clean - extract - transform - load 阶段，导出到指定collection中
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
  , excel = require("./excel")
  , constant = require("../constant")
  , helper = require("../../helper")
  , Model = require("../../mongo/model")
  , validator = require("../../validator")
  , context = require("../../http/context")
  , PREFIX = "temp.";



/**
 * 构造函数
 * @param domain
 * @param options
 * @type {Function}
 */
var ETL = module.exports = function ETL(target, options) {

  options = options || {};

  this.uid = options.uid || constant.ADMIN_ID;
  this.keepID = options.keepID;
  this.check = options.check;

  // 错误内容
  this.log = [];

  this.file = options.file || {};
  this.db = options.db || {};

  this.allowError = _.isUndefined(options.allowError) ? false : options.allowError;
  this.allowErrorMax = parseInt(options.allowErrorMax || 10);

  // this.condition = options.db.condition || {};

  // test
  var cache = require("../../cache");
  cache.set("validator", options.validator);


  this.handler = new context().create(options.uid || constant.ADMIN_ID, target.domain);


  // 自定义controller
  if (options.controller) {
    this.controller = helper.resolve(options.controller);
  }

  // 存放源数据的collection
  var table = options.primitive || PREFIX + helper.randomGUID4();
  this.primitive = new Model(target.domain, undefined, table, undefined, target.user, target.pass);

  // 存放加工好的数据collection
  this.processed = new Model(target.domain, undefined, target.table, undefined, target.user, target.pass);
};

/**
 * 执行导出功能
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
 * 导出前初始化
 * @param callback
 */
ETL.prototype.initialize = function (callback) {
  init(this.controller, this.primitive, callback);
};


/**
 * 加载数据
 * @param callback
 */
ETL.prototype.extract = function (callback) {

  if (this.file.type == 'excel') {

    var self = this, data = excel.parse(this.file);

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

          function (parsed, next) {
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

function parse(controller, model, row, callback) {

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


new ETL(
  {domain: 'LightDB', table: 'excel', user: 'light', pass: '2e35501c2b7e'},
  {
    primitive: 'excel',
    file: {
      type: 'excel',
      name: '/Users/lilin/Desktop/test.xlsx',
      mapping: {
        '3': 'col1',
        '4': 'col3'
      }
    },
    allowError: true,
    check: ['aaa'],
    validator: [
      {
        name: 'aaa',
        key: 'data.col1',
        rule: 'required',
        message: '不能为空'
      }
    ]
  }
).exec();
