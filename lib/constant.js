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

exports.DB_DEFAULT_LIMIT      = 0;         // 不再限制获取数据的大小，默认返回所有数据，大数据量的时候一定要设定limit参数
exports.DB_MILLION_LIMIT      = 2147483647;// 最大整型常量
exports.DB_GRIDSTORE_WRITE    = "w";
exports.DB_GRIDSTORE_READ     = "r";

exports.SYSTEM_DB             = "light";
exports.SYSTEM_DB_PREFIX      = "light";
exports.DEFAULT_TENANT        = "default";
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
exports.SYSTEM_DB_JOB         = "job";

exports.DEFAULT_USER          = '000000000000000000000001';

/**
 * 默认的非 tenant 表（系统共通表）在这里定义
 */
exports.SYSTEM_TABLE = [
  "configuration",
  "validator",
  "i18n",
  "structure",
  "board",
  "route",
  "tenant",
  "function",
  "etl",
  "code",
  "job",
  "file"
];


exports.COOKIE_SESSION_KEY    = 'light.sid';
exports.COOKIE_CSRF_KEY       = 'light.csrf';
exports.COOKIE_LANG_KEY       = 'light.lang';
exports.SUPPORT_LANG          = ['zh', 'ja', 'en'];

exports.FUNC_STATUS_ENABLED   = '1';
exports.FUNC_STATUS_DISABLED  = '2';
exports.FUNC_KIND_DEVELOPER   = 'developer';
exports.FUNC_KIND_OPERATION   = 'operation';

exports.METHOD_GET            = 'GET';
exports.METHOD_LIST           = 'LIST';
exports.METHOD_ADD            = 'ADD';
exports.METHOD_UPDATE         = 'UPDATE';
exports.METHOD_REMOVE         = 'REMOVE';
exports.METHOD_SEARCH         = 'SEARCH';
exports.METHOD_COUNT          = 'COUNT';

exports.BOARD_TYPE            = ['list', 'add', 'update', 'remove', 'list', 'search', 'get', 'count'];
exports.METHOD                = ['GET', 'POST', 'PUT', 'DELETE', 'GET', 'GET', 'GET', 'GET'];
exports.METHOD_NAME           = ['', 'ADD', 'UPDATE', 'REMOVE', 'LIST', '', 'GET', 'COUNT'];