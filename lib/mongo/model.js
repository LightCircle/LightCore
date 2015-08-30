/**
 * @file 存取数据用的Mongoose模块
 *
 * 提供如下方法
 *  add & insert  添加
 *  update        指定ID 更新
 *  updateBy      指定条件 更新（复数件）
 *  upsertBy      指定条件 更新或新规（复数件）
 *  remove        指定ID 删除
 *  removeBy      指定条件 删除
 *  get           指定ID
 *  getBy         指定条件
 *  getCursor     指定条件
 *  distinct      检索，并去掉相同的数据
 *  total & count 获取数据件数
 *  increment     累加
 *  getDBStats    获取DB状态
 *  serverStatus  获取实例状态
 *  getDBList     获取当前实例的所有DB
 * TODO:
 *  aggregate
 *  group
 *  delete
 *  index
 * @author r2space@gmail.com
 * @module light.core.mongo.model
 * @version 1.0.0
 */

"use strict";

var _         = require("underscore")
  , fs        = require("fs")
  , path      = require("path")
  , ObjectID  = require("mongodb").ObjectID
  , GridStore = require("mongodb").GridStore
  , mongo     = require("./connection")
  , constant  = require("../constant")
  , log       = require("../log")
  , helper    = require("./helper")
  , mapping   = require("./mapping")
  , async     = require("async")
  ;


/**
 * 构造函数
 * @param {String} domain 数据库名
 * @param {String} code tenant名
 * @param {String} table collection名称
 * @param {Object} define collection定义
 * @param {String} user 数据库用户名
 * @param {String} pass 数据库密码
 */
var Model = module.exports = function Model(domain, code, table, define, user, pass) {

  this.domain = domain;
  this.define = define;
  this.user   = user;
  this.pass   = pass;
  this.db     = undefined;

  //当使用Log DB时 表名不变复数
  if (this.domain === constant.LOG_DB) {
    this.table = table;
  } else {
    this.table = helper.collection(table);
  }

  // 当使用系统DB或log DB时，则表名不加前缀
  if (this.domain === constant.SYSTEM_DB || this.domain === constant.LOG_DB) {
    this.code = this.table;
  } else if (this.table == 'tenants') {
    this.code = this.table;
  } else {
    this.code = code ? code + "." + this.table : this.table;
  }

  console.log(this.domain + " / " + this.code);
};


/**
 * OK 获取数据库连接
 * @param {Object} self Mode实例
 * @param {Function} callback
 */
function db(self, callback) {

  if (self.db) {
    return callback(undefined, self.code ? self.db.collection(self.code) : self.db);
  }

  mongo.connect(self.domain, self.user, self.pass, function (err, db) {

    self.db = db;
    callback(err, self.code ? db.collection(self.code) : db);
  });
}

// TODO 和 db方法合并
function griddb(self, callback) {

  if (self.db) {
    return callback(undefined, self.db);
  }

  mongo.connect(self.domain, self.user, self.pass, function (err, db) {

    self.db = db;
    callback(err, db);
  });
}


/**
 * OK 添加数据
 *  可以指定单个对象，也可以指定一个数组
 *  insert数据会根据define进行类型转换
 *
 *  返回值是插入到数据库中的对象
 *
 * @param {Object | Array} insert 数据
 * @param {Function} callback 回调函数 插入的对象，或对象数组
 */
Model.prototype.add = Model.prototype.insert = function (insert, callback) {

  insert = mapping.dataParseAll(mapping.default(insert, this.define), this.define);
  db(this, function (err, db) {
    db.insert(insert, function (err, result) {
      if (err) {
        return callback(err);
      }

      callback(err, _.isArray(insert) ? result.ops : result.ops[0]);
    });
  });
};


Model.prototype.insert = Model.prototype.add;


/**
 * 用ID删除数据
 * @param {String} id
 * @param {Object} update 数据
 * @param {Function} callback 回调函数
 */
Model.prototype.remove = function (id, update, callback) {

  if (_.isFunction(update)) {
    callback = update;
    update = {};
  }
  update = update || {};
  update.valid = constant.INVALID;
  update = mapping.dataParseAll(update, this.define);

  var filter = {_id: ObjectID(id)};
  db(this, function (err, db) {
    db.updateOne(filter, {$set: update}, function (err, result) {
      if (err) {
        return callback(err);
      }

      callback(err, result.matchedCount);
    });
  });
};


