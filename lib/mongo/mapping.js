/**
 * @file mapping
 * @author qiou_kay@163.com
 * @module light.core.mongo.mapping
 * @version 1.0.0
 */
"use strict";

var _         = require("underscore")
  , type      = require("./type")
  , operator  = require("./operator")
  ;


/**
 * 调用model的add方法时，根据定义把定义里面定义了default值但是object没有包含的项补上
 * @param object
 * @param define
 */
exports.default = function (object, define, addition) {
  if (!define || !object) {
    return object;
  }

  if (_.isArray(object)) {
    _.each(object, function (item) {
      setDefault(item, define, addition);
    });
  } else {
    setDefault(object, define, addition);
  }

  return object;
};

/**
 * default方法的详细处理函数
 * @param object
 * @param define
 * @param addition
 */
function setDefault(object, define, addition) {

  _.each(_.keys(define), function (key) {
    // 该项没有值，定义有default的情况，添加该项值为默认值
    if (!_.isUndefined(define[key].default) && _.isUndefined(object[key])) {
      object[key] = define[key].default;
      var needParse = (_.isString(object[key]) && _.contains(["array", "object"], typeLowerCase(define[key].type)));
      if (needParse) {
        object[key] = type.dataParse(object[key], define[key], addition);
      }
    }

    if (_.isUndefined(define[key].contents)) {
      return;
    }

    // 如果是数组的情况，需要遍历查看
    if ((define[key].type == Array || define[key].type == "Array")) {
      if (!object[key]) {
        return;
      }

      _.isArray(object[key]) || (object[key] = [object[key]]);
      if (object[key].length < 1) {
        return;
      }

      _.each(object[key], function (item, index) {
        object[key][index] = exports.default(item, define[key].contents);
      });
    } else {
      object[key] = exports.default(object[key], define[key].contents);
    }
  });
}

/**
 * 更新系数据类型转换
 * @param object
 * @param define
 * @param addition
 */
exports.dataParseAll = function (object, define, addition) {

  if (!define) {
    return object;
  }

  if (_.isArray(object)) {
    _.each(object, function (item) {
      dataParse(item, define, addition);
    });
  } else {
    dataParse(object, define, addition);
  }

  return object;
};

function dataParse(object, define, addition) {

  _.each(_.keys(object), function (key) {
    // 利用操作符对应的方法转换，如果没有找到操作符的定义则不做转换
    var hasMongoOperator = (/^\$.*/i).test(key);
    if (hasMongoOperator) {
      object[key] = operator.parse(key, object[key], define, addition);
      return;
    }

    var option = getOption(key, define);
    if (_.isUndefined(option) || _.isUndefined(option.type)) {
      delete object[key];
      return;
    }

    // 如果object[key]的属性中有mongo操作符，则递归解析，option不变
    var containsMongoOperator = _.find(_.keys(object[key]), function (obj) {
      return (/^\$.*/i).test(obj)
    });
    if (_.isObject(object[key]) && containsMongoOperator) {
      return exports.dataParseAll(object[key], option, addition);
    }

    // 如果option.contents有值且不是基础类型，则递归解析
    if (!_.isUndefined(option.contents) && !_.contains(type.dataTypes, typeLowerCase(option.contents))) {
      object[key] = exports.dataParseAll(object[key], option.contents, addition);
    }
    // 否则直接转换类型
    else {
      object[key] = type.dataParse(object[key], option, addition);
    }
  });
}

/**
 * 查询系数据类型转换
 * @param object
 * @param define
 */
exports.queryParseAll = function (object, define, addition) {

  if (!define) {
    return object;
  }

  if (_.isArray(object)) {
    _.each(object, function (item) {
      queryParse(item, define, addition);
    });
  } else {
    queryParse(object, define, addition);
  }

  return object;
};

function queryParse(object, define, addition) {

  _.each(_.keys(object), function (key) {

    // 利用操作符对应的方法转换，如果没有找到操作符的定义则不做转换
    var hasMongoOperator = (/^\$.*/i).test(key);
    if (hasMongoOperator) {
      object[key] = operator.parse(key, object[key], define, addition);
      return;
    }

    var option = getOption(key, define);
    if (_.isUndefined(option) || _.isUndefined(option.type)) {
      delete object[key];
      return;
    }

    // 如果object[key]的属性中有mongo操作符，则递归解析，option不变
    var containsMongoOperator = _.find(_.keys(object[key]), function (obj) {
      return (/^\$.*/i).test(obj)
    });
    if (_.isObject(object[key]) && containsMongoOperator) {
      return exports.queryParseAll(object[key], option, addition);
    }

    // 如果option.contents有值且不是基础类型，则递归解析
    if (!_.isUndefined(option.contents) && !_.contains(type.dataTypes, typeLowerCase(option.contents))) {
      object[key] = exports.queryParseAll(object[key], option.contents, addition);
    }
    // 否则直接转换类型
    else {
      object[key] = type.queryParse(object[key], option, addition);
    }
  });
}

/**
 * 根据key从数据定义中获取类型描述
 * @param key
 * @param define
 * @returns {*}
 */
function getOption(key, define) {
  var option;
  // 如果是xxx.xx.x的形式，则取末端属性对应的类型
  var hasChildKey = (String(key).indexOf(".") > 0);
  if (hasChildKey) {
    var keyLevels = String(key).split(".")
      , numReg = /^\d+$/i;
    option = define[keyLevels[0]];
    _.each(keyLevels, function (k, index) {
      if (numReg.test(k) || _.isUndefined(option)) {
        return;
      }
      if (index > 0 && option.contents) {
        option = option.contents[k];
      }
    });
  } else {
    option = define[key];
  }

  return option;
}

/**
 * 获取类型的小写字符串
 * @param t
 * @returns {string}
 */
function typeLowerCase(t) {

  if (t instanceof Function) {
    t = t.name;
  }
  if (_.isString(t)) {
    return t.toLowerCase();
  }
  return t;
}
