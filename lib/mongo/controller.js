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
 * @module light.core.mongo.controller
 * @version 1.0.0
 */

"use strict";

var path     = require("path")
  , async    = require("async")
  , _        = require("underscore")
  , ObjectID = require("mongodb").ObjectID
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

  var domain  = handler.domain || process.env.APPNAME
    , code    = handler.code
    , account = handler.db || {}
    , params  = handler.params || {};

  if (domain == constant.LOG_DB) {
    account = config.db.logdb;
  }

  // Model实例
  this.model = new Model(domain, code, table, define, account.user, account.pass);
  this.domain = domain;

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
};


Controller.prototype.add = function (callback) {

  var insert = {
    createAt: new Date(),
    updateAt: new Date(),
    valid   : constant.VALID
  };

  if (this.uid) {
    insert.createBy = this.uid;
    insert.updateBy = this.uid
  }

  var data = undefined;
  if (_.isArray(this.data)) {
    data = _.map(this.data, function (item) {
      return _.extend(item, insert);
    });
  } else {
    data = _.extend(this.data, insert);
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

  var update = {
    updateAt: new Date()
  };

  if (this.uid) {
    update.updateBy = this.uid
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

  var update = {
    createAt: new Date(),
    updateAt: new Date(),
    valid   : constant.VALID
  };

  if (this.uid) {
    update.createBy = this.uid;
    update.updateBy = this.uid
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
  var self = this;

  self.model.total(self.condition, function (err, count) {
    if (err) {
      return callback(new errors.db.Find(err.message || err.errmsg));
    }

    self.model.getBy(self.condition, self.skip, self.limit, self.sort, self.select, function (err, result) {
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

  this.model.increment(this.condition, this.select, function (err, result) {
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
    } else {

      self.model.fileToGrid(config.app.tmp, file, function (err, result) {
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

  var base = path.join(this.data.folder || config.app.tmp, this.data.name || helper.randomGUID8())
    , file = this.id || this.condition.id;

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
