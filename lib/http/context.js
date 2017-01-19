/**
 * @file 应用程序上下文，主要负责异常处理和参数传递。
 * @module light.core.http.context
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var _ = require("underscore")
  , timezone = require("moment-timezone")
  , config = require("../configuration");

/**
 * @class
 */
var Handler = module.exports = function () {};

/**
 * @desc 使用req与res进行初始化
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @returns {Object} handler context实例<br>
 *    - handler.req <br>
 *    - handler.res <br>
 *    - handler.params <br>
 *    - handler.req.session <br>
 *    - handler.uid       用户ID<br>
 *    - handler.user      登陆用户<br>
 *    - handler.corp      账户识别号<br>
 *    - handler.domain    应用识别号<br>
 *    - handler.code      客户识别号<br>
 *    - handler.db        应用数据库账户
 *    - handler.timezone  时区
 *    - handler.strict    是否是严格模式，默认为true。现在的使用场景有：当strict为false时，允许修改CreateAt和CreateBy
 */
Handler.prototype.bind = function(req, res) {

  this.req = req;
  this.res = res;
  this.attributes = {};

  // 缓存参数
  var self = this;

  // 获取URL参数
  _.each(this.req.query, function(val, key) {
    self.attributes[key] = parseQueryObject(key, val);
  });

  // 获取body参数
  _.each(this.req.body, function(val, key) {
    self.attributes[key] = val;
  });

  // 获取路径上的参数
  _.extend(self.attributes, this.req.params);

  // 转换文件参数
  if(this.req.files){
    self.addParams("files", this.req.files);
  }

  return this;
};

/**
 * 有些客户端，在发送GET请求时参数里加的参数会用JSON序列化以后传递过来（如微信小程序），
 * 所以在这里将参数进行反序列化，然后保存到params里
 * @param key
 * @param val
 * @returns {*}
 */
function parseQueryObject(key, val) {
  if (key == 'condition' || key == 'data') {
    try{
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
  return val;
}

/**
 * @desc 生成一个空的Handler
 * TODO: 添加单元测试代码
 * @param {String} uid 用户对象的_id
 * @param {String} domain DB名称
 * @param {String} code Tenant名称
 * @returns {Object} handler context实例
 */
Handler.prototype.create = function (uid, domain, code) {
  this.bind({
    session: {
      user: {_id: uid},
      domain: domain,
      code: code
    }
  }, {});

  this._code = code;
  this._domain = domain;
  return this;
};

/**
 * @desc 复制一个新的Handler
 * TODO: 添加单元测试代码
 * @param {Object} params 要被复制的handler
 * @returns {Object} 复制后的Handler对象
 */
Handler.prototype.copy = function (params) {
  var self = this
    , handler = new Handler().bind({
      session: {
        user: {_id: self.uid},
        domain: self.domain,
        code: self.code,
        corp: self.corp,
        db: self.db
      },
      headers: self.req.headers // 复制认证信息
    }, {});

  handler.domain = self.domain;
  handler.code = self.code;
  handler.uid = self.uid;

  if (params) {
    _.each(params, function (val, key) {
      handler.addParams(key, val);
    });
  }

  return handler;
};

/**
 * @desc 添加附加属性
 * @param {String} key 附加属性的名称
 * @param {String|Object|Number|Array} val 保存的值
 */
Handler.prototype.addParams = function(key, val) {
  this.attributes[key] = val;
};

/**
 * @desc 删除附加属性
 * @param {String} key 附加属性的名称
 */
Handler.prototype.removeParams = function(key) {
  delete this.attributes[key];
};

/**
 * @desc 扩展附加属性
 * @param {Object} obj 继承对象
 */
Handler.prototype.extendParams = function(obj) {
  _.extend(this.attributes, obj);
};

/**
 * @desc 追加客户端请求参数，
 * 合并了GET，POST方法的请求参数
 */
Object.defineProperty(Handler.prototype, "params", {
  get: function () {
    return this.attributes;
  }
});

/**
 * @desc 追加用户ID
 */
Object.defineProperty(Handler.prototype, "uid", {
  enumerable: true,
  get: function () {

    if (this._uid) {
      return this._uid;
    }

    if (this.req && this.req.session && this.req.session.user) {
      return this.req.session.user._id;
    }

    return undefined;
  },
  set: function (uid) {

    this._uid = uid;
  }
});

/**
 * @desc 追加客户代码
 */
Object.defineProperty(Handler.prototype, "code", {
  enumerable: true,
  get: function () {

    // 如果有明确的设定值，则返回该code
    if (this._code) {
      return this._code;
    }

    // 否则，从用户的session里取code
    if (this.req && this.req.session) {
      return this.req.session.code;
    }

    return undefined;
  },
  set: function (code) {

    // set方法在，需要对明确指定的code进行数据操作时使用。如超级管理员操作等。
    this._code = code;
  }
});

/**
 * @desc 返回数据库名
 */
Object.defineProperty(Handler.prototype, "domain", {
  enumerable: true,
  get: function () {

    // 如果有明确的设定值，则返回该domain
    if (this._domain) {
      return this._domain;
    }

    //// 尝试从请求参数里取domain
    //if (this.attributes.domain) {
    //  return this.attributes.domain;
    //}

    // 否则，从用户的session里取domain
    if (this.req && this.req.session && this.req.session.domain) {
      return this.req.session.domain;
    }

    return undefined;
  },
  set: function (domain) {

    // set方法在，需要对明确指定的domain进行数据操作时使用。如超级管理员操作等。
    this._domain = domain;
  }
});

/**
 * @desc 追加用户信息
 */
Object.defineProperty(Handler.prototype, "user", {
  get: function () {

    // 如果有明确的设定值，则返回该user
    if (this._user) {
      return this._user;
    }

    if (this.req && this.req.session) {
      return this.req.session.user;
    }

    return undefined;
  },
  set: function (user) {

    // set方法在，需要对明确指定的code进行数据操作时使用。如超级管理员操作等。
    this._user = user;
  }
});

/**
 * @desc 追加账户信息
 */
Object.defineProperty(Handler.prototype, "corp", {
  get: function () {
    if (this.req && this.req.session) {
      return this.req.session.corp;
    }

    return undefined;
  }
});

/**
 * @desc 追加数据库访问信息
 */
Object.defineProperty(Handler.prototype, "db", {
  get: function () {
    if (this._db) {
      return this._db;
    }

    if (this.req && this.req.session) {
      return this.req.session.db;
    }

    return {};
  },
  set: function (db) {

    this._db = db;
  }
});

/**
 * @desc 项目名, 有admin dev ops三个, 用host的前缀来识别
 */
Object.defineProperty(Handler.prototype, "project", {
  get: function () {
    if (this.req && this.req.headers.host) {
      return this.req.headers.host.split('.')[0];
    }

    return undefined;
  }
});

Object.defineProperty(Handler.prototype, "timezone", {
  get: function () {
    if (this.user && this.user.timezone) {
      return this.user.timezone;
    }

    if (config.app && config.app.timezone) {
      return config.app.timezone;
    }

    return "UTC";
  }
});

Object.defineProperty(Handler.prototype, "strict", {
  get: function () {
    if (_.isUndefined(this._strict)) {
      return true;
    }
    return this._strict;
  },
  set: function (mode) {
    this._strict = mode;
  }
});
