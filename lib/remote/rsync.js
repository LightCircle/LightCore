/**
 * @file rsync命令
 * @author r2space@gmail.com
 * @module light.framework.remote.rsync
 * @version 1.0.0
 */

"use strict";

var exec  = require("child_process").exec
  , util  = require("util");

/**
 * 执行rsync，使用salt.modules.rsync，本地同步
 *  salt.modules.rsync.rsync(
 *    src,
 *    dst,
 *    delete=False,
 *    force=False,
 *    update=False,
 *    passwordfile=None,
 *    exclude=None,
 *    excludefrom=None
 *  )
 * @param host 主机
 * @param source 备份源
 * @param dest 保存路径
 * @param exclude 除外对象
 */
exports.local = function(host, source, dest, exclude, callback) {

  var command = util.format(
      "salt -L '%s' rsync.rsync %s %s delete=True exclude=%s"
    , source
    , dest
    , exclude
  );

  console.log(command);
  exec(command, function (error, stdout) {
    console.log(error);
    console.log(stdout);
    callback(error, stdout);
  });
};

/**
 * 执行sync，与远程服务器进行同步
 * 需要备份服务器以demon方式启动rsync服务
 * @param srcHost 备份源服务器
 * @param src 备份路径
 * @param dstHost 备份先服务器
 * @param dst 保存路径
 * @param callback
 */
exports.remote = function(srcHost, src, dstHost, dst, callback) {

  var command = util.format(
    "salt -L '%s' cmd.run 'rsync -av %s rsync://%s/%s --delete'"
    , srcHost
    , src
    , dstHost
    , dst
  );

  console.log(command);
  exec(command, function (error, stdout) {
    console.log(error);
    console.log(stdout);
    callback(error, stdout);
  });
};
