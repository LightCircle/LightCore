/**
 * @file controller的共通类
 *  用handler.domain指定要操作的数据库，如果未指定使用系统DB
 *    当使用系统DB时，表名不带前缀
 *  可以用code指定表名的前缀，前缀用于标识Tenand
 *
 *  被允许的参数结构如下
 *    id        : 指定ID获取，更新，删除时使用
 *    condition : 指定条件获取，更新，删除时条件
 *    data      : 添加，更新的数据
 *    start     : 开始位置 （alias - skip）
 *    limit     : 获取件数
 *    sort      : 排序 （alias - order）
 *    select    : 获取的字段 （alias - field）
 * @author r2space@gmail.com
 * @module lib.mongo.controller
 * @version 1.0.0
 */

"use strict";

var path     = require("path")
  , async    = require("async")
  , _        = require("underscore")
  , errors   = require("../error")
  , constant = require("../constant")
  , config   = require("../configuration")
  , helper   = require("../helper")
  , Model    = require("./model");

/**
 * 构造函数
 * @type {Controller}
 */
var Controller = module.exports = function Controller(handler, table, define) {

  var account = handler.db || {}
    , params  = handler.params || {};

  // Model实例
  this.domain = handler.domain || process.env.APPNAME;
  this.model = new Model(this.domain, handler.code, table, {
    define: define,
    user: account.user,
    pass: account.pass,
    tz: handler.timezone
  });

  // 参数
  this.uid = handler.uid;
  this.id = params.id;
  this.condition = params.condition;
  this.data = params.data || params;
  this.skip = params.skip || params.start;
  this.limit = params.limit;
  this.sort = params.sort || params.order;
  this.select = params.select || params.field;
  this.files = params.files;
  this.strict = handler.strict;
};


Controller.prototype.add = function (callback) {

  var self = this;

  function defaults(data) {

    // Strict mode, the use of system time
    if (self.strict) {
      return {
        createAt: new Date(),
        updateAt: new Date(),
        valid: constant.VALID,
        createBy: self.uid,
        updateBy: self.uid
      };
    }

    // In non-strict mode, the user specified time is attempted
    return {
      createAt: data.createAt || new Date(),
      updateAt: data.updateAt || new Date(),
      valid: _.isUndefined(data.valid) ? constant.VALID : data.valid,
      createBy: data.createBy || self.uid,
      updateBy: data.updateBy || self.uid
    };
  }

  var data = undefined;
  if (_.isArray(this.data)) {
    data = _.map(this.data, function (item) {
      return _.extend(item, defaults(item));
    });
  } else {
    data = _.extend(this.data, defaults(this.data));
  }

  this.model.add(data, function (err, result) {
    if (err) {
      return callback(new errors.db.Add(err.message || err.errmsg));
    }
    callback(err, result);
  });
};


Controller.prototype.remove = function (callback) {

  if (this.id) {
    return this.model.remove(this.id, {updateAt: new Date(), updateBy: this.uid}, function (err, result) {
      if (err) {
        return callback(new errors.db.Remove(err.message || err.errmsg));
      }
      callback(err, result);
    });
  }

  this.model.removeBy(this.condition, {updateAt: new Date(), updateBy: this.uid}, function (err, result) {
    if (err) {
      return callback(new errors.db.Remove(err.message || err.errmsg));
    }
    callback(err, result);
  });
};


Controller.prototype.update = function (callback) {

  var update = {};

  if (this.strict) {

    // Strict mode, the use of system time
    update.updateAt = new Date();
    if (this.uid) {
      update.updateBy = this.uid
    }
  } else {

    // In non-strict mode, the user specified time is attempted
    update.updateAt = this.data.updateAt || new Date();
    if (this.uid) {
      update.updateBy = this.data.updateBy || this.uid;
    }
  }

  if (this.id) {
    return this.model.update(this.id, _.extend(this.data, update), function (err, result) {
      if (err) {
        return callback(new errors.db.Update(err.message || err.errmsg));
      }
      callback(err, result);
    });
  }

  this.model.updateBy(this.condition, _.extend(this.data, update), function (err, result) {
    if (err) {
      return callback(new errors.db.Update(err.message || err.errmsg));
    }
    return callback(err, result);
  });
};


Controller.prototype.upsert = function (callback) {

  var update = {};

  if (this.strict) {

    // Strict mode, the use of system time
    update.createAt = new Date();
    update.updateAt = new Date();
    update.valid = constant.VALID;
    if (this.uid) {
      update.createBy = this.uid;
      update.updateBy = this.uid
    }
  } else {

    // In non-strict mode, the user specified time is attempted
    update.createAt = this.data.createAt || new Date();
    update.updateAt = this.data.updateAt || new Date();
    update.valid = _.isUndefined(this.data.valid) ? constant.VALID : this.data.valid;
    if (this.uid) {
      update.createBy = this.data.createBy || this.uid;
      update.updateBy = this.data.updateBy || this.uid
    }
  }

  this.model.upsert(this.condition, _.extend(this.data, update), function (err, result) {
    if (err) {
      return callback(new errors.db.Update(err.message || err.errmsg));
    }
    return callback(err, result);
  });
};


Controller.prototype.get = function (callback) {
  this.model.get(this.id || this.condition, function (err, result) {
    if (err) {
      return callback(new errors.db.Find(err.message || err.errmsg));
    }
    callback(err, result);
  });
};


Controller.prototype.list = function (callback) {

  this.model.total(this.condition, (err, count) => {
    if (err) {
      return callback(new errors.db.Find(err.message || err.errmsg));
    }

    this.model.getBy(this.condition, this.skip, this.limit, this.sort, this.select, (err, result) => {
      if (err) {
        return callback(new errors.db.Find(err.message || err.errmsg));
      }
      callback(err, {totalItems: count, items: result});
    });
  });
};