/**
 * 用给定条件删除数据
 * @param {Object} filter 条件
 * @param {Object} update 数据
 * @param {Function} callback 回调函数
 */
Model.prototype.removeBy = function (filter, update, callback) {

  if (_.isFunction(update)) {
    callback = update;
    update = {};
  }

  update = update || {};
  update.valid = constant.INVALID;
  update = mapping.dataParseAll(update, this.define);

  filter = mapping.queryParseAll(filter, this.define);

  db(this, function (err, db) {
    db.updateMany(filter, {$set: update}, function (err, result) {
      if (err) {
        return callback(err);
      }

      callback(err, result.matchedCount);
    });
  });
};


/**
 * 用ID更新数据
 *  返回结果是更新以后的数据
 * @param {String} id
 * @param {Object} update 数据
 * @param {Function} callback 回调函数
 */
Model.prototype.update = function (id, update, callback) {

  var filter = {_id: ObjectID(id)};
  update = mapping.dataParseAll(update, this.define);
  addSetOperator(update);

  db(this, function (err, db) {
    db.updateOne(filter, update, function (err) {
      if (err) {
        return callback(err);
      }

      db.findOne(filter, callback);
    });
  });
};


/**
 * 用给定条件更新
 *  返回结果是更新的件数
 * @param {Object} filter 条件
 * @param {Object} update 数据
 * @param {Function} callback 回调函数
 */
Model.prototype.updateBy = function (filter, update, callback) {

  filter = mapping.queryParseAll(filter, this.define);
  update = mapping.dataParseAll(update, this.define);
  addSetOperator(update);

  db(this, function (err, db) {
    db.updateMany(filter, update, function (err, result) {
      if (err) {
        return callback(err);
      }

      callback(err, result.matchedCount);
    });
  });
};


/**
 * OK 用给定条件更新，没有指定的条件则插入数据
 *
 * 注意
 *  upsert必须指定condition，即不能用id更新
 *  更新条件没有找到数据，则插入一条数据，并返插入的数据的_id
 *  update 不能是数组，不能为空
 *  如果是更新，返回更新的数据件数
 *
 * @param {String} filter
 * @param {Object} update 数据
 * @param {Function} callback 回调函数
 */
Model.prototype.upsert = function (filter, update, callback) {

  filter = mapping.queryParseAll(filter, this.define);
  update = mapping.dataParseAll(update, this.define);
  addSetOperator(update);

  db(this, function (err, db) {
    db.updateMany(filter,update, {upsert: true}, function (err, result) {
      if (err) {
        return callback(err);
      }

      callback(err, result.upsertedId ? result.upsertedId._id : result.matchedCount);
    });
  });
};

/**
 * 给没有加$set的更新键值对加上$set
 * @param {Object} update 需要更新的项目
 */
function addSetOperator (update) {
  var operatorRegexp = /^\$.*/;
  update.$set = {};
  _.each(update, function(v, k) {
    if (!operatorRegexp.test(k)) {
      update.$set[k] = v;
      delete update[k];
    }
  });
  if (_.isEmpty(update.$set)) {
    delete update.$set;
  }
}

/**
 * OK 获取数据
 *  条件
 *   可以是 字符串的_id值, ObjectID类型的值
 *   可以是 普通的mongodb条件
 *
 *  select
 *   可以不指定，用于指定需要检索的字段
 *
 * @param {String | Object} filter 或 条件
 * @param {String} select 获取的项目
 * @param {Function} callback 回调函数 返回对象，没有时为null
 */
Model.prototype.get = function (filter, select, callback) {

  if (_.isFunction(select)) {
    callback = select;
    select = {};
  }

  var isID    = _.isString(filter) || filter instanceof ObjectID
    , options = {fields: helper.fields(select)};

  filter = isID ? {_id: filter} : filter;
  filter = mapping.queryParseAll(filter, this.define);

  db(this, function (err, db) {
    db.findOne(filter, options, callback);
  });
};


/**
 * 获取数据一览
 * @param {Object} filter 查询条件
 * @param {Number} skip 跳过的文书数，默认为0
 * @param {Number} limit 返回的文书的上限数目，默认为20
 * @param {Object} sort 排序
 * @param {Object} select 获取的项目
 * @param {Function} callback 回调函数
 */
