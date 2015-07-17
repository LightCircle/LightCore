/**
 * @file 存取组信息的controller
 * @author r2space@gmail.com
 * @module light.model.group
 * @version 1.0.0
 */


"use strict";

var sync      = require("async")
  , _         = require("underscore")
  , errors    = require("../error")
  , check     = require("../validator")
  , rider     = require("./datarider")
  , constant  = require("./constant")
  ;

/**
 * @desc 组schema
 */


var rules = [
  { name: "$.name", rule: ["isRequired"], message: "name is required." }
];

/**
 * @desc 添加组
 * @param {Object} handler 上下文对象
 * @param {Function} callback 回调函数，返回新创建的组
 */
exports.add = function (handler, callback) {

  var params = handler.params;

  // 名称不能为空
  var checkValid = function(done) {
    var state = check.isValid(params.data, rules);
    if (state.length > 0) {
      done(new errors.parameter.ParamError(state[0].message));
    } else {
      done();
    }
  };

  // 唯一
  var checkUnique = function(done) {
    rider.group.get(handler, {condition: {name: params.data.name, valid: constant.VALID}}, function(err, gr) {
      if (err) {
        return done(new errors.db.Add());
      }
      if (!_.isEmpty(gr) && !_.isUndefined(gr._id)) {
        return done(new errors.parameter.ParamError("Duplicate key:name"));
      }
      done();
    });
  };

  // 设定extend值，并校验
  var createObject = function(done) {
//    handler.addParams("schemaName", "Group");
//    if (params.data.extend) {
//      datarider.createExtendObject(handler, done);
//    } else {
    done(null, null);
//    }
  };

  // 添加数据
  var callDataCtrl = function(group, done) {
    params.data.extend = group;
    rider.group.add(handler, {data: params.data}, done);
  };

//  sync.waterfall([checkValid, checkUnique, createObject, callDataCtrl], callback);
  sync.waterfall([checkUnique, createObject, callDataCtrl], callback);
};

/**
 * @desc 删除组
 * @param {Object} handler 上下文对象
 * @param {Function} callback 返回删除后的组
 */
exports.remove = function (handler, callback) {
  rider.group.remove(handler, callback);
};

/**
 * @desc 更新组
 * @param {Object} handler 上下文对象
 * @param {Function} callback 回调函数，返回更新后的组
 */
exports.update = function (handler, callback) {

  var params = handler.params;

  var checkValid = function(done) {
    var state = check.isValid(params.data, rules);
    if (state.length > 0) {
      done(new errors.parameter.ParamError(state[0].message));
    } else {
      done();
    }
  };

  var checkUnique = function(done) {
    rider.group.get(handler, function(err, gr) {
      if (err) {
        return done(new errors.db.Update());
      }
      if (gr && gr._id.toString() !== params.id) {
        return done(new errors.parameter.ParamError("Duplicate key:name"));
      }
      done();
    });
  };

  // 设定extend值，并校验
  var createObject = function(done) {
//    handler.addParams("schemaName", "Group");
//    if (params.data.extend) {
//      datarider.createExtendObject(handler, done);
//    } else {
    done(null, null);
//    }
  };

  var callDataCtrl = function(group, done) {
    params.data.extend = group;
    rider.group.update(handler, {data: params.data, id: params.id}, done);
  };

//  sync.waterfall([checkValid, checkUnique, createObject, callDataCtrl], callback);
  sync.waterfall([checkUnique, createObject, callDataCtrl], callback);
};

/**
 * @desc 获取组
 * @param {Object} handler 上下文对象
 * @param {Function} callback 回调函数，返回组信息
 */
//exports.get = function (handler, callback) {
//  new Ctrl(handler, constant.MODULES_NAME_GROUP, Group).get(function(err, result) {
//    if (err || !result) {
//      callback(err);
//    } else {
//      getOptions(handler, result, callback)
//    }
//  });
//};

/**
 * @desc 获取Group
 * @param {Object} handler 上下文对象
 * @param {Function} callback 返回Category
 */
//exports.getOne = function (handler, callback) {
//  rider.group.get(handler, function(err, result) {
//    if (err || !result) {
//      callback(err);
//    } else {
//      getOptions(handler, result, callback)
//    }
//  });
//};

/**
 * @desc 根据指定条件查询组
 * @param {Object} handler 上下文对象
 * @param {Function} callback 回调函数，返回组列表
 */
//exports.list = exports.getList = function (handler, callback) {
//  new Ctrl(handler, constant.MODULES_NAME_GROUP, Group).getList(function(err, result) {
//    if (err || !result) {
//      callback(err);
//    } else {
//      getOptions(handler, result, callback)
//    }
//  });
//};

/**
 * @desc 查询符合条件的文档并返回根据键分组的结果
 * @param {Object} handler 上下文对象
 * @param {Function} callback 回调函数，返回Distinct结果
 */
//exports.distinct = function (handler, callback) {
//  new Ctrl(handler, constant.MODULES_NAME_GROUP, Group).distinct(callback);
//};

/**
 * @desc 关键字检索组
 * @param {Object} handler 上下文对象
 * @param {Function} callback 回调函数，返回组一览
 */
//exports.search = function (handler, callback) {
//  handler.addParams("search", "name,description");
//  new Ctrl(handler, constant.MODULES_NAME_GROUP, Group).search(function(err, result) {
//    if (err || !result) {
//      callback(err);
//    } else {
//      getOptions(handler, result, callback)
//    }
//  });
//};

/**
 * 获取Collection定义
 * @returns {*}
 */
//exports.schema = function() {
//  return new Ctrl(handler, constant.MODULES_NAME_GROUP, Group).schema();
//};

/**
 * 设定属性值
 * @param handler
 * @param result
 * @param callback
 */
//function getOptions(handler, result, callback) {
//  var define = handler.define || {
//    selects: [
//      {type: constant.OBJECT_TYPE_GROUP, item: "parent"},
//      {type: constant.OBJECT_TYPE_USER, item: "owners"}
//    ],
//    additions: {group: ["name"], user: ["id", "name"]}
//  };
//
//  var options = {};
//  group.getOptions(handler, define, result.items || result, function(err, groups) {
//    options.group = groups;
//
//    user.getOptions(handler, define, result.items || result, function(err, users) {
//      options.user = users;
//
//      result.options = options;
//      callback(err, result);
//    });
//  });
//}
