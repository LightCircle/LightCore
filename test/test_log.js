/**
 * @file test log
 */

"use strict";

let should  = require("should")
  , log     = require("../lib/log")
  , config  = require("../lib/configuration")
  ;

describe("/lib/log", function () {

  /** *************************************** **/
  describe("exports.debug", function () {

    it("debug", function (done) {

      log.debug("debug", undefined);

      config.load([{type: "app", key: "timezone", value: "UTC", valueType: "String"}]);
      log.debug("debug", undefined);

      config.load([{type: "app", key: "timezone", value: "Asia/Shanghai", valueType: "String"}]);
      log.debug("debug", undefined);

      done();
    });
  });

});