Model.prototype.getBy = function (filter, skip, limit, sort, select, callback) {

  if (_.isFunction(skip)) {
    callback = skip;
    skip = 0;
    limit = constant.DB_DEFAULT_LIMIT;
    select = {};
    sort = {};
  }

  if (_.isFunction(limit)) {
    callback = limit;
    limit = constant.DB_DEFAULT_LIMIT;
    select = {};
    sort = {};
  }

  if (_.isFunction(sort)) {
    callback = sort;
    select = {};
    sort = {};
  }

  if (_.isFunction(select)) {
    callback = select;
    select = {};
  }

  filter = mapping.queryParseAll(filter, this.define);
  db(this, function (err, db) {

    var options = {
      fields: helper.fields(select),
      skip  : skip,
      limit : limit || constant.DB_DEFAULT_LIMIT,
      sort  : helper.sort(sort)
    };

    log.debug(filter);
    log.debug(options);
    db.find(filter, options).toArray(callback);
  });
};


/**
 * 获取游标
 * @param param
 * @param callback
 */
Model.prototype.getCursor = function (param, callback) {

  var filter = mapping.queryParseAll(param.filter, this.define);
  db(this, function (err, db) {

    var options = {
      fields: helper.fields(param.select),
      skip  : param.skip,
      limit : param.limit,
      sort  : helper.sort(param.sort)
    };

    callback(err, db.find(filter, options));
  });
};


/**
 * 获取DB一览
 * @param {Function} callback
 */
Model.prototype.getDBList = function (callback) {

  mongo.connect(this.domain, this.user, this.pass, function (err, db) {
    if (err) {
      return callback(err);
    }
    var adminDb = db.admin();
    adminDb.listDatabases(callback);
  });
};

/**
 * 获取数据库服务器状态
 * @param {Function} callback
 */
Model.prototype.serverStatus = function (callback) {

  mongo.connect(this.domain, this.user, this.pass, function (err, db) {
    if (err) {
      return callback(err);
    }
    var adminDb = db.admin();
    adminDb.serverStatus(callback);
  });
};


/**
 * 获取数据库状态
 * @param {String} dbname 数据库名
 * @param {Function} callback
 */
Model.prototype.getDBStats = function (dbname, callback) {
  //需要的是db而不是collection
  mongo.connect(this.domain, this.user, this.pass, function (err, db) {
    if (err) {
      return callback(err);
    }
    var target = db.db(dbname);
    target.stats(callback);
  });
};

/**
 * 获取DB下的所有collection及其状态
 * @param {String} dbname 数据库名
 * @param {Function} callback
 */
Model.prototype.getCollStats = function (dbname, callback) {
  //需要的是db而不是collection
  mongo.connect(this.domain, this.user, this.pass, function (err, db) {
    if (err) {
      return callback(err);
    }
    db.listCollections().toArray(function (err, collections) {
      if (err) {
        return callback(err);
      }
      async.mapSeries(collections, function (item, next) {
        db.collection(item.name).stats(function (err, result) {
          if (err) {
            return next(err);
          }
          result.collName = item.name;
          return next(err, result);
        });
      }, callback);
    });
  });
};
/**
 * 获取DB下某个collection的所有索引
 * @param {String} dbname 数据库名
 * @param {String} collName 表名
 * @param {Function} callback
 */
Model.prototype.getCollIndexes = function (dbname, collName, callback) {
  //需要的是db而不是collection
  mongo.connect(this.domain, this.user, this.pass, function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection(collName).indexes(callback);
  });
};


/**
 * 创建索引
 * @param {String} dbname 数据库名
 * @param {String} collName 表名
 * @param {Object} value 索引
 * @param {Object} options 索引选项
 * @param {Function} callback
 */
Model.prototype.createIndex = function (dbname, collName, value, options, callback) {
  //需要的是db而不是collection
  mongo.connect(this.domain, this.user, this.pass, function (err, db) {
    if (err) {
      return callback(err);
    }
    db.createIndex(collName, value, options, callback);
  });
};

/**
 * 创建索引
 * @param {String} dbname 数据库名
 * @param {String} collName 表名
 * @param {String} indexName 索引名
 * @param {Function} callback
 */
