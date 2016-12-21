/**
 * @file test controller
 */

'use strict';

let _ = require('underscore')
  , moment = require("moment-timezone")
  , should = require('should')
  , constant = require('../lib/constant')
  , context = require('../lib/http/context')
  , controller = require('../lib/mongo/controller')
  ;

describe('/lib/mongo/controller', function () {

  let _id = undefined;
  let handler = undefined;
  let uid = '000000000000000000000001'
    , testUid = '000000000000000000000002';

  before(function () {
    _.str = require('underscore.string');
    handler = new context().create(uid, constant.SYSTEM_DB, constant.SYSTEM_DB_PREFIX);
    handler.db = {user: "light", pass: "2e35501c2b7e"};
  });

  /** *************************************** **/
  describe('add', function () {

    it('strict mode default value', function (done) {

      let current = moment().format("YYYY-MM-DD HH");

      handler.params.data = {
        field: 'value'
      };

      new controller(handler, 'test').add(function (err, result) {
        should(err).be.null;
        moment(result.createAt).format("YYYY-MM-DD HH").should.be.eql(current);
        moment(result.updateAt).format("YYYY-MM-DD HH").should.be.eql(current);
        result.createBy.should.be.eql(uid);
        result.updateBy.should.be.eql(uid);
        result.valid.should.be.eql(1);

        _id = result._id;
        done();
      });
    });

    it('strict mode ignore set default value', function (done) {

      let current = moment().format("YYYY-MM-DD HH")
        , date = moment("2016-01-01");

      handler.params.data = {
        field: 'value',
        createAt: date,
        updateAt: date,
        createBy: testUid,
        updateBy: testUid,
        valid: 0
      };

      new controller(handler, 'test').add(function (err, result) {
        should(err).be.null;
        moment(result.createAt).format("YYYY-MM-DD HH").should.be.eql(current);
        moment(result.updateAt).format("YYYY-MM-DD HH").should.be.eql(current);
        result.createBy.should.be.eql(uid);
        result.updateBy.should.be.eql(uid);
        result.valid.should.be.eql(1);

        done();
      });

    });

    it('non-strict mode default value', function (done) {

      let current = moment().format("YYYY-MM-DD HH");

      handler.strict = false;
      handler.params.data = {
        field: 'value'
      };

      new controller(handler, 'test').add(function (err, result) {
        should(err).be.null;
        moment(result.createAt).format("YYYY-MM-DD HH").should.be.eql(current);
        moment(result.updateAt).format("YYYY-MM-DD HH").should.be.eql(current);
        result.createBy.should.be.eql(uid);
        result.updateBy.should.be.eql(uid);
        result.valid.should.be.eql(1);

        done();
      });
    });

    it('strict mode ignore set default value', function (done) {

      let date = moment("2016-01-01").toDate();

      handler.strict = false;
      handler.params.data = {
        field: 'value',
        createAt: date,
        updateAt: date,
        createBy: testUid,
        updateBy: testUid,
        valid: 0
      };

      new controller(handler, 'test').add(function (err, result) {
        should(err).be.null;
        result.createAt.should.be.eql(date);
        result.updateAt.should.be.eql(date);
        result.createBy.should.be.eql(testUid);
        result.updateBy.should.be.eql(testUid);
        result.valid.should.be.eql(0);

        done();
      });

    });

    it('add list', function (done) {

      let date = moment("2016-01-01").toDate();

      handler.strict = false;
      handler.params.data = [{
        field: 'value',
        createAt: date,
        updateAt: date,
        createBy: testUid,
        updateBy: testUid,
        valid: 0
      }];

      new controller(handler, 'test').add(function (err, result) {
        should(err).be.null;

        result = result[0];
        result.createAt.should.be.eql(date);
        result.updateAt.should.be.eql(date);
        result.createBy.should.be.eql(testUid);
        result.updateBy.should.be.eql(testUid);
        result.valid.should.be.eql(0);

        done();
      });

    });

  });

  /** *************************************** **/
  describe('update', function () {

    it('strict mode default value', function (done) {

      let current = moment("2016-02-01").toDate();

      handler.strict = true;
      handler.params.id = _id;
      handler.params.data = {
        field: 'new value'
      };

      new controller(handler, 'test').update(function (err, result) {
        result.field.should.be.eql("new value");
        done();
      });
    });

    it('non-strict mode default value', function (done) {

      let current = moment("2016-02-01").toDate();

      handler.strict = false;
      handler.params.id = _id;
      handler.params.data = {
        field: 'new value',
        updateAt: current
      };

      new controller(handler, 'test').update(function (err, result) {
        result.updateAt.should.be.eql(current);
        done();
      });
    });
  });


  /** *************************************** **/
  describe('command', function () {
    it('run db copy command', function (done) {

      handler.params.condition = {
        command: {copydb: 1, fromdb: "SampleApp", todb: "SampleAppCopy"}
      };

      new controller(handler, 'test').command(done);
    });
  });

});