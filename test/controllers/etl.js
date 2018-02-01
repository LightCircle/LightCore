/**
 * test/controllers/etl.js
 */

'use strict';


exports.init = function (handler, model, callback) {
  console.log('>> custom init');
  callback();
};

exports.before = function (handler, data, callback) {
  console.log('>> custom before');
  callback(null, data);
};

exports.parse = function (handler, row, callback) {
  console.log('>> custom parse');
  row.lang = row.lang.split(',').reduce((memo, item) => {
    const [key, val] = item.split(':');
    memo[key] = val;
    return memo;
  }, {});
  callback();
};

exports.after = function (handler, data, callback) {
  console.log('>> custom after');
  callback(null, data);
};

exports.valid = function (handler, row, callback) {
  console.log('>> custom valid');
  callback();
};

exports.dump = function (handler, data, callback) {
  console.log('>> custom dump');
  callback(null, data);
};

exports.end = function (handler, result, callback) {
  console.log('>> custom end');
  callback();
};
