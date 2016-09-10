/**
 * @file mock
 * @author r2space@gmail.com
 * @module lib.test.mock
 * @version 1.0.0
 */

var context = require("../http/context")
  , _ = require("underscore")
  ;

exports.dummyUID = "000000000000000000000000";
exports.dummyLang = "zh";

/**
 * Mock Handler
 * @param uid
 * @param params
 * @returns {function(this:*)|*|Server}
 */
exports.handler = function (uid, params) {

  if (_.isObject(uid)) {
    params = uid;
    uid = exports.dummyUID;
  }

  return new context().bind(exports.req(uid, {query: params}), exports.res());
};


/**
 * Mock request
 * @param uid
 * @param params
 * @param url
 * @returns {Request}
 */
exports.req = function (uid, params, url) {

  var Request = function () {

    params = params || {};

    this.body = params.body || {};
    this.query = params.query || {};
    this.cookies = params.cookies || {};
    this.session = exports.session(uid);
    this.path = url;
  };

  return new Request();
};


/**
 * Mock response
 * @returns {object}
 */
exports.res = function () {

  var Response = function () {
  };

  Response.prototype.contentType = function (contentType) {
    this._contentType = contentType;
  };

  Response.prototype.status = function (code) {
    this._status = code;
    return this;
  };

  Response.prototype.header = function (key, val) {
    this._header = this._header || {};
    this._header[key] = val;
  };

  Response.prototype.send = function (body) {
    this._body = this._body || [];
    this._body.push(body);
  };

  Response.prototype.end = function (body) {
    this._body = this._body || [];
    this._body.push(body);
  };

  Response.prototype.render = function (view, options) {
    this._view = view;
    this._view_options = options;
  };

  Response.prototype.redirect = function (path) {
    this._redirect = path;
  };

  Object.defineProperty(Response.prototype, "data", {
    get: function () {
      return {
        contentType: this._contentType,
        status: this._status,
        header: this._header,
        body: this._body,
        view: this._view,
        view_options: this._view_options,
        redirect: this._redirect
      };
    }
  });

  return new Response();
};


/**
 * Mock session
 * @param uid
 * @returns {Session}
 */
exports.session = function (uid) {

  var Session = function () {

    this._destroy = false;
    this.user = {
      lang: exports.dummyLang
    };
    this.user._id = uid;
  };

  Session.prototype.destroy = function () {
    this._destroy = true;
  };

  return new Session();
};


/**
 * Mock application
 */
exports.app = function () {

  var App = function () {
  };

  App.prototype.all = function (url, callback) {
    this._route = this._route || [];
    this._route.push({
      url: url,
      callback: callback
    });
  };

  App.prototype.use = function (func) {
    this._middleware = this._middleware || [];
    this._middleware.push(func);
  };

  App.prototype.set = function (key, val) {
    this._params = this._params || {};
    this._params[key] = val;
  };

  App.prototype.get = function (key) {
    return this._params[key];
  };

  return new App();
};