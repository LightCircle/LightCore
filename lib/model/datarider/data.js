/**
 * @file 数据处理的Controller
 * @module light.model.datarider.data
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var Ctrl      = require("../../mongo/controller")
  , errors    = require("../../error")
  , helper    = require("../../helper")
  , operator  = require("../../mongo/operator")
  , config    = require("../../configuration")
  , signal    = require("../../signal")
  , async     = require("async")
  , mpath     = require("mpath")
  , _         = require("underscore")
  , constant  = require("../constant")
  ;

/**
 * @desc 生成Controller实例
 * @param {Object} handler 上下文对象
 * @param {String} collection 数据库表名
 * @returns {Ctrl} 操作对象
 */
exports.control = function (handler, collection) {

  var schema = _.findWhere(light.model.rider.structure, {schema: collection});

  // 平台表
  if (schema.tenant == 0) {
    handler.domain = constant.SYSTEM_DB;
  }

  // 系统表
  if (schema.tenant == 1) {
    handler.code = constant.SYSTEM_DB_PREFIX;
  }

  // 扩展表
  if (schema.kind == 1) {
    if (schema.type == constant.OBJECT_TYPE_USER) {
      collection = constant.MODULES_NAME_USER;
    }
    if (schema.type == constant.OBJECT_TYPE_GROUP) {
      collection = constant.MODULES_NAME_GROUP;
    }
    if (schema.type == constant.OBJECT_TYPE_CATEGORY) {
      collection = constant.MODULES_NAME_CATEGORY;
    }
    if (schema.type == constant.OBJECT_TYPE_FILE) {
      collection = constant.MODULES_NAME_FILE;
    }
    if (!_.isUndefined(handler.params.condition)) {
      handler.params.condition.type = schema.schema;
    }
  }

  return new Ctrl(handler, collection, schema.items);
};

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

  // 校验
  if (handler.params.validator) {
    // 判断structure是否被锁定
    //return validator.isValid(handler.params.validator, function(err, result) {
    //
    //});
  }

  var api = handler.params.__api;

  if (isLocked(api.schema)) {
    return callback(new errors.db.Locked())
  }

  // 插入数据
  exports.control(handler, api.schema).add(function (err, data) {
    if (err) {
      return callback(err);
    }

    sync(handler, api.schema);

    // 过滤选择项，并格式化
    if (_.isArray(data)) {
      data = _.map(data, function (item) {
        return exports.reject(item, api);
      });
    } else {
      data = exports.reject(data, api);
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

  var api = handler.params.__api;

  // 生成filter, sort
  handler.params.condition = exports.filter(handler, api);
  handler.params.sort = exports.order(handler, api);

  // 检索数据
  exports.control(handler, api.schema).list(function (err, data) {
    if (err) {
      return callback(err);
    }

    // 过滤选择项，并格式化
    data.items = _.map(data.items, function (item) {
      return exports.reject(item, api);
    });

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
  var api = handler.params.__api;

  // 生成filter
  handler.params.condition = exports.filter(handler, api);

  // 检索数据
  exports.control(handler, api.schema).get(function (err, data) {
    if (err) {
      return callback(err);
    }

    // 过滤选择项，并格式化
    data = exports.reject(data, api);

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

  var api = handler.params.__api;

  handler.params.condition = exports.filter(handler, api);

  exports.control(handler, api.schema).total(callback);
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

  var api = handler.params.__api;

  // 判断structure是否被锁定
  if (isLocked(api.schema)) {
    return callback(new errors.db.Locked())
  }

  // 生成filter
  handler.params.condition = exports.filter(handler, api);

  // 删除数据
  exports.control(handler, api.schema).remove(callback);
  sync(handler, api.schema);
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

  var api = handler.params.__api;

  // 判断structure是否被锁定
  if (isLocked(api.schema)) {
    return callback(new errors.db.Locked())
  }

  // 生成filter
  handler.params.condition = exports.filter(handler, api);

  // 更新数据
  exports.control(handler, api.schema).update(function (err, data) {
    if (err) {
      return callback(err);
    }

    // 用ID更新，且没有更新到数据，则报错
    if (handler.params.id && !data) {
      return callback(new errors.db.NotExist());
    }

    sync(handler, api.schema);

    // 更新多件时，返回的是件数
    if (_.isNumber(data)) {
      return callback(err, data);
    }

    // 用ID更新时
    data = exports.reject(data, api);

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

  var api = handler.params.__api;

  // 判断structure是否被锁定
  if (isLocked(api.schema)) {
    return callback(new errors.db.Locked())
  }

  // 生成filter
  handler.params.condition = exports.filter(handler, api);

  // 更新数据
  exports.control(handler, api.schema).upsert(callback);
  sync(handler, api.schema);
};


/**
 * @desc 排序<br>
 *  - 固定字段排序<br>
 *  - 动态字段排序，动态时变量里用指定的变量名从获取值当做排序字段<br>
 * @ignore
 * @param handler 上下文对象
 * @param {Object} handler.params 参数信息
 * @param {String} handler.params.sorts|hanlder.params.order 动态排序时 包含排序字段
 * @param board 排序定义[[col1: 1], [col2: -1], [col3: 1]]
 * @returns {Array} 排序后数据
 */
exports.order = function (handler, board) {

  var sorts = _.sortBy(board.sorts, function (sort) {
    return sort.index;
  });

  var result = [];
  _.each(sorts, function (sort) {

    var object = [];
    if (sort.dynamic == "fix") {
      object.push(sort.key);
      object.push(sort.order.toLowerCase() == "asc" ? 1 : -1);
    }

    if (sort.dynamic == "dynamic") {
      var data = handler.params.sort || handler.params.order;
      object.push(data[sort.key]);
      object.push(sort.order.toLowerCase() == "asc" ? 1 : -1);
    }
    result.push(object);
  });

  return result;
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

  // 没有检索条件，返回空
  var data = handler.params.condition || handler.params.filter, or = {};

  _.each(board.filters, function (filter) {

    var and = or[filter.group] = or[filter.group] || {}, value = "";
    if (_.str.isBlank(filter.parameter)) {          // 如果参数没指定，则使用缺省值

      value = parseReserved(handler, filter.default);
    } else if (data) {

      if (_.isUndefined(data[filter.parameter])) {  // 如果没能取到参数值，则使用缺省值
        value = parseReserved(handler, filter.default);
      } else {
        value = data[filter.parameter];
      }
    }

    if (!_.isUndefined(value) && value !== "") {    // 允许null的比较，所以去掉isNull的判断

      var compare = operator.compare(filter.operator, filter.key, value);

      if (and[filter.key]) {                        // 存在相同名的条件，则以and形式扩展
        and[filter.key] = _.extend(and[filter.key], compare[filter.key]);
      } else {
        and = _.extend(and, compare);
      }
    }
  });

  // 去除空的条件
  or = _.reject(_.values(or), function (item) {
    return _.isEmpty(item);
  });

  if (or.length <= 0) {
    return valid({});
  }

  // 如果只有一个or条件的group，则去除or比较符
  return or.length == 1 ? valid(or[0]) : valid(operator.compare("$or", null, or));
};


/**
 * @desc 去掉被选择项目以外的项目
 * 1. 只拷贝被选择的项目
 * 2. 如果定义了format或alias，则进行格式化和重命名
 * 3. 支持内嵌文档的拷贝，只支持两层结构
 *
 * 特殊处理
 *  当schema是structure时，返回所有字段。因为，structure的board无法完整描述schema本身的定义
 * @ignore
 * @param data
 * @param board
 * @returns {Object}
 */
exports.reject = function (data, board) {

  if (board.schema == "structure") {
    return data;
  }

  if (!data) {
    return {};
  }

  var result = {};
  _.each(board.selects, function (column) {
    if (!column.select) {
      return;
    }

    var parent = column.key.split(".")[0], child = column.key.split(".")[1];
    if (child) {

      var key = column.alias || child, val = data[parent], converted;
      if (_.isArray(val)) { // array 遍历数组，拷贝指定的值

        var array = result[parent] || [];
        _.each(val, function (item, index) {

          array[index] = array[index] || {};
          var converted = helper.format(item[child], column.format);
          _.isUndefined(converted) || (array[index][key] = converted);
        });

        result[parent] = array;

      } else if (_.isObject(val)) { // mixed 如果指定有别名，则用别名取代json路径

        converted = helper.format(val[child], column.format);
        if (column.alias) {
          _.isUndefined(converted) || (result[key] = converted);
        } else {
          result[parent] = result[parent] || {};
          _.isUndefined(converted) || (result[parent][key] = converted);
        }
      }
    } else {

      converted = helper.format(data[column.key], column.format);
      _.isUndefined(converted) || (result[column.alias || column.key] = converted);
    }
  });

  return result;
};


/**
 * @desc 关联表
 *  在数据中找到指定的key值，检索关联表，获取数据
 *  并将结果保存到data的options里
 * @ignore
 * @param handler
 * @param data 数据
 * @param dataKey 要关联的字段
 * @param link 被关联的表
 * @param linkKey 关联字段
 * @param select 选择项目
 * @param callback 无返回值
 */
exports.join = function (handler, data, dataKey, link, linkKey, select, callback) {
  if (!data || !dataKey || !link || !select) {
    return callback();
  }

  data.options = data.options || {};

  var selected = _.keys(data.options[link]), keys = mpath.get(dataKey, data.items || data);
  keys = _.isArray(keys) ? keys : [keys];
  keys = _.union(_.compact(_.difference(_.flatten(keys), selected))); // 去除已经获取的，空的，重复的

  if (_.isEmpty(keys)) {
    return callback();
  }

  // 指定关联条件
  var filter = {limit: Number.MAX_VALUE, condition: {}};
  filter.condition[linkKey || "_id"] = {$in: keys};
  filter.select = select;

  // 查询
  exports.control(handler.copy(filter), link).list(function (err, result) {
    _.each(result.items, function (item) {
      data.options[link] = data.options[link] || {};
      data.options[link][item[linkKey] || item._id.toHexString()] = item;
    });

    callback(err);
  });
};

/**
 * @desc 判断表是否被锁定
 * @ignore
 * @param name 表名
 * @returns {boolean}
 */
function isLocked(name) {

  var schema = _.findWhere(light.model.rider.structure, {schema: name});
  return schema.lock == 1;
}


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
  if (keyword === "$uid") {
    return handler.uid;
  }

  if (keyword === "$sysdate") {
    return new Date();
  }

  if (keyword === "$systime") {
    return new Date();
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
    return _.map(condition, function (item) {
      if (!_.has(item, "valid")) {
        item.valid = 1;
      }

      return item;
    });
  }

  if (!_.has(condition, "valid")) {
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
  async.eachSeries(board.selects || [], function (item, next) {
    if (item.select) {
      return exports.join(handler, data, item.key, item.option, item.link, item.fields, next);
    } else {
      next();
    }
  }, function (err) {
    callback(err, data);
  });
}


/**
 * 同步缓存
 * @param handler
 * @param schema
 */
function sync(handler, schema) {

  var cache = [
    constant.MODULES_NAME_STRUCTURE,
    constant.MODULES_NAME_BOARD,
    constant.MODULES_NAME_ROUTE,
    constant.MODULES_NAME_CONFIGURATION,
    constant.MODULES_NAME_VALIDATOR,
    constant.MODULES_NAME_I18N
  ];

  // 缓存被启用，操作的是系统DB，是被缓存的表 满足上述3个条件时，进行同步
  if (!config.cache.enable || handler.domain != constant.SYSTEM_DB || !_.contains(cache, schema)) {
    return;
  }

  light.model.rider.app.get(handler, {condition: {domain: handler.domain}}, function (err, result) {
    if (err || _.isEmpty(result)) {
      return;
    }

    handler.extendParams({
      key: "update.cache",
      server: process.env.DEV ? [{name: "127.0.0.1", port: process.env.PORT || 7000}] : result.extend.ap,
      collection: schema
    });

    signal.send(handler);
  });
}
