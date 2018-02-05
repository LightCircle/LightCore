/**
 * @file 数据处理的Controller
 * @module lib.model.datarider.data
 * @author r2space@gmail.com
 * @version 1.0.0
 */

'use strict';

const async  = require('async')
  , _        = require('underscore')
  , Ctrl     = require('../../db/mongo/controller')
  , operator = require('../../db/mongo/operator')
  , errors   = require('../../error')
  , helper   = require('../../helper')
  , CONST    = require('../../constant')
  , cache    = require('../../cache')
  ;


/**
 * @desc 添加数据<br>
 *  - 校验数据<br>
 *  - 获取structure，判断是否锁定<br>
 *  - 插入到数据库(转换类型，设定缺省值，过滤非定义字段)<br>
 *  - 剔除选择对象外的项目<br>
 *  - 获取附加项目<br>
 *
 * @param {Object} handler 上下文对象
 * @param {Object} handler.params 参数信息
 * @param {Object|Object[]} handler.params.data 添加的数据对象
 * @param {Function} callback 回调函数，返回添加的数据
 */
exports.add = function (handler, callback) {

  const api = handler.api;

  // 如果是继承表，那么设定type为schema名称
  const struct = cache.get(CONST.SYSTEM_DB_STRUCTURE).find(item => item.schema === api.schema);
  if (struct.parent) {
    Object.assign(handler.params.data, {type: api.schema});
  }

  // 处理数据中的预约语
  exports.parseData(handler);

  // 插入数据
  new Ctrl(handler, api.schema).add((err, data) => {
    if (err) {
      return callback(err);
    }

    // 过滤选择项，并格式化
    if (_.isArray(data)) {
      data = data.map(item => exports.reject(item, api, handler.timezone));
    } else {
      data = exports.reject(data, api, handler.timezone);
    }

    // 添加附加项
    options(handler, data, api, callback);
  });
};

exports.insert = exports.add;


/**
 * @desc 获取数据
 *  <br>
 *  - 生成filter<br>
 *  - 生成排序<br>
 *  - 检索数据<br>
 *  - 获取附加项目<br>
 *
 * @param {Object} handler 上下文对象
 * @param {Object} handler.params 参数信息
 * @param {Object} handler.params.condition 获取数据的检索条件
 * @param {Function} callback 回调函数，返回数据
 */
exports.list = function (handler, callback) {

  const api = handler.api;

  // 生成filter, sort
  handler.params.condition = exports.filter(handler, api);
  handler.params.sort = exports.order(handler, api);
  handler.params.select = exports.select(handler, api);

  // 检索数据
  new Ctrl(handler, api.schema).list((err, data) => {
    if (err) {
      return callback(err);
    }

    if (!handler.params.select || handler.strict) {
      // 过滤选择项，并格式化
      data.items = data.items.map(item => {
        return exports.reject(item, api, handler.timezone);
      });
    }

    // 添加附加项
    options(handler, data, api, callback);
  });
};

exports.find = exports.getBy = exports.getList = exports.list;

/**
 * @desc 获取单条数据
 *  <br>
 *  - 参数里指定id，则用id与数据库的_id比较来获取数据。指定的condition会被忽略<br>
 *  - 如果没有id，会用condition检索数据，并返回第一条匹配的数据<br>
 *  - 生成filter<br>
 *  - 检索数据<br>
 *  - 获取附加项目<br>
 *
 * @param {Object} handler 上下文对象
 * @param {Object} handler.params 参数信息
 * @param {String} [handler.params.id] 数据唯一识别号
 * @param {Object} [handler.params.condition] 获取数据的检索条件
 * @param {Function} callback 回调函数，返回数据
 */
exports.get = function (handler, callback) {

  const api = handler.api;

  // 生成filter
  handler.params.condition = exports.filter(handler, api);
  handler.params.select = exports.select(handler, api);

  // 检索数据
  new Ctrl(handler, api.schema).get((err, data) => {
    if (err) {
      return callback(err);
    }

    if (!handler.params.select || handler.strict) {
      // 过滤选择项，并格式化
      data = exports.reject(data, api, handler.timezone);
    }

    // 添加附加项
    options(handler, data, api, callback);
  });
};

exports.getOne = exports.get;

/**
 * @desc 获取数据件数
 * @param {Object} handler 上下文对象
 * @param {Object} handler.params 参数信息
 * @param {Object} handler.params.condition 获取数据的检索条件
 * @param {Function} callback 回调函数，返回件数
 */
