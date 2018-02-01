/**
 * @file test launcher
 * @author r2space@hotmail.com
 * @module launcher.js
 */

"use strict";

var test = light.framework.test
  , should = test.should
  , mock = test.mock
  , async = test.async
  , job = require(__core + "/lib/job/launcher")
  ;

describe("/lib/job/launcher", function () {

  /** *************************************** **/
  describe("exports.start", function () {

    this.timeout(2000);
    it("Performed once every 1 minutes.", function (done) {

      var counter = 0, id = "100";
      job.start({time: "* * * * * *", id: id, script: "ls"}, function (err, result) {

        should(err).be.not.ok;
        should(result).be.ok;
        counter++;
      });

      setTimeout(function () {
        counter.should.be.equal(1);
        job.stop(id);
        done();
      }, 1100);
    });
  });

  /** *************************************** **/
  describe("exports.immediate", function () {

    it("Performed once.", function (done) {

      job.immediate({}, function() {
        done();
      });
    });
  });

});