/**
 * @file API调用策略
 * 访问次数统计, 使用LRU保存到内存当中, 数据格式如下
 *   resource : API名称
 *   remote   : IP
 *   total    : 合计访问次数
 *   last     : 最后访问时间
 *   policy1  : 每日请求限制策略
 *   policy2  : 每秒请求限制策略
 * @module light.lib.crypto.policy
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var LRU     = require("lru-cache")
  , _       = require("underscore")
  , config  = require("../configuration")
  , cache   = LRU({max: 100});

config.policy = config.policy || {};

exports.invalid = function (req) {

  // 限制调用方 IP - 筛选（允许/拒绝）来自特定 IP 地址和/或地址范围的调用。
  if (isDenyIP(req)) {
    return true;
  }

  // 限制调用速率 - 通过限制调用和/或带宽消耗率，防止出现 API 使用峰值。
  if (isOverMaxCalled(req)) {
    return true;
  }

  // TODO:
  // 检查 HTTP 标头 - 强制实施 HTTP 标头的存在和/或值。
  // 设置使用配额 - 允许你强制实施可续订调用或生存期调用卷和/或带宽配额。
  // 验证 JWT - 确保从指定 HTTP 标头或指定查询参数提取的 JWT 存在且有效。

  return false;
};

/**
 * 限制调用方 IP
 * @param req
 * @returns {Boolean}
 */
function isDenyIP(req) {
  return _.contains(config.policy.deny, ip(req));
}

/**
 * 获取IP
 * @param req
 * @returns {*}
 */
function ip(req) {
  return req.ip;
}

/**
 * 限制调用速率
 * @param req
 * @returns {boolean}
 */
function isOverMaxCalled(req) {

  var api = req.method + " " + req.path
    , key = ip(req) + " " + api
    , current = new Date().getTime()
    , prev = cache.get(key);

  if (prev) {

    // 超过一天清除计数
    if (current - prev.last > 24 * 60 * 60 * 1000) {
      prev.policy1.counter = prev.policy2.counter = 1;
      prev.policy1.last = prev.policy2.last = current;
    }
    prev.last = current;
    prev.total++;

    if (checkDayPolicy(api, prev, current)) {
      return true;
    }

    if (checkSecondPolicy(api, prev, current)) {
      return true;
    }

    cache.set(key, prev);
  } else {

    cache.set(key, {
      resource: req.method + req.path,
      remote: ip(req),
      total: 1,
      last: current,
      policy1: {
        last: current,
        counter: 1
      },
      policy2: {
        last: current,
        counter: 1
      }
    });
  }

  return false;
}

/**
 * 每日调用限制策略
 * @param api
 * @param prev
 * @param current
 * @returns {boolean}
 */
function checkDayPolicy(api, prev, current) {

  prev.policy1.counter++;

  // 一天调用超过1000次则出错,
  return prev.policy1.counter > 1000;
}

/**
 * 每秒调用限制策略
 * @param api
 * @param prev
 * @param current
 * @returns {boolean}
 */
function checkSecondPolicy(api, prev, current) {

  // 1秒调用超过2次则出错
  if (prev.policy2.counter > 2) {
    return true;
  }

  if (current - prev.policy2.last > 1000) {
    prev.policy2.counter = 1;
    prev.policy2.last = current;
  } else {
    prev.policy2.counter++;
  }

  return false;
}
