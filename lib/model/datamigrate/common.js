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

  var model = new Model(handler.domain, handler.code, option.table, {tz: handler.timezone})
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
        return loop(undefined, {key: value, val: '', original: value});
      }

      result = result[option.fields[0]];
      result = result instanceof ObjectID ? result.toString() : result;
      loop(undefined, {key: value, val: result, original: result});
    });

  }, function (err, result) {
    log.debug('fetch link data - ' + option.key + ":" + option.table + ":" + option.fields[0], handler.uid);

    /**
     * 在ETL的导入功能里, 通常这个功能是用[名称]获取名称对应的[ID], [ID]会替换原有的[名称]保存
     * 旧的[名称]也需要保存起来, 为了处理过程中出错时, 用[名称]来提示哪个列有问题。
     * [名称]可以是用逗号分隔的数组, 这时需要遍历所有的值并保存原来的内容。
     *
     * 在ETL的导出功能里, 则相反, 一般是用[ID]获取名称。同时还支持[variable]功能, 通常这个功能用于ETL的导出。
     * 当variable被指定了, 那么取回来的值不会替换原来的值, 以方便后续项目参照
     * 获取来的值, 会以variable里指定的名称来保存。 在ETL的导出时, 如果指定了variable, 那么这里的值优先输出。
     */
    var index = option.variable || option.key;
    if (option.type && option.type.toLowerCase() == 'array') {
      data[index] = _.map(result, function (item) {
        data._original[item.original] = item.key;
        return item.val;
      });
    } else {
      data[index] = result[0].val;
      data._original[result[0].original] = result[0].key;
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

exports.before = function (controller, handler, data, callback) {

  if (!controller) {
    return callback(undefined);
  }

  var func = controller["before"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, handler, data, function (err, newData) {
    callback(err, newData);
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

exports.after = function (controller, handler, data, callback) {
  if (!controller) {
    return callback(undefined);
  }

  var func = controller["after"];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, handler, data, function (err, newData) {
    callback(err, newData);
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

  func.call(this, handler, row, function (err, message) {
    callback(err, message);
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

  func.call(this, handler, data, function (err, newData) {
    callback(err, newData);
  });
};
