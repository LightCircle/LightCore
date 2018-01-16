/**
 * @file test controller
 */

'use strict';

let _        = require('lodash')
  , moment   = require("moment-timezone")
  , should   = require('should')
  , constant = require('../lib/constant')
  , context  = require('../lib/http/context')
  , model    = require('../lib/db/sqlserver/model')
;

describe('/lib/mongo/controller', function () {

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

  describe('list', function () {
    it('list', function (done) {

      const query = 'SELECT [Sid],[Expires],[Sess] FROM [dbo].[sessions]'
        , params  = {};

      new model(domain, code, table, options).list(query, params, (err, result) => {

        console.log(err, result);

        // result.should.be.eql('alphabets');
        done();
      });
    });
  });

});
