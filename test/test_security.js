/**
 * @file test security
 */

"use strict";

const should  = require("should")
  , security  = require("../lib/security")
;

describe("/lib/security", function () {

  /** *************************************** **/
  describe("exports.encrypt", function () {

    it("encrypt", function (done) {

      console.log(security.encrypt('1234567890123456', '1234567890123456'));
      console.log(security.decrypt('7a91d5ee4bbdc2f3bea9913118855b8f', 'light'));

      done();
    });
  });
});