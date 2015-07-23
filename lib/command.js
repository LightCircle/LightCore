/**
 * @file 命令行辅助工具
 * @author r2space@gmail.com
 * @module light.core.command
 * @version 1.0.0
 */

"use strict";

var exec  = require("child_process").exec
  , conn  = require("./mongo/connection");

/**
 * 执行本地sh命令
 * @param command
 * @param callback
 */
exports.runCommand = function(command, callback) {
  return exec(command, function (error, stdout) {
    callback(error, stdout);
  });
};

/**
 * 执行远程sh命令
 * @param host
 * @param command
 * @param callback
 */
exports.runRemoteCommand = function(host, command, callback) {
  var cmd = "ssh -i tool/amazon.pem root@" + host + " '" + command + "'";
  exports.runCommand(cmd, callback);
};

/**
 * 执行Mongodb Admin命令
 * @param code
 * @param command
 * @param callback
 */
exports.runDBCommand = function(code, command, callback) {
  conn.nativedb(code).open(function(err, db){
    var admin = db.admin();
    admin.command(command, function(err, info){
      db.close();
      callback(err, info);
    });
  });
};

/**
 * 给指定的表，插入数据
 * @param code
 * @param collection
 * @param data
 * @param callback
 */
exports.insertData = function(code, collection, data, callback) {
  conn.nativedb(code).open(function(err, db){

    db.collection(collection).insert(data, {w: 1}, function(err, result) {
      callback(err, result);
      db.close();
    });
  });
};

/**
 * 从数据库获取数据
 * @param code
 * @param collection
 * @param callback
 */
exports.loadData = function(code, collection, callback) {
  // TODO 添加大数据量时，分页循环获取数据的功能
  conn.nativedb.open(function(err, db){
    db.collection(collection).find().toArray(function(err, result) {
      callback(err, result);
      db.close();
    });
  });
};
