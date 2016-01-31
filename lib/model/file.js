/**
 * @file 存取文件信息的controller
 * @author 罗浩
 * @module light.model.file
 * @version 1.0.0
 */


"use strict";

var ph       = require("path")
  , fs       = require("fs")
  , log      = require("../log")
  , helper   = require("../helper")
  , config   = require("../configuration")
  , Ctrl     = require("../mongo/controller")
  , _        = require("underscore")
  , async    = require("async")
  , rider    = require("./datarider")
  , constant = require("./constant")
  , response = require("../http/response")
  ;


/**
 * 添加文件
 * 添加物理文件本身，且添加Meta信息
 * @param handler
 * @param callback
 */
exports.add = function (handler, callback) {

  handler.params.data = handler.params.data || {};

  new Ctrl(handler).fileToGrid(function (err, files) {
    var data = _.map(files.items, function (file) {
      return _.extend(file, handler.params.data);
    });

    rider.file.add(handler, {data: data}, function (err, resu) {
      callback(err, resu);
    });
  });
};


/**
 * 更新
 * 如果带有文件，则更新文件本身
 * @param handler
 * @param callback
 */
exports.update = function (handler, callback) {
  var type = handler.params.data.type || "file";

  // 包含文件本身的更新
  if (handler.params.files) {
    new Ctrl(handler).fileToGrid(function (err, extend) {

      handler.params.data = handler.params.data || {};
      //      handler.params.data.extend = _.extend(extend, handler.params.data.extend);
      rider[type].update(handler, callback);
    });

    return;
  }

  // 只更新附加项
  rider[type].update(handler, callback);
};


/**
 * 上传文件，直接操作GridFS，不生成META信息
 * @param handler
 * @param callback
 */
exports.upload = function (handler, callback) {
  new Ctrl(handler).fileToGrid(callback);
};


/**
 * 图片下载
 * @param handler
 * @returns {*}
 */
exports.image = function (handler) {

  loadFile(handler, function(err, data) {

    handler.res.setHeader("Content-Type", data.contentType);
    handler.res.setHeader("Content-Length", data.length);
    handler.res.setHeader("Cache-Control", "public, max-age=34560000");
    handler.res.setHeader("Last-Modified", data.uploadDate.toUTCString());

    data.fileStream.pipe(handler.res);
  });
};


/**
 * PDF下载
 * @param handler
 * @returns {*}
 */
exports.pdf = function (handler) {

  loadFile(handler, function(err, data) {

    handler.res.setHeader("Content-Type", data.contentType);
    handler.res.setHeader("Content-Length", data.length);
    handler.res.setHeader("Access-Control-Allow-Origin", "*");
    handler.res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");

    data.fileStream.pipe(handler.res);
  });
};


/**
 * 文件下载
 * @param handler
 * @returns {*}
 */
exports.download = function (handler) {

  loadFile(handler, function(err, data) {

    exports.setContentType(handler.req, handler.res, data.length, data.filename);
    data.fileStream.pipe(handler.res);
  });
};


/**
 * 获取文件Stream, 在controllers里调用
 * @param handler
 * @param callback
 */
exports.stream = function (handler, callback) {
  loadFile(handler, function(err, data) {
    callback(err, data.fileStream);
  });
};


function loadFile(handler, callback) {

  var res = handler.res;
  if (_.str.isBlank(handler.params.id)) {
    return res.status(404).end();
  }

  rider.file.get(handler, function (err, result) {
    if (err || !result) {
      return res.status(404).end();
    }

    if (!canAccess(handler, result.name)) {
      return res.status(403).end();
    }

    handler.params.id = result.fileId;
    new Ctrl(handler).readStreamFromGrid(function (err, data) {
      if (err || !result) {
        return res.status(404).end();
      }

      callback(err, data);
    });
  });
}


/**
 * 打包指定的文件下载
 * @param handler
 */
exports.zip = function (handler) {

  rider.list(handler, function (err, result) {

    var files = [], ctrl = new Ctrl(handler);
    async.forEach(result.items, function (item, done) {

      // GridFS文件保存到临时文件夹里
      handler.params.id = item.fileId;
      ctrl.gridToFile(function (err, result) {
        files.push(result);
        done(err);
      });
    }, function () {

      var zipName = handler.params.fileName || "archive.zip"
        , zip     = ph.join(ph.resolve(process.cwd(), config.app.tmp), zipName);

      var res = handler.res;
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", "attachment; filename=" + encodeURI(zipName));
      helper.zipFiles(files, zip, function () {
        fs.createReadStream(zip).pipe(res);

        // 删除临时文件
        _.each(files, function (f) {
          fs.unlinkSync(f);
        });
      });
    });
  });
};

/**
 * 生成QRcode
 * @param handler
 * @param callback
 */
exports.qrcode = function (handler, callback) {

  var qrName = helper.uuid()
    , qr     = ph.join(ph.resolve(process.cwd(), config.app.tmp), qrName);

  helper.qrcode(handler.params.message || qrName, qr, function () {
    var files = [{
      originalFilename: qrName,
      headers         : {"content-type": "image/png"},
      path            : qr
    }];

    handler.addParams("files", files);
    exports.add(handler, function (err, result) {
      fs.unlinkSync(qr);

      if (callback) {
        return callback(err, {totalItems: result.length, items: result});
      }

      response.send(handler.res, err, {totalItems: result.length, items: result});
    });
  });
};

/**
 * 设定Content-Type等头信息
 * @param req
 * @param res
 * @param length
 * @param filename
 */
exports.setContentType = function (req, res, length, filename) {
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", length);

  var userAgent = (req.headers["user-agent"] || "").toLowerCase();
  if (userAgent.indexOf("msie") >= 0 || userAgent.indexOf("chrome") >= 0) {
    // ie chrome
    res.setHeader("Content-Disposition", "attachment; filename=" + encodeURIComponent(filename));
  } else if (userAgent.indexOf("firefox") >= 0) {
    // firefox
    res.setHeader("Content-Disposition", 'attachment; filename*="utf8\'\'' + encodeURIComponent(filename) + '"');
  } else {
    // safari等其他非主流浏览器
    res.setHeader("Content-Disposition", "attachment; filename=" + new Buffer(filename).toString("binary"));
  }
};

function canAccess(handler, filename) {
  var roles       = handler.req.session.access
    , curRole     = _.find(roles, function (item) {
        return item[handler.domain];
      })
    , targetRoles = !curRole || _.isEmpty(curRole) ? undefined : _.filter(curRole[handler.domain].items, function (role) {
        return _.contains(role.resource, filename);
      })
    ;

  if (targetRoles && targetRoles.length > 0) {
    var tests = _.map(targetRoles, function (r) {
      var common = _.intersection(r.authes, handler.user.authority);
      return common && common.length;
    });
    tests = _.compact(tests);
    return tests.length > 0;
  } else {
    return true;
  }
}