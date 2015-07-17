/**
 * @file test model
 * @author r2space@hotmail.com
 * @module /test/lib/mongo/model.js
 */

"use strict";

var test = light.framework.test
  , ObjectID  = light.util.mongodb.ObjectID
  , should = test.should
  , mock = test.mock
  , async = test.async
  , Model = require(__framework + "/lib/mongo/model")
  ;


var domain = "UnitTest"
  , code = "lotus.test"
  , define = {
    _id: {type: ObjectID},
    column1: {type: String},
    column2: {type: Number},
    column3: {type: Date}
  }
  , id;

describe("/lib/mongo/model", function () {

  /** *************************************** **/
  describe("exports.add", function () {

    var current = new Date()
      , model = new Model(domain, code, define);

    it("add dummy object", function (done) {
      model.add({column1: "string", column2: "1", column3: current}, function (err, result) {
        should.not.exist(err);
        result._id.should.be.exist;
        result.column1.should.be.equal("string");
        done();
      });
    });

    it("add empty object", function (done) {
      model.add({}, function (err, result) {
        should.not.exist(err);
        should.not.exist(result.column1);
        result._id.should.be.exist;
        done();
      })
    });

    it("add array object", function (done) {
      model.add([{column2: 2}, {column2: 3}], function (err, result) {
        should.not.exist(err);
        result.should.be.Array;
        done();
      })
    });
  });

  /** *************************************** **/
  describe("exports.get", function () {

    var model = new Model(domain, code, define)
      , id;

    it("get by condition", function (done) {
      model.get({column1: "string"}, function (err, result) {
        should.not.exist(err);
        result._id.should.be.exist;

        id = result._id;
        done();
      });
    });

    it("get by object id", function (done) {
      model.get(id, function (err, result) {
        should.not.exist(err);
        result._id.should.be.exist;
        done();
      });
    });

    it("get by string id", function (done) {
      model.get(id.toHexString(), function (err, result) {
        should.not.exist(err);
        result._id.should.be.exist;
        done();
      });
    });

    it("no data", function (done) {
      model.get({column1: "NoData"}, function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it("set select field", function (done) {
      model.get(id, {column1: 1}, function (err, result) {
        should.not.exist(err);
        should.not.exist(result.column2);
        result._id.should.be.exist;
        result.column1.should.be.equal("string");
        done();
      });
    });

  });


  /** *************************************** **/
  describe("exports.upsert", function () {

    var model = new Model(domain, code, define);

    it("insert", function (done) {
      model.upsert({column1: "NoData"}, {column1: "string1"}, function (err, result) {
        should.not.exist(err);
        result.should.be.instanceof(ObjectID);

        done();
      });
    });

    it("update", function (done) {
      model.upsert({column1: "string1"}, {column1: "string"}, function (err, result) {
        should.not.exist(err);
        result.should.be.a.Number;

        done();
      });
    });
  });


  /** *************************************** **/
  describe("exports.fileToGrid", function () {

    var model = new Model(domain, code);

    it("write", function (done) {

      var file = {
        originalFilename: "test source",
        headers: {'content-type': ""},
        path: "test_model.js"
      };

      model.fileToGrid(__dirname, file, function (err, result) {
        should.not.exist(err);
        result.fileId.should.be.ok;

        id = result.fileId;
        done();
      });
    });
  });


  /** *************************************** **/
  describe("exports.gridToFile", function () {

    var model = new Model(domain, code);

    it("read", function (done) {

      model.gridToFile("/tmp/testfile.js", id.toHexString(), function (err, result) {
        should.not.exist(err);
        result.should.be.ok;
        done();
      });
    });
  });


  /** *************************************** **/
  describe("exports.readFromGrid", function () {

    var model = new Model(domain, code);

    it("read", function (done) {

      model.readFromGrid(id.toHexString(), function (err, result) {
        should.not.exist(err);
        result.filename.should.be.ok;
        done();
      });
    });
  });
});