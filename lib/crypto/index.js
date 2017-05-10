/**
 * @file 加密解密工具
 * @module lib.crypto
 * @author r2space@gmail.com
 * @version 1.0.0
 */

'use strict';

const crypto = require('crypto');

exports.md5crypt    = require('./md5_crypt');
exports.sha256      = (hmackey, str) => {
  return crypto.createHmac('sha256', hmackey).update(str).digest('hex');
};

exports.hmac        = crypto.createHmac;
exports.cipher      = crypto.createCipher;
exports.cipheriv    = crypto.createCipheriv;
exports.decipher    = crypto.createDecipher;
exports.decipheriv  = crypto.createDecipheriv;
exports.hash        = crypto.createHash;
