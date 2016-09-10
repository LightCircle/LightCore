/**
 * @file ETL共同处理
 * @author r2space@gmail.com
 * @module lib.model.common
 * @version 1.0.0
 */

"use strict";

var async     = require("async")
  , ObjectID  = require("mongodb").ObjectID
  , mpath     = require("mpath")
  , _         = require("underscore")
  , log       = require("../../log")
  , Model     = require("../../mongo/model")
  , parser    = require("../../mongo/type/objectid")
  ;

/**
 * 获取关联表的数据, 注意: fields虽然是数组, 但是只支持指定一个项目
 * @param handler
 * @param option
 * @param callback
 * @returns {*}
 */
exports.getLinkData = function (handler, option, callback) {
  if (!option.table) {
    return callback();
  }

  var model = new Model(handler.domain, handler.code, option.table)
    , data = handler.params.data
    , values = mpath.get(option.key, data);

  var select = _.reduce(option.fields, function (memo, item) {
    memo[item] = 1;
    return memo;
  }, {});

  values = _.isArray(values) ? values : [values];
  async.mapSeries(values, function (value, loop) {

    var condition = _.clone(option.conditions);

    // 确认 conditions 里定义的参照变量是以 '$' 开头的, 这里提取参照变量的实际值进行替换, 转换为mongodb的条件
    _.each(condition, function (val, key) {
      if (!(_.isString(val) && val.startsWith("$"))) {
        return;
      }

      if (val.substr(1) == option.key) {
        condition[key] = (key == '_id') ? parser.dataParse(value) : value;
      } else {
        val = mpath.get(val.substr(1), data);
        condition[key] = {$in: _.isArray(val) ? val : [val]};
      }
    });

    model.get(_.extend({valid: 1}, condition), select, function (err, result) {
      if (err) {
        return loop(err);
      }

      if (!result) {
        return loop(undefined, {key: value, val: value});
      }

      result = result[option.fields[0]];
      result = result instanceof ObjectID ? result.toString() : result;
      loop(undefined, {key: value, val: result});
    });

  }, function (err, result) {
    log.debug('fetch link data - ' + option.key + ":" + option.table + ":" + option.fields[0], handler.uid);

    if (option.type && option.type.toLowerCase() == 'array') {
      data[option.key] = _.map(result, function (item) {
        data._original[item.val] = item.key;
        return item.val;
      });
    } else {
      data[option.key] = result[0].val;
      data._original[result[0].val] = result[0].key;
    }

    callback(err);
  });
};

exports.init = function (controller, handler, model, callback) {

  if (!controller) {
    return callback(undefined);
  }

  var func = controller["initialize"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, handler, model, function (err) {
    callback(err);
  });
};

exports.before = function (controller, handler, model, callback) {

  if (!controller) {
    return callback(undefined);
  }

  var func = controller["before"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, handler, model, function (err) {
    callback(err);
  });
};

exports.parse = function (controller, handler, row, callback) {

  if (!controller) {
    return callback(undefined, row);
  }

  var func = controller["parse"];
  if (!func) {
    return callback(undefined, row);
  }

  func.call(this, handler, row, function (err, parsed) {
    callback(err, parsed);
  });
};

exports.after = function (controller, handler, model, callback) {
  if (!controller) {
    return callback(undefined);
  }

  var func = controller["after"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, handler, model, function (err) {
    callback(err);
  });
};

exports.valid = function (controller, handler, row, callback) {
  if (!controller) {
    return callback(undefined);
  }

  var func = controller["valid"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, handler, row, function (err) {
    callback(err);
  });
};

exports.dump = function (controller, handler, data, callback) {

  if (!controller) {
    return callback(undefined);
  }

  var func = controller["dump"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, handler, data, function (err) {
    callback(err);
  });
};
