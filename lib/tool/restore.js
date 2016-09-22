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
  , helper    = require("../helper")
  , cache     = require("../cache")
  , constant  = require("../constant")
  ;

exports.start = function (callback) {

  var folder = "/setting";

  // restoreConfig(folder);
  //   restoreValidator(folder);
  //   restoreI18n(folder);
  //   restoreStructure(folder);
  //   restoreBoard(folder);
    restoreRoute(folder);

    callback();

};

function restoreRoute(folder) {

  var file = path.join(folder, constant.SYSTEM_DB_ROUTE + ".yml1");
  fs.access(process.cwd() + file, fs.F_OK, function (err) {
    if (err) {
      return;
    }

    var data = _.map(helper.yamlLoader(file), function (item) {
      item.class = item.class || "";
      item.action = item.action || "";
      return item;
    });

    // check exist
  });
}

function restoreBoard(folder) {
  var result = _.map(cache.get(constant.SYSTEM_DB_BOARD), function (item) {
    delete item._id;

    delete_if_empty(item, "sorts");
    delete_if_empty(item, "filters");
    delete_if_blank(item, "path");

    return item;
  });

  var sys = _.filter(result, function (item) {
    return item.kind == 2;
  }), user = _.filter(result, function (item) {
    return item.kind < 2;
  });

  fs.writeFileSync(path.join(folder, constant.SYSTEM_DB_BOARD + ".yml"), helper.yamlDumper(user));
  fs.writeFileSync(path.join(folder, "sys." + constant.SYSTEM_DB_BOARD + ".yml"), helper.yamlDumper(sys));
}

function restoreStructure(folder) {
  var result = _.map(cache.get(constant.SYSTEM_DB_STRUCTURE), function (item) {
    delete item._id;
    delete item.items._id;
    delete item.items.valid;
    delete item.items.createAt;
    delete item.items.createBy;
    delete item.items.updateAt;
    delete item.items.updateBy;

    delete_if_zero(item, "public");
    delete_if_zero(item, "lock");
    delete_if_empty(item, "extend");
    delete_if_blank(item, "version");

    return item;
  });

  var sys = _.filter(result, function (item) {
    return item.kind == 2;
  }), user = _.filter(result, function (item) {
    return item.kind < 2;
  });

  fs.writeFileSync(path.join(folder, constant.SYSTEM_DB_STRUCTURE + ".yml"), helper.yamlDumper(user));
  fs.writeFileSync(path.join(folder, "sys." + constant.SYSTEM_DB_STRUCTURE + ".yml"), helper.yamlDumper(sys));
}

function restoreI18n(folder) {
  var result = _.map(cache.get(constant.SYSTEM_DB_I18N), function (item) {
    delete item._id;
    return item;
  });

  fs.writeFileSync(path.join(folder, constant.SYSTEM_DB_I18N + ".yml"), helper.yamlDumper(result));
}

function restoreConfig(folder) {
  var result = _.map(cache.get(constant.SYSTEM_DB_CONFIG), function (item) {
    delete item._id;

    delete_if_blank(item, "description");
    delete_if_zero(item, "displayType");

    return item;
  });

  fs.writeFileSync(path.join(folder, constant.SYSTEM_DB_CONFIG + ".yml"), helper.yamlDumper(result));
}

function restoreValidator(folder) {
  var result = _.map(cache.get(constant.SYSTEM_DB_VALIDATOR), function (item) {

    delete item._id;

    delete_if_blank(item, "sanitize");
    delete_if_blank(item, "class");
    delete_if_blank(item, "action");
    delete_if_blank(item, "description");

    return item;
  });

  fs.writeFileSync(path.join(folder, constant.SYSTEM_DB_VALIDATOR + ".yml"), helper.yamlDumper(result));
}

function delete_if_blank(item, key) {
  if (!item[key]) {
    delete item[key];
  }
}

function delete_if_zero(item, key) {
  if (item[key] == 0) {
    delete item[key];
  }
}

function delete_if_empty(item, key) {
  if (_.isEmpty(item[key])) {
    delete item[key];
  }
}