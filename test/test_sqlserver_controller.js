/**
 * @file test controller
 */

'use strict';

let _       = require('lodash')
  , CONST   = require('../lib/constant')
  , context = require('../lib/http/context')
  , ctrl    = require('../lib/db/sqlserver/controller')
;

describe('/lib/sqlserver/controller', () => {

  let handler = undefined
    , uid     = '000000000000000000000001'
    , domain  = '710530fe8f7f';

  before(() => {
    handler = new context().create(uid, domain, CONST.SYSTEM_DB_PREFIX);
    process.env.APPNAME = '710530fe8f7f';
    process.env.LIGHTSQLSERVER_HOST = '123.206.81.56';
    process.env.LIGHTSQLSERVER_PORT = '1433';
    process.env.LIGHTSQLSERVER_USER = 'admin';
    process.env.LIGHTSQLSERVER_PASS = 'alphabets';
  });

  describe('query', () => {

    it('list', done => {

      handler.params.script = 'SELECT ' +
        'xml.query(\'/root/item\') AS A, ' +
        'xml.query(\'/root[item=3]\') AS B, [_id], [createAy] ' +
        'FROM [dbo].[xml] WHERE [_id] = <%- condition._id %>';

      handler.params.condition = {_id: 'x123456789'};

      new ctrl(handler).list((err, result) => {
        console.log(err, result);
        done();
      });
    });

    // it('add', function (done) {
    //
    //   handler.params.data = {
    //     xml     : '<root><a>1</a><b>2</b></root>',
    //     createAy: '2012-01-01 10:00:00.000'
    //   };
    //
    //   handler.params.script = 'INSERT INTO [dbo].[xml] ([_id], [xml], [createAy], [createAt], [createBy], [valid]) ' +
    //     'VALUES (<%- data._id %>,<%- data.xml %>,<%- data.createAy %>, <%-data.createAt%>, <%-data.createBy%>, <%-data.valid%>)';
    //
    //   new ctrl(handler).add((err, result) => {
    //     console.log(err, result);
    //     done();
    //   });
    // });

    // it('update', function (done) {
    //
    //   handler.params.data = {
    //     xml     : '<root><a>1</a><b>2</b></root>',
    //     createAy: '2018-01-01 10:00:00.000'
    //   };
    //
    //   handler.params.id = '5a5eaa060e927ca2ac254db7';
    //
    //   handler.params.script = 'UPDATE [dbo].[xml] ' +
    //     'SET [xml] = <%- data.xml %>,[createAy] = <%- data.createAy %> ' +
    //     'WHERE [_id] = <%- condition._id %>';
    //
    //   new ctrl(handler).update((err, result) => {
    //     console.log(err, result);
    //     done();
    //   });
    // });

    // it('get', function (done) {
    //
    //   handler.params.id = 'x123456789';
    //   handler.params.script = 'SELECT xml.query(\'/root/item\') AS A, xml.query(\'/root[item=3]\') AS B, ' +
    //     '[_id], [createAy] FROM [dbo].[xml] WHERE [_id] = <%- condition._id %>';
    //
    //   new ctrl(handler).get((err, result) => {
    //     console.log(err, result);
    //     done();
    //   });
    // });

    // it('count', function (done) {
    //
    //   handler.params.script = 'SELECT COUNT(1) AS COUNT FROM [dbo].[xml]';
    //
    //   new ctrl(handler).count((err, result) => {
    //     console.log(err, result);
    //     done();
    //   });
    // });

  });

});
