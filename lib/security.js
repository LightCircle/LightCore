/**
 * @file 提供密码验证，加密，简易登陆等相关方法
 * @module light.lib.security
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var _           = require("underscore")
  , fs          = require("fs")
  , config      = require("./configuration")
  , crypto      = require("./crypto")
  , errors      = require("./error")
  , log         = require("./log")
  , user        = require("./model/user")
  , rider       = require("./model/datarider")
  ;

/**
 * @desc 基于Cookie，Session的简易登陆功能<br>
 *  将用户信息保存到session当中,用户ID保存到header中
 * @param {Object} handler 上下文对象
 *  params.code: 租户
 *  params.id: 账户
 *  params.password: 密码
 *  params.hmackey: 密码加密key
 * @param {Function} callback 回调函数，验证成功返回用户信息
 */
exports.simpleLogin = function(handler, callback) {

  handler.addParams("code", handler.params.code);

  rider.user.get(handler, {condition: {id: handler.params.id}}, function (err, result) {
    if (err) {
      log.debug("Unable to retrieve the user.");
      return callback(new errors.db.Find());
    }

    if (!result || !result._id) {
      log.debug("User does not exist.");
      return callback(new errors.db.NotExist());
    }

    log.debug("hmackey  : "  + handler.params.hmackey);
    log.debug("password : "  + exports.sha256(handler.params.password, handler.params.hmackey));
    if (result.password !== exports.sha256(handler.params.password, handler.params.hmackey)) {
      log.debug("The user password is not correct.");
      return callback(new errors.db.NotCorrect());
    }

    delete result.password;
    handler.req.session.user = result;

    return exports.getAuthority(handler, callback);
  });
};


/**
 * @desc 获取用户的权限
 *
 * @param handler
 * @param callback
 */
exports.getAuthority = function(handler, callback) {

  // 合并所属组的ROLE
  var roles = handler.user.roles;
  _.each(handler.user.groups, function(gid) {
    roles = _.union(roles, handler.user.options.group[gid].roles);
  });

  // 根据ROLE获取AUTH
  rider.role.list(handler, {condition: {roles: roles}}, function (err, roles) {
    if (err) {
      return callback(err);
    }

    var authority = [];
    _.each(roles.items, function (role) {
      authority = _.union(authority, role.authority);
    });

    handler.user.authority = _.uniq(authority);
    callback(err, handler.user);
  });
};


/**
 * @desc 注销，删除Session
 * @param {Object} req 请求对象
 * @param {Function} callback
 */
exports.simpleLogout = function (req, callback) {
  callback = callback || function() {};

  req.session.user = null;
  req.session.destroy(callback);
};

/**
 * @desc 字符串加密方法<br>
 *  algorithm - 'sha1', 'md5', 'sha256', 'sha512'
 *  encoding - 'hex', 'binary', 'base64'
 * @ignore
 * @param {String} str 加密对象字符串
 * @param {String} [hmackey] 密钥
 * @returns {String} 加密后字符串
 */
exports.sha256 = function (str, hmackey) {

  if (_.isEmpty(str)) {
    return "";
  }

  hmackey = hmackey || config.app.hmackey;
  return crypto.hmac("sha256", hmackey).update(str).digest("hex");
};

/**
 * @desc 加密方法<br>
 *   - 使用的Algorithm - 'aes192'<br>
 *   - 使用的encoding - 'hex'<br>
 *   - 内容的encoding - 'utf-8'<br>
 * @param {String} str 加密对象
 * @param {String} secret 密钥
 * @returns {String} 加密后的内容
 */
exports.encrypt = function (str, secret) {
  var cipher = crypto.cipher("aes192", secret);
  var crypted = cipher.update(str, "utf8", "hex");
  return crypted + cipher.final("hex");
};

/**
 * @desc 解密方法
 *   - 使用的Algorithm - 'aes192'<br>
 *   - 使用的encoding - 'hex'<br>
 *   - 内容的encoding - 'utf-8'<br>
 * @param {String} str 解密对象
 * @param {String} secret 密钥
 * @returns {String} 解密后的内容
 */
exports.decrypt = function (str, secret) {
  var decipher = crypto.decipher("aes192", secret);
  var decrypted = decipher.update(str, "hex", "utf8");
  return decrypted + decipher.final("utf8");
};

/**
 * @desc 生成24位UUID。符合rfc4122 v4
 * @returns {String} 24位UUID
 */
exports.uuid = function () {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * @desc 获取指定文件的md5
 * @param filename
 * @param callback
 * @returns {*}
 */
exports.md5 = function (filename, callback) {
  var sum = crypto.hash("md5");
  if (callback && typeof callback === "function") {
    var fileStream = fs.createReadStream(filename);

    fileStream.on("error", function (err) {
      return callback(err, null);
    });

    fileStream.on("data", function (chunk) {
      try {
        sum.update(chunk);
      } catch (ex) {
        return callback(ex, null);
      }
    });

    fileStream.on("end", function () {
      return callback(null, sum.digest("hex"));
    })
  } else {
    sum.update(fs.readFileSync(filename));
    return sum.digest("hex");
  }
};