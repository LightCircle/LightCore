/**
 * @file ETL共同处理
 * @author r2space@gmail.com
 * @module lib.model.common
 * @version 1.0.0
 */

'use strict';

const async   = require('async')
  , ObjectID  = require('mongodb').ObjectID
  , _         = require('underscore')
  , log       = require('../../log')
  , Model     = require('../../mongo/model')
  , parser    = require('../../mongo/type/objectid')
  , mpath     = require('../../mpath')
  ;


/**
 * 对象数据扁平化处理 {a: {b: 1}} 转 {a.b :1}
 * @param handler
 * @param mapping
 */
exports.flatten = function (handler, mapping) {

  const key = mapping.variable || mapping.key;

  // excel值里不能包含null值，否则特定excel版本会出现格式异常
  let data = handler.params.data, values = mpath.get(data, key);

  if (typeof values !== 'undefined' && values !== null) {
    data[key] = values;
  }
};


/**
 * 获取关联表的数据, 支持数组内容的关联
 * 是否是数组，根据传入的值的类型来判断，即Array.isArray为真时，按数组处理
 * @param handler
 * @param mapping
 * @param callback
 * @returns {*}
 */
exports.getLinkData = function (handler, mapping, callback) {
  if (!mapping.schema) {
    return callback();
  }

  const model = new Model(handler.domain, handler.code, mapping.schema, {tz: handler.timezone})
    , data = handler.params.data
    , select = {[mapping.fields]: 1};

  // TODO: key 应该先使用 variable，然后再用key
  let values = mpath.get(data, mapping.key)
    , isArray = Array.isArray(values);

  async.mapSeries(isArray ? values : [values], (value, loop) => {

    let condition = _.clone(mapping.conditions);

    // 确认 conditions 里定义的参照变量是以 '$' 开头的, 这里提取参照变量的实际值进行替换, 转换为mongodb的条件
    _.each(condition, (val, key) => {
      if (!(_.isString(val) && val.startsWith('$'))) {
        return;
      }

      if (val.substr(1) === mapping.key) {
        condition[key] = (key === '_id') ? parser.dataParse(value) : value;
      } else {
        val = mpath.get(data, val.substr(1));
        condition[key] = {$in: _.isArray(val) ? val : [val]};
      }
    });

    model.get(_.extend({valid: 1}, condition), select, (err, result) => {
      if (err) {
        return loop(err);
      }

      if (!result) {
        return loop(undefined, {key: value, val: '', original: value});
      }

      result = result[mapping.fields];
      result = result instanceof ObjectID ? result.toString() : result;
      loop(undefined, {key: value, val: result, original: result});
    });

  }, (err, result) => {
    log.debug('fetch link data - ' + mapping.key + ':' + mapping.schema + ':' + mapping.fields, handler.uid);

    /**
     * 在ETL的导入功能里, 通常这个功能是用[名称]获取名称对应的[ID], [ID]会替换原有的[名称]保存
     * 旧的[名称]也需要保存起来, 为了处理过程中出错时, 用[名称]来提示哪个列有问题。
     * [名称]可以是用逗号分隔的数组, 这时需要遍历所有的值并保存原来的内容。
     *
     * 在ETL的导出功能里, 则相反, 一般是用[ID]获取名称。同时还支持[variable]功能, 通常这个功能用于ETL的导出。
     * 当variable被指定了, 那么取回来的值不会替换原来的值, 以方便后续项目参照
     * 获取来的值, 会以variable里指定的名称来保存。 在ETL的导出时, 如果指定了variable, 那么这里的值优先输出。
     */
    const index = mapping.variable || mapping.key;
    if (isArray) {
      mpath.set(data, index, _.map(result, item => {
        data._original[item.original] = item.key;
        return item.val;
      }));
    } else {
      mpath.set(data, index, result[0].val);
      data._original[result[0].original] = result[0].key;
    }

    callback(err);
  });
};

exports.init = function (controller, handler, model, callback) {

  if (!controller) {
    return callback();
  }

  const func = controller['initialize'];
  if (!func) {
    return callback(undefined);
  }

  func.call(this, handler, model, callback);
};

exports.before = function (controller, handler, data, callback) {

  if (!controller) {
    return callback();
  }

  const func = controller['before'];
  if (!func) {
    return callback();
  }

  func.call(this, handler, data, callback (err, newData));
};

exports.parse = function (controller, handler, row, callback) {

  if (!controller) {
    return callback(undefined, row);
  }

  const func = controller['parse'];
  if (!func) {
    return callback(undefined, row);
  }

  func.call(this, handler, row, callback);
};

exports.after = function (controller, handler, data, callback) {
  if (!controller) {
    return callback();
  }

  const func = controller['after'];
  if (!func) {
    return callback();
  }

  func.call(this, handler, data, callback);
};

exports.valid = function (controller, handler, row, callback) {
  if (!controller) {
    return callback();
  }

  const func = controller['valid'];
  if (!func) {
    return callback();
  }

  func.call(this, handler, row, callback);
};

exports.dump = function (controller, handler, data, callback) {

  if (!controller) {
    return callback();
  }

  const func = controller['dump'];
  if (!func) {
    return callback();
  }

  func.call(this, handler, data, callback);
};