exports.count = function (handler, callback) {

  handler.params.condition = exports.filter(handler, handler.api);

  new Ctrl(handler, handler.api.schema).total(callback);
};

exports.total = exports.count;

/**
 * @desc 删除数据
 *  <br>
 *  - 用ID删除时，没有找到对象数据，则返回错误，如果删除成功返回删除的数据<br>
 *  - 用条件删除时，返回的是删除件数<br>
 *
 * @param {Object} handler 上下文对象
 * @param {Object} handler.params 参数信息
 * @param {String} [handler.params.id] 数据唯一识别号
 * @param {Object} [handler.params.condition] 删除数据的检索条件
 * @param {Function} callback 回调函数，返回更新数据
 */
exports.remove = function (handler, callback) {

  // 生成filter
  handler.params.condition = exports.filter(handler, handler.api);

  // 删除数据
  new Ctrl(handler, handler.api.schema).remove(callback);
};

/**
 * @desc 更新数据
 *  <br>
 *  - 用ID更新时，没有找到对象数据，则返回错误，如果更新成功返回更新后的数据<br>
 *  - 用条件更新时，返回的是更新的件数<br>
 *
 * @param {Object} handler 上下文对象
 * @param {Object} handler.params 参数信息
 * @param {String} [handler.params.id] 数据唯一识别号
 * @param {Object} [handler.params.condition] 更新数据的检索条件
 * @param {Object} handler.params.data 更新的数据对象
 * @param {Function} callback 回调函数，返回更新数据
 */
exports.update = function (handler, callback) {

  const api = handler.api;

  // 生成filter
  handler.params.condition = exports.filter(handler, api);

  // 处理数据
  exports.parseData(handler);

  // 更新数据
  new Ctrl(handler, api.schema).update((err, data) => {
    if (err) {
      return callback(err);
    }

    // 用ID更新，且没有更新到数据，则报错
    if (handler.params.id && !data) {
      return callback(new errors.db.NotExist());
    }

    // 更新多件时，返回的是件数
    if (_.isNumber(data)) {
      return callback(err, data);
    }

    // 用ID更新时
    data = exports.reject(data, api, handler.timezone);

    // 添加附加项
    options(handler, data, api, callback);
  });
};

/**
 * @desc 添加或更新数据
 *  <br>
 *  - 指定条件匹配到数据，则进行更新<br>
 *  - 没有匹配到，则插入一条数据<br>
 *  - 返回是更新的件数或插入数据的_id
 *
 * @param {Object} handler 上下文对象
 * @param {Object} handler.params 参数信息
 * @param {Object} handler.params.condition 更新数据的检索条件
 * @param {Object} handler.params.data 更新的数据对象
 * @param {Function} callback 回调函数，返回更新数据
 */
exports.upsert = function (handler, callback) {

  // 生成filter
  handler.params.condition = exports.filter(handler, handler.api);

  // 更新数据
  new Ctrl(handler, handler.api.schema).upsert(callback);
};


/**
 * @desc 替换数据中的预约语
 * @param handler
 */
exports.parseData = function (handler) {

  _.each(handler.params.data, (val, key) => {

    if (typeof val !== 'string') {
      return;
    }

    const parsed = parseReserved(handler, val);
    if (val !== parsed) {
      handler.params.data[key] = parsed;
    }
  });
};

/**
 * @desc 排序<br>
 * @param handler 上下文对象
 * @param {Object} handler.params 参数信息
 * @param {String} handler.params.sorts|hanlder.params.order 动态排序时 包含排序字段
 * @param board 排序定义[[col1: 1], [col2: -1], [col3: 1]]
 * @returns {Array} 排序后数据
 */
exports.order = function (handler, board) {

  // 如果，指定了排序方法，那么直接返回
  let sort = handler.params.sort || handler.params.order;
  if (sort) {
    return sort;
  }

  // 尝试使用board定义中的排序
  const sorts = board.sorts.sort((a, b) => {
    return a.index > b.index;
  });

  return sorts.map(sort => {
    return [sort.key, sort.order.toLowerCase() === 'asc' ? 1 : -1];
  });
};


