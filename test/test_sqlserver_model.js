/**
 * @file test model
 */

'use strict';

let _        = require('lodash')
  , moment   = require("moment-timezone")
  , should   = require('should')
  , constant = require('../lib/constant')
  , context  = require('../lib/http/context')
  , model    = require('../lib/db/sqlserver/model')
;

describe('/lib/sqlserver/controller', function () {

  let _id = undefined;
  let handler = undefined;
  let uid     = '000000000000000000000001'
    , testUid = '000000000000000000000002';

  const domain = ''
    , code     = ''
    , table    = ''
    , options  = {};

  before(function () {
    // handler = new context().create(uid, constant.SYSTEM_DB, constant.SYSTEM_DB_PREFIX);
    // handler.db = {user: "light", pass: "2e35501c2b7e"};

    process.env.APPNAME = '710530fe8f7f';
    process.env.LIGHTSQLSERVER_HOST = '123.206.81.56';
    process.env.LIGHTSQLSERVER_PORT = '1433';
    process.env.LIGHTSQLSERVER_USER = 'admin';
    process.env.LIGHTSQLSERVER_PASS = 'alphabets';
  });

  /** *************************************** **/
  // describe('getSql', function () {
  //   it('_getSql', function (done) {
  //     const result = new model(handler, 'test')._getSql('a<%= param %>habets;', {param: 'lp'});
  //     result.should.be.eql('alphabets');
  //     done();
  //   });
  // });

  describe('query', function () {

    // it('list', function (done) {
    //
    //   const query = 'SELECT xml.query(\'/root/item\') AS A, xml.query(\'/root[item=3]\') AS B, [_id], [createAy] FROM [dbo].[xml] WHERE [_id] = \'<%- _id %>\''
    //     , params  = {_id: 'x123456789'};
    //
    //   new model(domain, code, table, options).list(query, params, (err, result) => {
    //     console.log(err, result);
    //     done();
    //   });
    // });

    // it('add', function (done) {
    //
    //   const data = {
    //     _id     : 'x123456782',
    //     xml     : '<root><a>1</a><b>2</b></root>',
    //     createAy: '2012-01-01 10:00:00.000'
    //   };
    //
    //   const query = 'INSERT INTO [dbo].[xml] ([xml],[_id], [createAy]) VALUES (\'<%- data._id %>\',\'<%- data.xml %>\',\'<%- data.createAy %>\')';
    //
    //   new model(domain, code, table, options).add(query, data, (err, result) => {
    //     console.log(err, result);
    //     done();
    //   });
    // });

    // it('update', function (done) {
    //
    //   const data = {
    //     xml     : '<root><a>1</a><b>2</b></root>',
    //     createAy: '2018-01-01 10:00:00.000'
    //   };
    //
    //   const condition = {
    //     _id: 'x123456782'
    //   };
    //
    //   const query = 'UPDATE [dbo].[xml] ' +
    //     'SET [xml] = \'<%- data.xml %>\',[createAy] = \'<%- data.createAy %>\' ' +
    //     'WHERE [_id] = \'<%- condition._id %>\'';
    //
    //   new model(domain, code, table, options).update(query, data, condition, (err, result) => {
    //     console.log(err, result);
    //     done();
    //   });
    // });

    // it('get', function (done) {
    //
    //   const query = 'SELECT xml.query(\'/root/item\') AS A, xml.query(\'/root[item=3]\') AS B, [_id], [createAy] FROM [dbo].[xml] WHERE [_id] = \'<%- _id %>\''
    //     , params  = {_id: 'x123456789'};
    //
    //   new model(domain, code, table, options).get(query, params, (err, result) => {
    //     console.log(err, result);
    //     done();
    //   });
    // });

    it('count', function (done) {

      const query = 'SELECT COUNT(1) AS COUNT FROM [dbo].[xml]'
        , params  = {};

      new model(domain, code, table, options).count(query, params, (err, result) => {
        console.log(err, result);
        done();
      });
    });

  });

});
