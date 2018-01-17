/**
 * @file test controller
 */

'use strict';

let _       = require('lodash')
  , CONST   = require('../lib/constant')
  , context = require('../lib/http/context')
  , cache   = require('../lib/cache')
  , rider   = require('../lib/model/datarider');

describe('/lib/sqlserver/controller', () => {

  let handler = undefined
    , uid     = '000000000000000000000001'
    , domain  = '710530fe8f7f';

  before(done => {

    process.env.APPNAME = '710530fe8f7f';
    process.env.LOCAL = 'true';
    process.env.LIGHTSQLSERVER_HOST = '123.206.81.56';
    process.env.LIGHTSQLSERVER_PORT = '1433';
    process.env.LIGHTSQLSERVER_USER = 'admin';
    process.env.LIGHTSQLSERVER_PASS = 'alphabets';

    cache.manager.init(domain, () => {
      rider.init();
      handler = new context().create(uid, domain, CONST.SYSTEM_DB_PREFIX);
      done();
    });
  });

  describe('query', () => {
    it('list', done => {
      handler.params.condition = {section: '5a3a0aa718bfa9791309ee59', position: '5a3a0fee18bfa9791309ee60'};
      rider.employee.list(handler, (err, result) => {
        console.log(err, result);
        done();
      });
    });
  });

});