Model.prototype.dropIndex = function (dbname, collName, indexName, callback) {
  //需要的是db而不是collection
  mongo.connect(this.domain, this.user, this.pass, function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection(collName).dropIndex(indexName, callback);
  });
};


/**
 * 检索，并去掉相同的数据
 * @param {String} key Field of the document to find distinct values for.
 * @param {Object} filter 条件
 * @param {Function} callback 回调函数
 */
Model.prototype.distinct = function (key, filter, callback) {

  if (_.isFunction(filter)) {
    callback = filter;
    filter = {};
  }

  filter = mapping.queryParseAll(filter, this.define);
  db(this, function (err, db) {
    db.distinct(key, filter, callback);
  });
};

/**
 * 获取总件数
 * @param {Object} filter 条件
 * @param {Function} callback 回调函数
 */
Model.prototype.total = function (filter, callback) {
  filter = mapping.queryParseAll(filter, this.define);
  db(this, function (err, db) {
    db.count(filter, callback);
  });
};


Model.prototype.count = Model.prototype.total;


/**
 * 获取Collection定义
 * @returns {Object}
 */
Model.prototype.schema = function () {
  return this.define;
};


/**
 * 累加功能
 * @param {Object} filter 条件
 * @param {String} key 累计的字段
 * @param {Function} callback 回调函数
 */
Model.prototype.increment = function (filter, key, callback) {

  var inc = {};
  inc[key] = 1;

  var update  = {$inc: inc},
      options = {upsert: true};

  filter = mapping.queryParseAll(filter, this.define);
  db(this, function (err, db) {
    db.findOneAndUpdate(filter, update, options, function (err, result) {
      if (err) {
        return callback(err);
      }

      callback(err, result.value[key] + 1);
    });
  });
};


/**
 * 物理文件写到GridStore里
 * @param {String} base 物理文件所在的目录
 * @param {Object} file 物理文件
 *  originalFilename        : 文件名称
 *  headers['content-type'] : ContentType
 *  path                    : 物理文件名称
 * @param {Object} callback
 *  fileId
 *  length
 *  name
 *  contentType
 */
Model.prototype.fileToGrid = function (base, file, callback) {

  griddb(this, function (err, db) {

    var fileName = path.basename(file.originalFilename)
      , options  = {content_type: file.headers["content-type"]};
    var store = new GridStore(db, new ObjectID(), fileName, constant.DB_GRIDSTORE_WRITE, options);

    store.open(function (err, grid) {
      if (err) {
        return callback(err);
      }

      var filePath = fs.realpathSync(path.join(base, path.basename(file.path)));
      grid.writeFile(filePath, function (err, doc) {
        if (err) {
          return callback(err);
        }

        var meta = {
          fileId     : doc.fileId,
          length     : doc.position ? doc.position : 0,
          name       : doc.filename,
          contentType: doc.contentType
        };
        callback(err, meta);
      });
    });
  });
};


/**
 * @desc Buffer写入到GridStore里
 * @param buffer
 * @param callback
 */
Model.prototype.bufferToGrid = function (buffer, callback) {

  griddb(this, function (err, db) {

    var options = {content_type: "application/octet-stream"}
      , store = new GridStore(db, new ObjectID(), "temp", constant.DB_GRIDSTORE_WRITE, options);

    store.open(function (err, grid) {
      if (err) {
        return callback(err);
      }

      grid.write(buffer, function (err, grid) {
        if (err) {
          return callback(err);
        }

        grid.close(function(err, doc) {
          var meta = {
            fileId: doc._id,
            length: doc.length,
            name: doc.filename,
            contentType: doc.contentType
          };
          callback(err, meta);
        });
      });
    });
  });
};


/**
 * GridStore文件输出到物理文件
 * @param base 文件路径
 * @param file 文件ID
 * @param callback
 */
Model.prototype.gridToFile = function (base, file, callback) {

  griddb(this, function (err, db) {

    var id = new ObjectID(file);
    GridStore.exist(db, id, function (err, exists) {
      if (err || !exists) {
        return callback(err);
      }

      var store = new GridStore(db, id, constant.DB_GRIDSTORE_READ);
      store.open(function (err, grid) {
        if (err) {
          return callback(err);
        }

        var fileStream = fs.createWriteStream(base);
        fileStream.on("close", function (err) {
          callback(err, base);
        });

        grid.stream().pipe(fileStream);
      });
    });
  });
};


