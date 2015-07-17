/**
 * @file 存取Category的Controller
 * @author sl_say@hotmail.com
 * @module light.model.category
 * @version 1.0.0
 */

"use strict";

var sync        = require("async")
  , _           = require("underscore")
  , errors      = require("../error")
  , constant    = require("./constant")
  , rider       = require("./datarider")
  ;

/**
 * @desc 添加Category
 * @param {Object} handler 上下文对象
 * @param {Function} callback 返回追加的Category结果
 */
exports.add = function (handler, callback) {

  var params = handler.params.data;

  // 唯一
  var checkUnique = function(done) {
    var condition = {type: params.type, categoryId: params.categoryId, valid: constant.VALID};
    rider.category.get(handler.copy({condition: condition}), function(err, ca) {
      if (err) {
        return done(new errors.db.Add());
      }
      if (!_.isEmpty(ca) && !_.isUndefined(ca._id)) {
        return done(new errors.parameter.ParamError("Duplicate key:type, categoryId"));
      }
      done();
    });
  };

  // 生成Ancestors
  var createAncestors = function(done) {
    var condition = {type: params.type, categoryId: params.parent, valid: constant.VALID};
    rider.category.get(handler.copy({condition: condition}), function(err, cat) {
      var ancestors = [];
      if (!_.isEmpty(cat) && !_.isUndefined(cat._id)) {
        ancestors = cat.ancestors;
        ancestors.push(params.parent);
      }

      done(err, ancestors);
    });
  };

  // 设定extend值，并校验
  var createObject = function(ancestors, done) {
    done(null, null, ancestors);
  };

  // 添加数据
  var callDataCtrl = function(category, ancestors, done) {
    params.ancestors = ancestors;
    params.extend = category;
    rider.category.add(handler, {data: params}, done);
  };

  sync.waterfall([checkUnique, createAncestors, createObject, callDataCtrl], callback);
};
