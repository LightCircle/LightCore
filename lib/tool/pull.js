/**
 * @file    更新代码脚本
 * @module  pull.js
 * @author  r2space@gmail.com
 * @version 1.0.0
 */

'use strict';

global.light  = require('light-core');
const cache   = light.framework.cache
  , context   = light.framework.context
  , helper    = light.framework.helper
  , log       = light.framework.log
  , rider     = light.model.rider
  , file      = light.model.file
  , fs        = light.lang.fs
  , async     = light.util.async;


cache.manager.init(process.env.APPNAME, err => {
  if (err) {
    return process.exit(1);
  }

  rider.init();

  const handler = new context().create('000000000000000000000001', process.env.APPNAME, 'light');
  rider.code.list(handler, {select: 'name, md5, type, source', condition: {lang: 'node'}}, (err, result) => {
    if (err) {
      return process.exit(1);
    }

    async.eachSeries(result.items, (code, next) => {

      const path = `/data/${process.env.APPNAME}/${code.name}`;
      helper.mkdirp(path, true);

      if (fs.existsSync(path) && helper.fileMd5(path) === code.md5) {
        return next();
      }

      log.debug(`>> update ${code.name}`);

      // 文件
      if (code.type === 'binary') {

        handler.params.id = code.source;
        return file.stream(handler, (err, stream) => {
          if (err) {
            return process.exit(1);
          }

          stream.pipe(fs.createWriteStream(path));
          stream.on('end', next);
        });
      }

      // 代码
      fs.writeFile(path, code.source, 'utf8', err => {
        if (err) {
          return process.exit(1);
        }

        next();
      });
    }, function () {
      process.exit(0);
    });
  });

});
