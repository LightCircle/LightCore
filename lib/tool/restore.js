/**
 * @file 重配置读取内容, 更新到数据库
 * @module restore
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var fs        = require("fs")
  , path      = require("path")
  , _         = require("underscore")
  , async     = require("async")
  , helper    = require("../helper")
  , cache     = require("../cache")
  , constant  = require("../constant")
  , Model     = require("../db/mongo/model")
  ;

var DEFAULT_USER = "000000000000000000000001"
  , FOLDER = "/setting";

exports.start = function (callback) {

  async.series([
    restoreValidator,
    restoreRoute,
    restoreConfig,
    restoreI18n,
    restoreUserStructure,
    restoreSystemStructure,
    restoreUserBoard,
    restoreSystemBoard,
    restoreUserFunction,
    restoreSystemFunction,
    restoreSetting
  ], callback);
};

function restoreUserFunction(callback) {
  restoreFunction(path.join(FOLDER, constant.SYSTEM_DB_FUNCTION + ".yml"), callback);
}

function restoreSystemFunction(callback) {
  restoreFunction(path.join(FOLDER, constant.SYSTEM_DB_FUNCTION + ".sys.yml"), callback);
}

function restoreFunction(file, callback) {

  fs.access(process.cwd() + file, fs.F_OK, function (err) {
    if (err) {
      return callback();
    }

    var data = helper.yamlLoader(file);
    upsert(constant.SYSTEM_DB_FUNCTION, data, ["kind", "parent", "menu"], callback);
  });
}

function restoreSetting(callback) {

  var file = path.join(FOLDER, constant.SYSTEM_DB_SETTING + ".yml");
  fs.access(process.cwd() + file, fs.F_OK, function (err) {
    if (err) {
      return callback();
    }

    var data = _.map(helper.yamlLoader(file), function (item) {
      item.description = item.description || "";
      return item;
    });

    upsert(constant.SYSTEM_DB_SETTING, data, ["type", "key"], callback);
  });
}

function restoreValidator(callback) {

  var file = path.join(FOLDER, constant.SYSTEM_DB_VALIDATOR + ".yml");
  fs.access(process.cwd() + file, fs.F_OK, function (err) {
    if (err) {
      return callback();
    }

    var data = _.map(helper.yamlLoader(file), function (item) {
      item.class = item.class || "";
      item.action = item.action || "";
      item.sanitize = item.sanitize || "";
      item.description = item.description || "";
      return item;
    });

    upsert(constant.SYSTEM_DB_VALIDATOR, data, ["name"], callback);
  });
}

function restoreRoute(callback) {

  var file = path.join(FOLDER, constant.SYSTEM_DB_ROUTE + ".yml");
  fs.access(process.cwd() + file, fs.F_OK, function (err) {
    if (err) {
      return callback();
    }

    var data = _.map(helper.yamlLoader(file), function (item) {
      item.class = item.class || "";
      item.action = item.action || "";
      return item;
    });

    upsert(constant.SYSTEM_DB_ROUTE, data, ["url"], callback);
  });
}

function restoreConfig(callback) {

  var file = path.join(FOLDER, constant.SYSTEM_DB_CONFIG + ".yml");
  fs.access(process.cwd() + file, fs.F_OK, function (err) {
    if (err) {
      return callback();
    }

    var data = _.map(helper.yamlLoader(file), function (item) {
      item.description = item.description || "";
      item.displayType = _.isUndefined(item.displayType) ? 0 : item.displayType;
      item.options = _.isUndefined(item.options) ? [] : item.options;
      return item;
    });

    upsert(constant.SYSTEM_DB_CONFIG, data, ["type", "key"], callback);
  });
}

function restoreI18n(callback) {

  var file = path.join(FOLDER, constant.SYSTEM_DB_I18N + ".yml");
  fs.access(process.cwd() + file, fs.F_OK, function (err) {
    if (err) {
      return callback();
    }

    var data = helper.yamlLoader(file);
    upsert(constant.SYSTEM_DB_I18N, data, ["type", "key"], callback);
  });
}

function restoreUserBoard(callback) {
  restoreBoard(path.join(FOLDER, constant.SYSTEM_DB_BOARD + ".yml"), callback);
}

function restoreSystemBoard(callback) {
  restoreBoard(path.join(FOLDER, constant.SYSTEM_DB_BOARD + ".sys.yml"), callback);
}

function restoreBoard(file, callback) {

  fs.access(process.cwd() + file, fs.F_OK, function (err) {
    if (err) {
      return callback();
    }

    var data = _.map(helper.yamlLoader(file), function (item) {
      item.path = item.path || "";
      item.sorts = _.isUndefined(item.sorts) ? [] : item.sorts;
      item.filters = _.isUndefined(item.filters) ? [] : item.filters;
      return item;
    });

    upsert(constant.SYSTEM_DB_BOARD, data, ["api"], callback);
  });
}

function restoreUserStructure(callback) {
  restoreStructure(path.join(FOLDER, constant.SYSTEM_DB_STRUCTURE + ".yml"), callback);
}

function restoreSystemStructure(callback) {
  restoreStructure(path.join(FOLDER, constant.SYSTEM_DB_STRUCTURE + ".sys.yml"), callback);
}

function restoreStructure(file, callback) {

  fs.access(process.cwd() + file, fs.F_OK, function (err) {
    if (err) {
      return callback();
    }

    var data = _.map(helper.yamlLoader(file), function (item) {
      item.version = item.version || "";
      item.public = _.isUndefined(item.public) ? 0 : item.public;
      item.lock = _.isUndefined(item.lock) ? 0 : item.lock;
      item.extend = _.isUndefined(item.extend) ? [] : item.extend;

      item.items._id = {name: "ID", reserved: 1, type: "ObjectID", description: ""};
      item.items.valid = {name: "有效标识", reserved: 1, type: "Number", description: "1:有效 0:无效"};
      item.items.updateAt = {name: "更新时间", reserved: 1, type: "Date", description: ""};
      item.items.updateBy = {name: "更新者", reserved: 1, type: "String", description: ""};
      item.items.createAt = {name: "创建时间", reserved: 1, type: "Date", description: ""};
      item.items.createBy = {name: "创建者", reserved: 1, type: "String", description: ""};

      return item;
    });

    upsert(constant.SYSTEM_DB_STRUCTURE, data, ["schema"], callback);
  });
}

function upsert(target, data, keys, callback) {

  var model = new Model(process.env.APPNAME, constant.SYSTEM_DB_PREFIX, target);

  async.eachSeries(data, function (item, loop) {

    var condition = _.reduce(keys, function (memo, key) {
      memo[key] = item[key];
      return memo;
    }, {});

    model.total(condition, function (err, isExist) {
      if (err) {
        return loop(err);
      }

      if (isExist) {
        return model.updateBy(condition, regular(item, 'update'), loop);
      }

      return model.add(regular(item, 'add'), loop);
    });
  }, callback);
}

function regular(data, type) {
  
  data.updateAt = new Date();
  data.updateBy = constant.VALID;

  if (type == 'add') {
    data.createAt = data.updateAt;
    data.createBy = DEFAULT_USER;
    data.valid = constant.VALID;
  }
  return data;
}