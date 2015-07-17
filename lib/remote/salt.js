/**
 * @file salt命令
 * @author r2space@gmail.com
 * @module light.framework.remote.salt
 * @version 1.0.0
 */


"use strict";

var exec  = require("child_process").exec
  , util  = require("util")
  , fs    = require("fs")
  , async = require("async");

// TODO Epel源改为自己的源，然后从定向到Epel
var REPOS = "http://ftp.linux.ncsu.edu/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm";

/**
 * 安装minion，并启动服务
 *  一条命令安装参照 https://github.com/saltstack/salt-bootstrap
 *  服务器需要密码方式访问，需要使用sshpass命令
 *  服务器需要秘钥方式访问，
 * @param {String} master salt-master服务器
 * @param {String} host 安装minion的服务器
 * @param {String} param 密码，或键文件
 * @param {Function} callback
 */
exports.minion = function(master, host, param, callback) {

  // bootstrap有BUG，所以采用手动安装
  var bootstrap     = "curl -L https://bootstrap.saltstack.com/develop | sh -s -- git develop"
    , addEpelRepos  = "rpm -Uvh " + REPOS
    , installMinion = "yum install salt-minion -y"
    , addMasterName = "echo 'master: salt' >> /etc/salt/minion"
    , setMasterHost = "echo '" + master + " salt' >> /etc/hosts"
    , startMinion   = "service salt-minion start"
    ;

  var isKeyFile = fs.existsSync(param);
  async.eachSeries([addEpelRepos, installMinion, addMasterName, setMasterHost, startMinion], function(cmd, loop) {

    var command = undefined;
    if (isKeyFile) {
      command = util.format("ssh -i %s root@%s '%s'", param, host, cmd);
    } else {
      command = util.format("sshpass -p %s ssh root@%s '%s'", param, host, cmd);
    }

    console.log(command);
    exec(command, function (error, stdout) {
      console.log(error);
      console.log(stdout);
      loop(error, stdout);
    });
  }, function(error) {
    callback(error);
  });

};

/**
 * 安装salt-master
 * @param host
 * @param param
 * @param callback
 */
exports.master = function(host, param, callback) {

  var addRepos      = "rpm -Uvh " + REPOS
    , installMaster = "yum install salt-master -y"
    , startMaster   = "service salt-master start";

  var isKeyFile = fs.existsSync(param);
  async.eachSeries([addRepos, installMaster, startMaster], function(cmd, loop) {

    var command = undefined;
    if (isKeyFile) {
      command = util.format("ssh -i %s root@%s '%s'", param, host, cmd);
    } else {
      command = util.format("sshpass -p %s ssh root@%s '%s'", param, host, cmd);
    }

    console.log(command);
    exec(command, function (error, stdout) {
      console.log(error);
      console.log(stdout);
      loop(error, stdout);
    });
  }, function(error) {
    callback(error);
  });

};

/**
 * 接受minion的托管请求
 * @param minion
 * @param callback
 */
exports.accepte = function(minion, callback) {
  var command = "salt-key -a " + minion;

  console.log(command);
  exec(command, function (error, stdout) {
    console.log(error);
    console.log(stdout);
    callback(error, stdout);
  });
};