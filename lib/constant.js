/**
 * @file 常量定义类
 * @author r2space@gmail.com
 * @module light.core.constant
 * @version 1.0.0
 */

"use strict";

exports.VALID                 = 1;
exports.INVALID               = 0;

/** LOG的输出级别 */
exports.LOG_LEVEL_DEBUG       = 3;
exports.LOG_LEVEL_WARN        = 2;
exports.LOG_LEVEL_INFO        = 1;
exports.LOG_LEVEL_ERROR       = 0;

/** LOG的种类 */
exports.LOG_TYPE_APPLICATION  = "application";
exports.LOG_TYPE_AUDIT        = "audit";
exports.LOG_TYPE_OPERATION    = "operation";

exports.PATH_ROUTE            = "/routes/";
exports.PATH_CONTROLLER       = "/controllers/";
exports.PATH_MODULES          = "/modules/";


/**
 * reconnectTries: 重新连接尝试次数，过了这个次数以后，使用该连接，会产生阻塞
 * 现在平台开发端与数据连接，通过HAPROXY做端口转发，HAPROXY会定时切断客户端的tcp连接。
 * 默认为1分钟，现在设定能满足客户端2天的连接。2880 = 1 x 60 x 24 x 2 = 2天
 *
 * 部署到生产环境时，由于与数据库直连，所以不会产生上述情况。
 * 紧当数据库重启2880次，才会出现。所以数据库维护是，最好伴随AP的重启以清除重连计数。
 */
exports.DB_SERVER_OPTIONS = {
  poolSize: 2, socketOptions: {reconnectTries: 2880}
};

exports.DB_OPTIONS            = { w: 1 };
exports.DB_REPLSET_OPTIONS    = null;
exports.DB_MONGOS_OPTIONS     = null;
exports.DB_DEFAULT_LIMIT      = 0;         // 不再限制获取数据的大小，默认返回所有数据，大数据量的时候一定要设定limit参数
exports.DB_MILLION_LIMIT      = 100000000; // 1亿条数据
exports.DB_GRIDSTORE_WRITE    = "w";
exports.DB_GRIDSTORE_READ     = "r";

exports.SYSTEM_DB             = "light";
exports.SYSTEM_DB_PREFIX      = "light";
exports.DEFAULT_TENANT        = "Default";
exports.DEFAULT_USER_TYPE     = "app_admin";

exports.SYSTEM_DB_CONFIG      = "configuration";
exports.SYSTEM_DB_VALIDATOR   = "validator";
exports.SYSTEM_DB_I18N        = "i18n";
exports.SYSTEM_DB_STRUCTURE   = "structure";
exports.SYSTEM_DB_BOARD       = "board";
exports.SYSTEM_DB_ROUTE       = "route";
exports.SYSTEM_DB_TENANT      = "tenant";
exports.SYSTEM_DB_SETTING     = "setting";
exports.SYSTEM_DB_FUNCTION    = "function";
