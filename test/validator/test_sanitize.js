/**
 * @file test sanitize
 */

"use strict";

let moment = require("moment")
  , should  = require("should")
  , sanitize  = require("../../lib/validator2/sanitize")
  ;

describe("/lib/validator/sanitize", function () {

  before(function() {
  });

  /** *************************************** **/
  describe("exports.dateFormat", function () {

    it("timezone", function (done) {

      let result
        , date = moment("2016-01-01T12:00:00Z").toDate();

      result = sanitize.dateFormat(date);
      result.should.be.eql("2016/01/01");

      result = sanitize.dateFormat(date, "YYYY/MM/DD");
      result.should.be.eql("2016/01/01");

      result = sanitize.dateFormat(date, {timezone: "UTC", format: "YYYY/MM/DD hh:mm"});
      result.should.be.eql("2016/01/01 12:00");

      result = sanitize.dateFormat(date, {timezone: "Asia/Shanghai", format: "YYYY/MM/DD hh:mm"});
      result.should.be.eql("2016/01/01 08:00");

      done();
    });
  });

});