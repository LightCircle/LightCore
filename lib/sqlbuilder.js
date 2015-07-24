/**
 * @file SQL编译器
 *  模拟iBATIS的Mapper XML Files.
 * @author r2space@gmail.com
 * @module light.core.sqlbuilder
 * @version 1.0.0
 */

"use strict";

var helper    = require("./helper")
  , _         = require("underscore")
  , document  = undefined;
  ;

exports.select = function(id, param) {
  return generate("select", id, param);
};

exports.insert = function(id, param) {
  return generate("insert", id, param);
};

exports.update = function(id, param) {
  return generate("update", id, param);
};

exports.delete = function(id, param) {
  return generate("delete", id, param);
};

exports.sql = function(id, param) {
  return generate("sql", id, param);
};

function generate(type, id, param) {

  var nodes = document.sql[type];
  var sql = _.find(nodes, function(node) {
    return node.$.id == id;
  });

  if (sql) {
    sql = _.isString(sql) ? sql : sql._;
    sql = sql.replace(/\n/g, " ");
    sql = sql.replace(/[ ]+/g, " ");

    return helper.ejsFormat(sql, param);
  }

  return "";
}

function load() {
  helper.xmlParser("/config/sql.xml", function(err, xml) {
    document = xml;
  });
}

load();
