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
  , Type     = require('../lib/db/sqlserver/type')
;

describe('/lib/sqlserver/controller', function () {

  const domain = ''
    , code     = ''
    , table    = ''
    , options  = {};

  before(function () {
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

    it('list', function (done) {

      // SELECT
      //   [experience].query('/root/element/end')
      // FROM [USER]
      // WHERE
      // --[experience].exist('/root/element/company[text()="多奥"]') = 1
      // --[experience].exist('/root/element/company[contains(.,"")]') = 1
      // --[experience].exist('/root/element/end[not(text()="")]') = 1

      const params = {_id: new Type.XPathString('5a20c719f4143e80c11220a2')};
      const query = '' +
        'SELECT [_id], [resource] ' +
        'FROM [dbo].[access] ' +
        'WHERE [resource].exist(\'/root/element[text()=<%- condition._id %>]\') = 1';

      new model(domain, code, table, options).list(query, params, (err, result) => {
        console.log(err, result);
        done();
      });
    });

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

    // it('count', function (done) {
    //
    //   const query = 'SELECT COUNT(1) AS COUNT FROM [dbo].[xml]'
    //     , params  = {};
    //
    //   new model(domain, code, table, options).count(query, params, (err, result) => {
    //     console.log(err, result);
    //     done();
    //   });
    // });

  });

});
