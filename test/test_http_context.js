/**
 * @file test context
 */

"use strict";

let _       = require("underscore")
  , should  = require("should")
  , context = require("../lib/http/context")
  ;

describe("/lib/http/context", function () {

  before(function() {
    _.str = require("underscore.string")
  });

  /** *************************************** **/
  describe("property", function () {

    it("strict", function (done) {

      let handler = new context().create("", "", "");
      handler.strict.should.be.true;

      handler.strict = false;
      handler.strict.should.be.false;

      handler.strict = true;
      handler.strict.should.be.true;

      done();
    });
  });

});