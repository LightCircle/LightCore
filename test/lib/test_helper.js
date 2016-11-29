/**
 * @file test helper
 */

"use strict";

let _       = require("underscore")
  , moment  = require("moment")
  , should  = require("should")
  , helper  = require("../../lib/helper")
  ;

describe("/lib/helper", function () {

  before(function() {
    _.str = require("underscore.string")
  });

  /** *************************************** **/
  describe("exports.format", function () {

    it("timezone", function (done) {

      let result
        , date = moment("2016-01-01T12:00:00Z").toDate();

      result = helper.format(date);
      result.should.be.eql(date);

      result = helper.format(date, "YYYY/MM/DD hh:mm:ss");
      result.should.be.eql("2016/01/01 12:00:00");

      result = helper.format(date, "YYYY/MM/DD hh:mm:ss", "UTC");
      result.should.be.eql("2016/01/01 12:00:00");

      result = helper.format(date, "YYYY/MM/DD hh:mm:ss", "UTC");
      result.should.be.eql("2016/01/01 12:00:00");

      result = helper.format(date, "YYYY/MM/DD hh:mm:ss", "Asia/Shanghai");
      result.should.be.eql("2016/01/01 08:00:00");

      result = helper.format(date, "YYYY/MM/DD hh:mm:ss", "XXX");
      result.should.be.eql("2016/01/01 08:00:00");

      done();
    });
  });

  /** *************************************** **/
  describe("exports.generateToken", function () {

    it("generate", function (done) {

      let result = helper.generateToken({}, "light", 60 * 60);

      result.length.should.be.eql(115);
      result.should.startWith("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.");

      done();
    });
  });
});