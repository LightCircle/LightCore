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

const folder  = process.cwd()
  , lang      = 'node'
  , setting   = helper.yamlLoader('.light.yml');

/**
 * 提交本地代码
 */
exports.start = function (callback) {

  const handler = new context().create('000000000000000000000001', process.env.APPNAME);

  rider.code.list(handler, {select: 'name, md5', condition: {lang: lang}}, (err, codes) => {

    let add = [], update = [], remove = [];

    const current = helper.tree(folder, setting.ignore).map(item => item.file.replace(folder, ''));
    current.forEach(f => {
      const code = codes.items.find(item => item.name === f)
        , md5 = helper.fileMd5(path.join(folder, f));

      if (code) {
        if (code.md5 !== md5) {
          update.push({file: f, md5: md5});
        }
      } else {
        add.push({file: f, md5: md5});
      }
    });

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

  const suffix = setting.binary.suffix || []
    , binary = setting.binary.file || [];

  const isSuffixMatch = suffix.findIndex(item => path.extname(file) === item) >= 0;
  const isFileNameMatch = binary.findIndex(item => file.substr(1) === item) >= 0;

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
