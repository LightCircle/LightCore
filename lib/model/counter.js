/**
 * @file 计数器
 * @author r2space@gmail.com
 * @module light.model.counter
 * @version 1.0.0
 */

"use strict";

var Ctrl      = require("../mongo/controller")
  , constant  = require("./constant");

var Counter = {
    type:         { type: String, description: "名称" }
  , sequence:     { type: Number, description: "順番", default: 1 }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
};

exports.increment = function (handler, callback) {

  var condition = handler.params.condition || {}
    , select = handler.params.select || "sequence";

  condition.type = condition.type || constant.DEFAULT_COUNTER;
  handler.addParams("condition", condition);
  handler.addParams("select", select);

  new Ctrl(handler, constant.MODULES_NAME_COUNTER, Counter).increment(callback);
};
