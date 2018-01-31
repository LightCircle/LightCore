/**
 * @file 应用程序上下文，主要负责异常处理和参数传递。
 * @module light.core.http.context
 * @author r2space@gmail.com
 * @version 1.0.0
 */

'use strict';

const _ = require('underscore')
  , timezone = require('moment-timezone')
  , config = require('../configuration')
  , clone = require('../clone');

/**
 * @class
 */
class Handler {
  constructor() {
  }

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
   *    - handler.api       当前操作的board （平台内部使用）
   */
  bind(req, res) {

    this.req = req;
    this.res = res;
    this.attributes = {};

    // 获取URL参数
    _.each(this.req.query, (val, key) => {
      this.attributes[key] = this.parseQueryObject(key, val);
    });

    // 获取body参数
    _.each(this.req.body, (val, key) => {
      this.attributes[key] = val;
    });

    // 获取路径上的参数
    _.extend(this.attributes, this.req.params);

    // 转换文件参数
    if (this.req.files) {
      this.addParams('files', this.req.files);
    }

    return this;
  }


  /**
   * 有些客户端，在发送GET请求时参数里加的参数会用JSON序列化以后传递过来（如微信小程序），
   * 所以在这里将参数进行反序列化，然后保存到params里
   * @param key
   * @param val
   * @returns {*}
   */
  parseQueryObject(key, val) {
    if (key === 'condition' || key === 'data') {
      try {
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
  create(uid, domain, code) {
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
  }

  /**
   * @desc 复制一个新的Handler
   * @param {Object} params 要被复制的handler
   * @returns {Object} 复制后的Handler对象
   */
  copy(params) {

    const handler = new Handler();

    handler.req = this.req;
    handler.res = this.res;
    handler.uid = this.uid;
    handler.code = this.code;
    handler.domain = this.domain;
    handler.user = this.user;
    handler.db = this.db;
    handler.strict = this.strict;
    handler.api = this.api;

    handler.attributes = clone(params);
    return handler;
  }

  /**
   * @desc 添加附加属性
   * @param {String} key 附加属性的名称
   * @param {String|Object|Number|Array} val 保存的值
   */
  addParams(key, val) {
    this.attributes[key] = val;
  }

  /**
   * @desc 删除附加属性
   * @param {String} key 附加属性的名称
   */
  removeParams(key) {
    delete this.attributes[key];
  }

  /**
   * @desc 扩展附加属性
   * @param {Object} obj 继承对象
   */
  extendParams(obj) {
    _.extend(this.attributes, obj);
  }
}

/**
 * @desc 追加客户端请求参数，
 * 合并了GET，POST方法的请求参数
 */
Object.defineProperty(Handler.prototype, 'params', {
  get: function () {
    return this.attributes;
  }
});

/**
 * @desc 追加用户ID
 */
Object.defineProperty(Handler.prototype, 'uid', {
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
Object.defineProperty(Handler.prototype, 'code', {
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
Object.defineProperty(Handler.prototype, 'domain', {
  enumerable: true,
  get: function () {

    // 如果有明确的设定值，则返回该domain
    if (this._domain) {
      return this._domain;
    }

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
Object.defineProperty(Handler.prototype, 'user', {
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
Object.defineProperty(Handler.prototype, 'corp', {
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
Object.defineProperty(Handler.prototype, 'db', {
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

Object.defineProperty(Handler.prototype, 'timezone', {
  get: function () {
    if (this.user && this.user.timezone) {
      return this.user.timezone;
    }

    if (config.app && config.app.timezone) {
      return config.app.timezone;
    }

    return 'UTC';
  }
});

/**
 * 平台提供了一个模式叫 strict，默认状态下 strict = true 为严格模式
 *
 * 非严格模式，即 strict = false 时
 * 1. 更新数据允许指定 valid createAt createBy updateAt updateBy，
 *    如果没有指定继续使用系统默认值
 * 2. select 项目受 board 定义的选择项目限制。
 *    如果指定了select，那么忽略board的限制，返回select指定的所有项目
 */
Object.defineProperty(Handler.prototype, 'strict', {
  get: function () {
    if (typeof this._strict === 'undefined') {
      return true;
    }
    return this._strict;
  },
  set: function (mode) {
    this._strict = mode;
  }
});

Object.defineProperty(Handler.prototype, 'api', {
  get: function () {
    return this._api;
  },
  set: function (api) {
    this._api = api;
  }
});

module.exports = Handler;