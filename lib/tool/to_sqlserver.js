/**
 * @file    MongoDB数据移行到SQLServer
 * @module  to_sqlserver.js
 * @author  r2space@gmail.com
 * @version 1.0.0
 */

'use strict';

global.light = require('../../');

const code  = 'light'
  , user    = '000000000000000000000001'
  , table   = 'function'
  , context = light.context
  , handler = new context().create(user, process.env.APPNAME, code);

// 初始化MongoDB
initMongo();
light.cache.manager.init(process.env.APPNAME, err => {
  if (err) {
    return process.exit(1);
  }

  light.model.rider.init();

  light.model.rider[table].list(handler, (err, result) => {
    if (err) {
      console.log(err);
      process.exit(0);
    }



    // 初始化SQLServer
    initSQLServer();
    light.util.async.eachSeries(result.items, (item, done) => {

      handler.params.data = item;
      light.model.rider[table].add(handler, err => {
        if (err) {
          console.log(err);
          process.exit(0);
        }

        done();
      });
    }, () => {
      process.exit(0);
    });
  });

});

function initMongo() {
  process.env.APPNAME = '710530fe8f7f';
  process.env.LIGHTDB_HOST = 'mongo.alphabets.cn';
  process.env.LIGHTDB_PORT = 57017;
  process.env.LIGHTDB_USER = 'developer';
  process.env.LIGHTDB_PASS = '29352d3874dc';
  process.env.LIGHTDB_AUTH = 'SCRAM-SHA-1';
}

function initSQLServer() {
  process.env.LIGHTSQLSERVER_HOST = '123.206.81.56';
  process.env.LIGHTSQLSERVER_PORT = '1433';
  process.env.LIGHTSQLSERVER_USER = 'admin';
  process.env.LIGHTSQLSERVER_PASS = 'alphabets';
}