Controller.prototype.distinct = function (callback) {
  this.model.distinct(this.field, this.condition, function (err, result) {
    if (err) {
      return callback(new errors.db.Find(err.message || err.errmsg));
    }
    return callback(err, result);
  });
};


Controller.prototype.total = function (callback) {
  this.model.total(this.condition, function (err, result) {
    if (err) {
      return callback(new errors.db.Find(err.message || err.errmsg));
    }
    return callback(err, result);
  });
};


Controller.prototype.increment = function (callback) {

  this.model.increment(this.condition, this.select || "sequence", function (err, result) {
    if (err) {
      return callback(new errors.db.Update(err.message || err.errmsg));
    }
    return callback(err, result);
  });
};


Controller.prototype.fileToGrid = function (callback) {

  var self = this;
  async.map(self.files, function (file, next) {

    if (Buffer.isBuffer(file)) {

      self.model.bufferToGrid(file, function (err, result) {
        if (err || !result) {
          return next(err || new errors.db.Add("Failed to Save File"));
        }

        next(err, result);
      });
    } else if (file.fileStream) {
      self.model.streamToGrid(file, function (err, result) {
        if (err || !result) {
          return next(err || new errors.db.Add("Failed to Save File"));
        }

        next(err, result);
      });
    } else {

      file.base = file.base || path.resolve(process.cwd(), config.app.tmp);
      self.model.fileToGrid(file, function (err, result) {
        if (err || !result) {
          return next(err || new errors.db.Add("Failed to Save File"));
        }

        next(err, result);
      });
    }
  }, function (err, result) {

    callback(err, {totalItems: result.length, items: result});
  });
};


Controller.prototype.gridToFile = function (callback) {

  var folder = this.data.folder || path.resolve(process.cwd(), config.app.tmp)
    , base   = path.join(folder, this.data.name || helper.randomGUID8())
    , file   = this.id || this.condition.id;

  this.model.gridToFile(base, file, function (err, result) {
    if (err || !result) {
      return callback(err || new errors.db.Add("Failed to Save File"));
    }

    return callback(err, result);
  });
};


Controller.prototype.readFromGrid = function (callback) {

  this.model.readFromGrid(this.id, function (err, result) {
    if (err || !result) {
      return callback(err || new errors.db.Find("Failed to Read File"));
    }

    return callback(err, result);
  });
};


Controller.prototype.readStreamFromGrid = function (callback) {

  this.model.readStreamFromGrid(this.id, function (err, result) {
    if (err || !result) {
      return callback(err || new errors.db.Find("Failed to Read File"));
    }

    return callback(err, result);
  });
};

Controller.prototype.readStreamFromGridInRange = function (start, end, callback) {
  this.model.readStreamFromGridInRange(this.id, start, end, function (err, result) {
    if (err || !result) {
      return callback(err || new errors.db.Find("Failed to Read File"));
    }

    return callback(err, result);
  });
};

Controller.prototype.aggregate = function (agregate, callback) {

  this.model.aggregate(agregate, function (err, result) {
    if (err) {
      return callback(new errors.db.Find(err.message || err.errmsg));
    }

    return callback(err, result);
  });
};


Controller.prototype.dropDatabase = function (callback) {

  this.model.dropDatabase(function (err, result) {
    if (err) {
      return callback(new errors.db.Remove(err.message || err.errmsg));
    }

    return callback(err, result);
  });
};


Controller.prototype.changePassword = function (callback) {

  this.model.changePassword(this.data.user, this.data.pass, function (err, result) {
    if (err) {
      return callback(new errors.db.Update(err.message || err.errmsg));
    }

    return callback(err, result);
  });
};


Controller.prototype.createUser = function (callback) {

  var admin = config.db.root;

  this.model.createUser(admin, this.data.domain, this.data.user, this.data.pass, this.data.option, function (err, result) {
    if (err) {
      return callback(new errors.db.Add(err.message || err.errmsg));
    }

    return callback(err, result);
  });
};


Controller.prototype.dropUser = function (callback) {

  this.model.dropUser(this.data.user, function (err, result) {
    if (err) {
      return callback(new errors.db.Remove(err.message || err.errmsg));
    }

    return callback(err, result);
  });
};


Controller.prototype.addUser = function (callback) {

  this.model.addUser(this.data.user, this.data.pass, this.data.option, function (err, result) {
    if (err) {
      return callback(new errors.db.Add(err.message || err.errmsg));
    }

    return callback(err, result);
  });
};


Controller.prototype.dropCollection = function (callback) {

  this.model.dropCollection(function (err, result) {
    if (err) {
      return callback(new errors.db.Remove(err.message || err.errmsg));
    }

    return callback(err, result);
  });
};


Controller.prototype.command = function (callback) {

  var command = this.condition.command
    , option = this.condition.option
    , admin = config.db.root;

  this.model.command(command, option, admin, function (err, result) {
    if (err) {
      return callback(new errors.db.Find(err.message || err.errmsg));
    }

    return callback(err, result);
  });
};


Controller.prototype.dropSession = function (callback) {

  this.model.dropSession(this.id, function (err, result) {
    if (err) {
      return callback(new errors.db.Remove(err.message || err.errmsg));
    }

    return callback(err, result);
  });
};


Controller.prototype.serverStatus = function (callback) {
  const admin = config.db.root;
  this.model.serverStatus(admin, callback);
};


Controller.prototype.dbStatus = function (callback) {
  this.model.dbStatus(this.domain, callback);
};
