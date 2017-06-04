/**
 * @file    更新代码脚本
 * @module  pull.js
 * @author  r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

global.light  = require("light-core");
var cache     = light.framework.cache
  , context   = light.framework.context
  , helper    = light.framework.helper
  , rider     = light.model.rider
  , file      = light.model.file
  , fs        = light.lang.fs
  , async     = light.util.async;

cache.manager.init(process.env.APPNAME, function (err) {
  if (err) {
    return process.exit(1);
  }

  rider.init();

  // 获取上次更新代码的时间戳
  var last = new Date(-2209017600000); // 1900/01/01
  try {
    last = new Date(Number(fs.readFileSync("/data/" + process.env.APPNAME + "/pull.timestamp")));
  } catch (e) {}

  var handler = new context().create("", process.env.APPNAME, "light");
  rider.code.list(handler, {skip: 0, limit: Number.MAX_VALUE, condition: {at: last}}, function (err, result) {
    if (err) {
      console.log(err);
      return process.exit(1);
    }

    async.eachSeries(result.items, function (code, next) {

      // 获取更新日期最大的值
      console.log(code.name, code.type);
      last = code.updateAt > last ? code.updateAt : last;

      var path = "/data/" + process.env.APPNAME + "/" + code.name;
      helper.mkdirp(path, true);

      // 文件
      if (code.type == "binary") {

        handler.params.id = code.source;
        return file.stream(handler, function (err, stream) {
          if (err) {
            console.log(err);
            return process.exit(1);
          }

          stream.pipe(fs.createWriteStream(path));
          stream.on("end", next);
        });
      }

      // 代码
      fs.writeFile(path, code.source, "utf8", function (err) {
        if (err) {
          console.log(err);
          return process.exit(1);
        }

        next();
      });
    }, function () {

      fs.writeFileSync("/data/" + process.env.APPNAME + "/pull.timestamp", last.getTime());
      process.exit(0);
    });
  });

});
