/**
 * @file test importer
 */

'use strict';

let _       = require('lodash')
  , CONST   = require('../lib/constant')
  , context = require('../lib/http/context')
  , cache   = require('../lib/cache')
  , etl     = require('../lib/model/datamigrate')
  , rider   = require('../lib/model/datarider');

describe('/lib/model/datamigrate', function() {

  let handler = undefined
    , uid     = '000000000000000000000001'
    , domain  = 'light';

  this.timeout(30000);

  before(done => {

    process.env.APPNAME = domain;
    process.env.LIGHTDB_HOST = 'mongo.alphabets.cn';
    process.env.LIGHTDB_PORT = '57017';

    cache.manager.init(domain, () => {
      rider.init();
      handler = new context().create(uid, domain, CONST.SYSTEM_DB_PREFIX);
      done();
    });
  });

  describe('datamigrate', () => {

    it('exporter', done => {

      rider.etl.get(handler, {condition: {name: 'i18n-exp'}}, function (err, option) {
        new etl.exporter(handler, option).exec((err, result) => {
          console.log(err, result);
          done();
        });
      });

    });
  });

});
