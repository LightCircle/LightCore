/**
 * @file 保存配置
 * @module dump
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

var FOLDER = "setting";

exports.start = function (callback) {

  fs.access(FOLDER, fs.F_OK, function (err) {
    if (err) {
      fs.mkdirSync(FOLDER);
    }
    
    async.series([
      dumpFunction,
      dumpSetting,
      function (next) {
        dumpConfig();
        dumpValidator();
        dumpI18n();
        dumpStructure();
        dumpBoard();
        dumpRoute();
        next();
      }
    ], callback);
  });
};

function dumpFunction(callback) {

  var select = "url,type,status,reserved,parent,order,menu,kind,icon,description"
    , model = new Model(process.env.APPNAME, constant.SYSTEM_DB_PREFIX, constant.SYSTEM_DB_FUNCTION);

  model.getBy({valid: 1}, 0, Number.MAX_VALUE, {order: 1}, select, function (err, data) {
    if (err) {
      return callback(err);
    }

    var sys = _.filter(data, function (item) {
      delete item._id;
      return item.reserved == 1;
    }), user = _.filter(data, function (item) {
      delete item._id;
      return item.reserved == 2;
    });

    fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_FUNCTION + ".yml"), helper.yamlDumper(user));
    fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_FUNCTION + ".sys.yml"), helper.yamlDumper(sys));
    callback();
  });
}

function dumpSetting(callback) {

  var select = "type,key,value,description"
    , model = new Model(process.env.APPNAME, constant.SYSTEM_DB_PREFIX, constant.SYSTEM_DB_SETTING);

  model.getBy({valid: 1}, 0, Number.MAX_VALUE, {type: 1, key: 1}, select, function (err, data) {
    if (err) {
      return callback(err);
    }

    var result = _.map(data, function (item) {
      delete item._id;
      delete_if_blank(item, "description");
      return item;
    });

    fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_SETTING + ".yml"), helper.yamlDumper(result));
    callback();
  });
}

function dumpRoute() {
  var result = _.map(cache.get(constant.SYSTEM_DB_ROUTE), function (item) {
    delete item._id;

    delete_if_blank(item, 'class');
    delete_if_blank(item, 'action');

    return item;
  });

  fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_ROUTE + '.yml'), helper.yamlDumper(result));
}

function dumpBoard() {
  const result = cache.get(constant.SYSTEM_DB_BOARD).map(item => {
    delete item._id;

    delete_if_empty(item, 'sorts');
    delete_if_empty(item, 'filters');
    delete_if_blank(item, 'path');

    return item;
  });

  const user = result.filter(item => [0, 1].includes(item.kind)),
        sys  = result.filter(item => [2, 3].includes(item.kind));

  fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_BOARD + '.yml'), helper.yamlDumper(user));
  fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_BOARD + '.sys.yml'), helper.yamlDumper(sys));
}

function dumpStructure() {
  const result = cache.get(constant.SYSTEM_DB_STRUCTURE).map(item => {
    delete item._id;
    delete item.items._id;
    delete item.items.valid;
    delete item.items.createAt;
    delete item.items.createBy;
    delete item.items.updateAt;
    delete item.items.updateBy;

    delete_if_zero(item, 'public');
    delete_if_zero(item, 'lock');
    delete_if_empty(item, 'extend');
    delete_if_blank(item, 'version');

    return item;
  });

  const user = result.filter(item => [0, 1].includes(item.kind)),
        sys  = result.filter(item => [2, 3].includes(item.kind));

  fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_STRUCTURE + '.yml'), helper.yamlDumper(user));
  fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_STRUCTURE + '.sys.yml'), helper.yamlDumper(sys));
}

function dumpI18n() {
  var result = _.map(cache.get(constant.SYSTEM_DB_I18N), function (item) {
    delete item._id;
    return item;
  });

  fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_I18N + ".yml"), helper.yamlDumper(result));
}

function dumpConfig() {
  var result = _.map(cache.get(constant.SYSTEM_DB_CONFIG), function (item) {
    delete item._id;

    delete_if_blank(item, "description");
    delete_if_zero(item, "displayType");
    delete_if_empty(item, "options");

    return item;
  });

  fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_CONFIG + ".yml"), helper.yamlDumper(result));
}

function dumpValidator() {
  var result = _.map(cache.get(constant.SYSTEM_DB_VALIDATOR), function (item) {

    delete item._id;

    delete_if_blank(item, "sanitize");
    delete_if_blank(item, "class");
    delete_if_blank(item, "action");
    delete_if_blank(item, "description");

    return item;
  });

  fs.writeFileSync(path.join(FOLDER, constant.SYSTEM_DB_VALIDATOR + ".yml"), helper.yamlDumper(result));
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