/**
 * 文件读到内存
 * @param file 文件ID
 * @param callback
 */
Model.prototype.readFromGrid = function (file, callback) {

  griddb(this, function (err, db) {

    var id = new ObjectID(file);
    GridStore.exist(db, id, function (err, exists) {
      if (err || !exists) {
        return callback(err);
      }

      var store = new GridStore(db, id, constant.DB_GRIDSTORE_READ);
      store.open(function (err, grid) {
        if (err) {
          return callback(err);
        }

        grid.seek(0, function (err, grid) {
          if (err) {
            return callback(err);
          }

          grid.read(function (err, data) {
            var meta = {
              filename   : grid.filename,
              contentType: grid.contentType,
              length     : grid.length,
              uploadDate : grid.uploadDate,
              fileData   : data
            };
            callback(err, meta);
          });
        });
      });
    });
  });
};

Model.prototype.aggregate = function (agregate, callback) {
  db(this, function (err, db) {
    db.aggregate(agregate, callback);
  });
};

/**
 * 删除数据库
 * @param callback
 */
Model.prototype.dropDatabase = function (callback) {

  mongo.connect(this.domain, this.user, this.pass, function (err, db) {
    db.dropDatabase(callback);
  });
};

/**
 * 修改密码
 *  现在的driver，没有提供修改密码的api，想到的方法有两种
 *  - 通过eval调用db.changeUserPassword
 *  - 删除指定用户，创建新用户，创建新用户的时候可以指定密码
 * @param admin
 * @param user
 * @param pass
 * @param callback
 */
Model.prototype.changePassword = function (admin, user, pass, callback) {

  var self = this, option = {roles: ["dbOwner"]};
  db(this, function (err) {
    if (err) {
      return callback(err);
    }

    // 切换到其他账户
    self.db.authenticate(admin.user, admin.pass, function () {
      if (err) {
        return callback(err);
      }

      // 删除用户
      self.db.removeUser(user, function (err) {
        if (err) {
          return callback(err);
        }

        // 重新创建用户
        self.db.addUser(user, pass, option, function (err) {
          if (err) {
            return callback(err);
          }

          // 认证新用户
          self.db.authenticate(user, pass, callback);
        });
      });
    });
  });
};

/**
 * 创建空的DB，并为DB添加账户
 * 如果要往已有的DB添加用户，可以使用addUser方法
 * @param admin 管理员账户 需要userAdminAnyDatabase权限
 * @param domain 数据库名
 * @param user 用户名
 * @param pass 用户密码
 * @param option roles 默认为dbOwner
 * @param callback
 */
Model.prototype.createUser = function (admin, domain, user, pass, option, callback) {

  if (_.isFunction(option)) {
    callback = option;
  }

  option = option || {roles: ["dbOwner"]};

  var self = this;
  db(this, function (err) {
    if (err) {
      return callback(err);
    }

    // 登陆到admin
    self.db.admin().authenticate(admin.user, admin.pass, function (err) {
      if (err) {
        return callback(err);
      }

      // 创建数据库
      var db = self.db.db(domain);

      // 给数据库添加用户
      db.addUser(user, pass, option, function (err) {
        if (err) {
          return callback(err);
        }

        // 认证
        db.authenticate(user, pass, callback);
      });
    });
  });
};

/**
 * 添加用户
 * @param user
 * @param pass
 * @param option
 * @param callback
 */
Model.prototype.addUser = function (user, pass, option, callback) {

  if (_.isFunction(option)) {
    callback = option;
  }

  option = option || {roles: ["dbOwner"]};

  var self = this;
  db(this, function (err) {
    if (err) {
      return callback(err);
    }

    self.db.addUser(user, pass, option, callback);
  });
};

/**
 * 删除用户
 * @param user
 * @param callback
 */
Model.prototype.dropUser = function (user, callback) {

  var self = this;
  db(this, function (err) {
    if (err) {
      return callback(err);
    }

    self.db.removeUser(user, callback);
  });
};

/**
 * 重命名collection
 * @param {String} collName 表名
 * @param {String} newName 新表名
 * @param {Function} callback
 */
Model.prototype.renameCollection = function(collName,newName,callback){
  var self = this;
  db(this, function (err) {
    if (err) {
      return callback(err);
    }

    return self.db.collection(collName).rename(newName,callback);
  });
};