/**
 * @desc 生成条件字符串<br>
 *  free: 直接作为检索条件，在model层会对数据进行类型转换<br>
 *  遍历board的filter条件定义，生成检索条件<br>
 *   - 前端没有传递filter里定义的参数值，则尝试使用缺省值<br>
 *   - 缺省值是预约语的时候，用实际值代替<br>
 *   - 同一个条件组内的条件用and符合并<br>
 *   - 不同条件组间，用or符合并<br>
 *   - 没有明确指定valid，则添加valid=1条件
 * @ignore
 * @param {Object} handler
 * @param {Object} handler.params.free 自定义检索条件
 * @param {Object} handler.params.condition 检索条件
 * @param {Object} handler.params.filter 检索条件
 * @param {Object} board 接口定义
 * @returns {Object} 条件对象
 */
exports.filter = function (handler, board) {

  // 如果定义了自由条件，则对检索条件框架不做任何处理
  if (handler.params.free) {
    return handler.params.free;
  }

  const struct = cache.get(CONST.SYSTEM_DB_STRUCTURE).find(item => item.schema === board.schema);

  // 没有检索条件，返回空
  let data = handler.params.condition || handler.params.filter || {}, or = {};

  // 没有指定任何条件并且有父类型，则在检索条件里默认加上type条件
  if (board.filters.length <= 0 && struct.parent) {
    or = {'': {type: struct.schema}};
  }

  _.each(board.filters, filter => {

    let and = or[filter.group] = or[filter.group] || {}, value = '';

    // 如果有父类型，那么检索条件里默认加上type条件
    if (struct.parent) {
      and.type = struct.schema;
    }

    if (helper.isBlank(filter.parameter)) {          // 如果参数没指定，则使用缺省值

      value = parseReserved(handler, filter.default);
    } else if (data) {

      if (_.isUndefined(data[filter.parameter])) {  // 如果没能取到参数值，则使用缺省值
        value = parseReserved(handler, filter.default);
      } else {
        value = data[filter.parameter];
      }
    }

    if (!_.isUndefined(value) && value !== '') {    // 允许null的比较，所以去掉isNull的判断

      const compare = operator.compare(filter.operator, filter.key, value);

      if (and[filter.key]) {                        // 存在相同名的条件，则以and形式扩展
        and[filter.key] = _.extend(and[filter.key], compare[filter.key]);
      } else {
        and = _.extend(and, compare);
      }
    }
  });

  // 去除空的条件
  or = _.reject(_.values(or), item => _.isEmpty(item));

  if (or.length <= 0) {
    return valid({});
  }

  // 如果只有一个or条件的group，则去除or比较符
  return or.length === 1 ? valid(or[0]) : valid(operator.compare('$or', null, or));
};


/**
 * @desc 去掉被选择项目以外的项目
 * 1. 只拷贝被选择的项目
 * 2. 如果定义了format或alias，则进行格式化和重命名
 * 3. 支持内嵌文档的拷贝，只支持两层结构
 *
 * @ignore
 * @param data
 * @param board
 * @param timezone
 * @returns {Object}
 */
exports.reject = function (data, board, timezone) {

  // 特殊处理: 当schema是structure时，返回所有字段。
  // 因为，structure的board无法完整描述schema本身的定义
  if (board.schema === 'structure') {
    return data;
  }

  // 如果数据为空，那么直接返回
  let result = {};
  if (!data) {
    return result;
  }

  // 使用board的select定义，过滤检索结果
  // format，alias功能继承至前版本，现在页面暂时不支持这些特性（2017-09-15）
  board.selects.forEach(column => {
    if (!column.select) {
      return;
    }

    const parent = column.key.split(".")[0], child = column.key.split(".")[1];
    if (child) {

      const key = column.alias || child, val = data[parent];
      if (_.isArray(val)) { // array 遍历数组，拷贝指定的值

        const array = result[parent] || [];
        _.each(val, function (item, index) {

          array[index] = array[index] || {};
          const converted = helper.format(item[child], column.format, timezone);
          _.isUndefined(converted) || (array[index][key] = converted);
        });

        result[parent] = array;

      } else if (_.isObject(val)) { // mixed 如果指定有别名，则用别名取代json路径

        const converted = helper.format(val[child], column.format, timezone);
        if (column.alias) {
          _.isUndefined(converted) || (result[key] = converted);
        } else {
          result[parent] = result[parent] || {};
          _.isUndefined(converted) || (result[parent][key] = converted);
        }
      }
    } else {

      const converted = helper.format(data[column.key], column.format, timezone);
      _.isUndefined(converted) || (result[column.alias || column.key] = converted);
    }
  });

  return result;
};


