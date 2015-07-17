/**
 * @file 单元测试工具类
 * @author r2space@gmail.com
 * @module light.framework.test
 * @version 1.0.0
 */

"use strict";

/**
 * 单元测试工具类
 */
module.exports = {

  should: require("should"),
  mock: require("./mock"),
  async: async,
  api: require("./api")

};

/**
 * 异步操作时，should失败会产生AssertionError异常，而停止继续执行单元测试。
 *  测试代码里，需要捕获AssertionError异常，并调用done方法继续执行。
 *  为了测试代码简洁，这里提供async方法。他简单的捕获异常并负责调用done来继续后续的处理。
 * @param done
 * @param callback
 */
function async(done, callback) {
  try {
    callback();
    done();
  } catch (e) {
    done(e);
  }
}
