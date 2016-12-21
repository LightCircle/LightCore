/**
 * @file 上传Git代码
 * @module push
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var log       = require("../log")
  , context   = require("../http/context")
  , helper    = require("../helper")
  , rider     = require("../model/datarider")
  , file      = require("../model/file")
  , path      = require("path")
  , fs        = require("fs")
  , _         = require("underscore")
  , async     = require("async")
  , git       = require("simple-git")
  , mime      = require("mime-types")
  , SRC_DIR   = process.cwd()
  ;

var DEFAULT_USER = "000000000000000000000001";

/**
 * 提交本地代码
 */
exports.start = function (callback) {
  
  var handler = new context().create(DEFAULT_USER, process.env.APPNAME);

  // 获取git提交日志
  gitLog(handler, function (err, result) {

    if (err) {
      return callback(err);
    }

    var from = result.latest.hash.substr(0, 7);

    handler.code = "light";
    rider.setting.list(handler, function (err, result) {

      var findResult = _.findWhere(result.items, {key: "LastCommit"});
      var to = findResult ? findResult.value : "";

      if (to) {
        return gitDiff(from, to, function (err, diff) {

          // 如果文件版本相同则返回
          if (diff.length == 0) {
            return callback(undefined, "没有需要上传的文件");
          }

          upload(handler, from, diff, callback);
        });
      }

      // 如果获取数据库中最后上传版本不存在，则直接上传文件到服务器
      upload(handler, from, getAllFile(), callback);
    });
  });
};


/**
 * @desc 获取需要上传得全部文件
 **/
function getAllFile() {

  var fileList = helper.tree(SRC_DIR)
    , excludeModules = path.resolve(SRC_DIR, "node_modules")
    , excludeIEDA = path.resolve(SRC_DIR, ".idea")
    , excludeGit = path.resolve(SRC_DIR, ".git");

  fileList = _.filter(fileList, function (file) {
    return (
      file.file && file.file.indexOf(excludeModules) == -1 &&
      file.file.indexOf(excludeIEDA) == -1 &&
      file.file.indexOf(excludeGit) == -1
    );
  });

  return fileList;
}


/**
 * @desc 获取指定版本之间的变更文件一览
 * @param from
 * @param to
 * @param callback
 */
function gitDiff(from, to, callback) {

  git(path.resolve(SRC_DIR)).diff(["--name-only", from, to], function (err, diff) {

    var files = diff.split("\n");

    // 去除文件名称为空的数据
    files = _.filter(files, function (file) {
      if (file) {
        return true;
      }
    });
    callback(err, files);
  });
}


/**
 * @desc 获取Git提交日志
 * @param handler
 * @param callback
 */
function gitLog(handler, callback) {

  var dir = path.resolve(SRC_DIR);

  git(dir).log({n: handler.params.limit || 100}, function (err, gitLog) {
    if (err) {
      log.error(err);
    }

    gitLog.path = dir;
    callback(err, gitLog);
  });
}


/**
 * @desc 上传指定的代码
 * @param handler
 * @param commit
 * @param source
 * @param callback
 */
function upload(handler, commit, source, callback) {

  var dir = path.resolve(SRC_DIR);

  source = _.map(source, function (file) {

    // 判断file参数类型是否为字符串
    if (typeof file == "string") {
      return {file: path.resolve(dir, file)}
    }

    return {file: file.file};
  });

  loadFromFile(handler, dir, source, function (err) {
    if (err) {
      return callback(err);
    }

    // 判断setting数据是否存在
    rider.setting.list(handler, function (err, result) {
      if (err) {
        return log.error(err);
      }

      var findResult = _.findWhere(result.items, {key: "LastCommit"})
        , to = findResult ? findResult.value : "";

      // 如果存在修改数据
      if (to) {
        return rider.setting.update(handler, {condition: {key: "LastCommit"}, data: {value: commit}}, callback);
      }

      // 新建数据
      rider.setting.add(handler, {
        data: {
          "key": "LastCommit",
          "value": commit,
          "description": "最终更新"
        }
      }, callback);
    });
  });
}


function loadFromFile(handler, folder, files, callback) {

  files = files || helper.tree(folder, null, null, ignore());

  async.eachSeries(files, function (item, next) {

    // 文件不存在, 则删除数据库中的文件
    if (!helper.fileExists(item.file)) {
      return removeCode(handler, {name: item.file.replace(folder, "")}, next);
    }

    var contentType = mime.lookup(item.file);

    // 通过contentType判断是否是Binary文件，如果是Binary则保存为文件
    if (contentType && isBinary(contentType)) {
      var data = {
        originalFilename: path.basename(item.file),
        headers: {"content-type": contentType || "application/octet-stream"},
        path: item.file,
        base: path.dirname(item.file)
      };

      // 添加文件
      return file.add(handler.copy({files: [data]}), function (err, result) {
        if (err) {
          return next(err);
        }

        // 保存文件名
        upsertCode(handler, {
          name: item.file.replace(folder, ""),
          type: "binary",
          source: result[0]._id,
          app: handler.domain
        }, next);
      });
    }

    // 保存代码
    upsertCode(handler, {
      name: item.file.replace(folder, ""),
      type: "code",
      source: fs.readFileSync(item.file, "utf8"),
      app: handler.domain
    }, next);
  }, callback);
}


function upsertCode(handler, item, callback) {

  log.info(item.name);
  rider.code.get(handler, {condition: {name: item.name}}, function (err, result) {
    if (err) {
      return callback(err);
    }

    if (_.isEmpty(result)) {
      return rider.code.add(handler, {data: item}, callback);
    }

    return rider.code.update(handler, {id: result._id.toHexString(), data: item}, callback);
  });
}

function removeCode(handler, item, callback) {

  log.info(item.name);
  rider.code.get(handler, {condition: {name: item.name}}, function (err, result) {
    if (err) {
      return callback(err);
    }

    if (_.isEmpty(result)) {
      return callback();
    }

    return rider.code.remove(handler, {id: result._id.toHexString()}, callback);
  });
}

function isBinary(contentType) {

  // 字体
  if (_.contains([
      "application/vnd.ms-fontobject",
      "font/opentype",
      "application/x-font-ttf",
      "application/font-woff",
      "application/font-woff2"], contentType)) {
    return true;
  }

  // excel 模板
  if (contentType.match(/^application\/vnd.openxmlformats-officedocument/)) {
    return true;
  }

  // 音频
  if (contentType.match(/^audio/)) {
    return true;
  }

  // 图片
  if (contentType.match(/^image/)) {
    return true;
  }

  // 视频
  return contentType.match(/^video/);
}