/**
 * 根据board的select定义，生成select条件
 * @param handler
 * @param board
 * @returns {*}
 */
exports.select = function (handler, board) {

  // 如果指定了select，那么就直接返回
  const select = handler.params.select || handler.params.field;
  if (select) {
    return select;
  }

  // 使用board定义，生成select条件
  return board.selects.reduce((data, item) => {
    if (item.select) {
      data[item.key] = 1;
    }
    return data;
  }, {});
};


/**
 * @desc 关联表
 *  在数据中找到指定的key值，检索关联表，获取数据
 *  并将结果保存到data的options里
 * @ignore
 * @param handler
 * @param data 数据
 * @param item 关联信息
 * @param type board的类型，区分是list型还是单个对象
 * @param callback 无返回值
 */
exports.join = function (handler, data, item, type, callback) {

  let schema = item.schema;
  if (!data || !schema) {
    return callback();
  }

  // 已经获取的内容（不再重复获取，检索时剔除这些内容）
  const selected = data.options ? _.keys(data.options[schema]) : [];

  // 最终结果保存在options里
  data.options = data.options || {};

  // 指定检索条件
  let filter = {condition: {}, select: item.fields}, storeKey;
  Object.keys(item.conditions).forEach(key => {

    let dataKey = item.conditions[key];

    // $符号开头的是变量，需要在data里取值作为真正的检索条件值
    if (dataKey[0] === '$') {
      let val = helper.get((type === 4) ? data.items : data, dataKey.substr(1)); // 列表类型（type=4）时，在items里取值
      val = _.isArray(val) ? val : [val];
      val = _.union(_.compact(_.difference(_.flatten(val), selected)));         // 去除已经获取的，空的，重复的

      if (!_.isEmpty(val)) {
        filter.condition[key] = {$in: val};
      }

      // 确定保存Option数据的key，找出与当前数据字段相同的条件的名称
      if (dataKey.substr(1) === item.key) {
        storeKey = key;
      }
    } else {
      filter.condition[key] = dataKey;
    }
  });

  // 没有条件，不检索options项，防止检索所有的值出来
  if (_.isEmpty(filter.condition)) {
    return callback();
  }

  // 查询
  new Ctrl(handler.copy(filter), schema).list((err, result) => {
    result.items.forEach(item => {
      data.options[schema] = data.options[schema] || {};
      data.options[schema][item[storeKey] || item._id.toHexString()] = item;
    });

    callback(err);
  });
};


/**
 * @desc 获取预约语对应的值
 *  $uid 当前用户ID
 *  $sysdate 日期型，系统当前日期 没有时间信息
 *  $systime 日期型，系统当前日期 包含时间信息
 * @ignore
 * @param handler
 * @param keyword
 * @returns {*}
 */
function parseReserved(handler, keyword) {

  if (keyword === '$uid' || keyword === '@uid') {
    return handler.uid;
  }

  if (keyword === '$sysdate' || keyword === '@sysdate') {
    return new Date();
  }

  if (keyword === '$systime' || keyword === '@systime') {
    return new Date();
  }

  if (keyword === '$corp' || keyword === '@corp') {
    return handler.corp;
  }

  return keyword;
}


/**
 * @desc 添加获取有效数据的条件，仅在没有指定valid条件时起作用<br>
 *  如果条件是[或]关系，则在每个[或]条件里添加valid=1的条件<br>
 *  如果是单个条件，则单纯添加valid=1的条件
 * @ignore
 * @param condition
 * @returns {*}
 */
function valid(condition) {

  if (_.isArray(condition)) {
    return _.map(condition, item => {
      if (!_.has(item, 'valid')) {
        item.valid = 1;
      }

      return item;
    });
  }

  if (!_.has(condition, 'valid')) {
    condition.valid = 1;
  }
  return condition;
}


/**
 * @desc 遍历所有的选择项目，获取options项的值
 * @ignore
 * @param handler
 * @param data
 * @param board
 * @param callback
 */
function options(handler, data, board, callback) {
  if (!data || _.isEmpty(data)) {
    return callback(null, data);
  }

  async.eachSeries(board.selects || [], (item, next) => {
    if (item.select) {
      return exports.join(handler, data, item, board.type, next);
    }
    next();
  }, err => callback(err, data));
}
