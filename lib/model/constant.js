/**
 * @file 常量定义类
 * @author r2space@gmail.com
 * @module light.model.constant
 * @version 1.0.0
 */


"use strict";

exports.VALID                       = 1;
exports.INVALID                     = 0;
exports.ADMIN_ID                    = "000000000000000000000000";
exports.HMACKEY                     = "light.alphabets.cn";

exports.DEFAULT_USER                = "-";
exports.DEFAULT_TAG                 = "light";
exports.DEFAULT_COUNTER             = "light";

exports.SYSTEM_DB                   = "light";
exports.SYSTEM_DB_PREFIX            = "light";
exports.DEFAULT_TENANT              = "default";

exports.PATH_CONTROLLER             = "/controllers";

exports.MODULES_NAME_STRUCTURE      = "structure";
exports.MODULES_NAME_BOARD          = "board";
exports.MODULES_NAME_ROUTE          = "route";
exports.MODULES_NAME_FILE           = "file";
exports.MODULES_NAME_GROUP          = "group";
exports.MODULES_NAME_CATEGORY       = "category";
exports.MODULES_NAME_USER           = "user";
exports.MODULES_NAME_JOB            = "job";
exports.MODULES_NAME_CONFIGURATION  = "configuration";
exports.MODULES_NAME_VALIDATOR      = "validator";
exports.MODULES_NAME_I18N           = "i18n";


exports.OBJECT_TYPE_USER            = "1";
exports.OBJECT_TYPE_GROUP           = "2";
exports.OBJECT_TYPE_FILE            = "3";
exports.OBJECT_TYPE_CATEGORY        = "4";

exports.PARAMS_SCHEMA               = "__schema";
exports.PARAMS_API                  = "__api";
exports.BOARD_TYPE                  = ["list", "add", "update", "remove", "list", "search", "get", "count"];

exports.CACHE_KEY = {
  BOARD: "board"
};

exports.MSG_TYPE = {
  BOARD_UPDATED: "board_updated"
};

exports.JOB_COMPLETED               = "COMPLETED";
exports.JOB_FAILED                  = "FAILED";
exports.JOB_STARTED                 = "STARTED";
exports.JOB_PAUSED                  = "PAUSED";