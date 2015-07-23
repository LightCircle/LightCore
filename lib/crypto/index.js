/**
 * @file 加密解密工具
 * @module light.core.crypto
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var crypto = require("crypto");

exports.md5crypt  = require("./md5_crypt");
exports.hmac      = crypto.createHmac;
exports.cipher    = crypto.createCipher;
exports.decipher  = crypto.createDecipher;

exports.sha256 = function(hmackey, str) {
  return crypto.createHmac("sha256", hmackey).update(str).digest("hex");
};
