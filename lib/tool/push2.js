/**
 * @file 上传代码
 * @module push
 * @author r2space@gmail.com
 * @version 1.0.0
 */

'use strict';

const log     = require('../log')
  , context   = require('../http/context')
  , helper    = require('../helper')
  , rider     = require('../model/datarider')
  , file      = require('../model/file')
  , path      = require('path')
  , fs        = require('fs')
  , async     = require('async');

let folder        = process.cwd()
  , binarySuffix  = []
  , binaryFile    = [];


exports.init = function (setting) {

  // 应用程序没有被初始化的状况下使用push方法，需要对环境进行设置
  // 比如，如在 Electron 发起代码推送，就需要调用init来进行初始化
  process.env.LIGHTDB_HOST = setting.mongodb.host;
  process.env.LIGHTDB_PORT = setting.mongodb.port;
  process.env.LIGHTDB_USER = setting.mongodb.user;
  process.env.LIGHTDB_PASS = setting.mongodb.pass;
  process.env.LIGHTDB_AUTH = setting.mongodb.auth;
  process.env.APPNAME      = setting.app.domain;

  global.light = require('../../index');
};

exports.start = function (root, callback) {

  if (typeof root === 'function') {
    callback = root;
    root = null;
  }

  if (root) {
    folder = root;
  }

  // 获取代码类型说明文件，包含非上传对象文件，二进制文件的定义
  const setting = helper.yamlLoader('.light.yml', folder);
  binarySuffix = setting.binary.suffix || [];
  binaryFile = setting.binary.file || [];

  const handler = new context().create('000000000000000000000001', process.env.APPNAME);
  rider.code.list(handler, {select: 'name, md5', condition: {lang: 'node'}}, (err, codes) => {

    let add = [], update = [], remove = [];

    // 遍历所有本地文件，对比md5
    const current = helper.tree(folder, setting.ignore).map(item => item.file.replace(folder, ''));
    current.forEach(f => {
      const code = codes.items.find(item => item.name === f)
        , md5 = helper.fileMd5(path.join(folder, f));

      if (code) {
        // md5不同则更新文件
        if (code.md5 !== md5) {
          update.push({file: f, md5: md5});
        }
      } else {
        // 不存在则添加文件
        add.push({file: f, md5: md5});
      }
    });

    // 遍历所有数据库中内容，确定被删除的文件
    codes.items.forEach(code => {
      if (!current.includes(code.name)) {
        remove.push({file: code.name});
      }
    });

    async.series([
      (done) => removeCode(handler, remove, done),
      (done) => updateCode(handler, update, done),
      (done) => addCode(handler, add, done)
    ], callback);
  });

};


function addCode(handler, items, callback) {

  async.each(items, (item, next) => {
    log.debug(`>> add ${item.file}`);

    const binary = isBinary(item.file);
    let data = {
      name: item.file, type: binary ? 'binary' : 'code', app: handler.domain, md5: item.md5, lang: 'node'
    };

    if (binary) {
      return addFile(handler, path.join(folder, item.file), (err, result) => {
        if (err) {
          return next(err);
        }

        data.source = result[0]._id;
        rider.code.add(handler, {data: data}, next);
      });
    }

    data.source = fs.readFileSync(path.join(folder, item.file), 'utf8');
    rider.code.add(handler, {data: data}, next);
  }, callback);
}


function updateCode(handler, items, callback) {

  async.each(items, (item, next) => {
    log.debug(`>> update ${item.file}`);

    const binary = isBinary(item.file);

    if (binary) {
      return addFile(handler, path.join(folder, item.file), (err, result) => {
        if (err) {
          return next(err);
        }

        rider.code.update(handler, {data: {source: result[0]._id, md5: item.md5}, condition: {name: item.file}}, next);
      });
    }

    const data = {source: fs.readFileSync(path.join(folder, item.file), 'utf8'), md5: item.md5};
    rider.code.update(handler, {condition: {name: item.file}, data: data}, next);
  }, callback);
}


function removeCode(handler, items, callback) {

  async.each(items, (item, next) => {
    log.debug(`>> remove ${item.file}`);
    rider.code.remove(handler, {condition: {name: item.file}}, next);
  }, callback);
}


function isBinary(file) {

  const isSuffixMatch = binarySuffix.findIndex(item => path.extname(file) === item) >= 0;
  const isFileNameMatch = binaryFile.findIndex(item => file.substr(1) === item) >= 0;

  return isSuffixMatch || isFileNameMatch;
}


function addFile(handler, f, callback) {
  const data = {
    originalFilename: path.basename(f),
    headers: {'content-type': 'application/octet-stream'},
    path: f,
    base: path.dirname(f)
  };

  return file.add(handler.copy({files: [data]}), callback);
}
