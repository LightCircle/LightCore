/**
 * @file 通用工具类
 * @module light.framework.helper
 * @author r2space@gmail.com
 * @version 1.0.0
 */

"use strict";

var fs          = require("fs")
  , ejs         = require("ejs")
  , os          = require("os")
  , xml         = require("xml2js")
  , util        = require("util")
  , _           = require("underscore")
  , packer      = require("zip-stream")
  , async       = require("async")
  , qr          = require("qr-image")
  , uuid        = require("uuid")
  , numeral     = require("numeral")
  , moment      = require("moment")
  ;

/**
 * @desc 简单生成随机4位字符串
 * @returns {String} 随机4位字符串
 */
exports.randomGUID4 = function () {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

/**
 * @desc 生成随机8位字符串, 会有重复数据生成<br>
 *   - GUID : Global Unique Identifier
 * @returns {String} 随机8位字符串
 */
exports.randomGUID8 = function () {
  return exports.randomGUID4() + exports.randomGUID4();
};

/**
 * @desc 随机12位字符串, 会有重复数据生成<br>
 *   - GUID : Global Unique Identifier
 * @returns {String} 随机12位字符串
 */
exports.randomGUID12 = function () {
  return exports.randomGUID4() + exports.randomGUID4() + exports.randomGUID4();
};

/**
 * @desc 生成唯一识别号<br>
 *   - GUID : Universally Unique Identifier
 * @returns {String} uuid
 */
exports.uuid = function () {
  return uuid.v4();
};

/**
 * @desc 读取模板文件，替换参数，生成结果文件，如果没有指定结果文件，则返回解析后的字符串
 * @param {String} templateFile ejs模板文件
 * @param {Object} parameters 模板文件参数对象
 * @param {String} resultFile 结果文件，如果没有指定则以字符串的形式返回解析的内容
 * @returns {String} 解析内容
 */
exports.ejsParser = function (templateFile, parameters, resultFile) {

  // 读取模板文件
  var template = fs.readFileSync(templateFile, "utf8");

  // 转换模板文件
  ejs.open = undefined;
  ejs.close = undefined;
  var result = ejs.render(template, parameters);

  // 没有指定输出文件，则返回字符串
  if (!resultFile) {
    return result;
  }

  // 输出文件
  fs.writeFileSync(resultFile, result);
  return undefined;
};

/**
 * @desc 格式化EJS模板字符串
 * @param {String} templateString ejs模板文件
 * @param {Object} parameters 模板文件参数对象
 * @returns {String} 格式化结果
 */
exports.ejsFormat = function (templateString, parameters) {

  // 改变模板参数标识
  ejs.open = "{{";
  ejs.close = "}}";

  var result = ejs.render(templateString, parameters);

  // 回复模板参数标识
  ejs.open = undefined;
  ejs.close = undefined;
  return result;
};

/**
 * @desc 判断客户端是否是mozilla浏览器
 * @param {Object} req 请求对象
 * @returns {Boolean} 返回是否
 */
exports.isBrowser = function (req) {
  var userAgent = req.headers["user-agent"].toLowerCase();
  return userAgent.match(/mozilla.*/i);
};

/**
 * @desc 判断请求是ajax请求
 * @param {Object} req 请求
 * @returns {Boolean} 返回是否
 */
exports.isAjax = function (req) {
  return req.headers && req.headers['x-requested-with'] && req.headers['x-requested-with'] == 'XMLHttpRequest';
};

/**
 * @desc 返回客户端类型
 * @param {Object} req 请求
 * @returns {String} 浏览器返回‘mozilla‘，ios应用返回’app名称‘
 */
exports.clientType = function (req) {
  var userAgent = req.headers["user-agent"].toLowerCase();
  return userAgent.split("/")[0];
};

/**
 * @desc 获取AP服务器IP地址的数组，获取的IP地址放到global对象中缓存
 * @returns 返回IP地址
 */
exports.ip = function () {

  if (global.addresses) {
    return global.addresses;
  }

  var interfaces = os.networkInterfaces()
    , addresses = [];

  _.each(interfaces, function (item) {
    _.each(item, function (address) {
      if (address.family === "IPv4" && !address.internal) {
        addresses.push(address.address);
      }
    });
  });

  global.addresses = addresses;
  return global.addresses;
};

/**
 * @desc 获取应用程序情报
 * @returns {Object} 应用程序版本信息等
 */
exports.applicationInfo = function () {

  var app = require(process.cwd() + "/package.json");
  return {
    version: app.version
    , host: os.hostname()
    , application: app.name
    , time: new Date()
  };
};

/**
 * @desc 判断模块是否可以加载
 *  TODO: cwd方法的目录依赖，会因为启动方式，启动目录不同而不准确
 *  TODO: 是否用代码文件存在来判断更加合理？而不是用异常捕获
 * @ignore
 * @param module 模块名称
 * @param path 相对路径
 * @returns {String} 路径
 */
exports.resolve = function (module, path) {
  try {
    return require((path || process.cwd()) + module);
  } catch (e) {
    return undefined;
  }
};


/**
 * @desc 加载给定的字符串，与eval类似
 * @param {String} src 字符串
 * @param {String} filename 加载文件
 * @returns {Object} 加载对象
 */
exports.requireFromString = function (src, filename) {
  var Module = module.constructor;
  var m = new Module();
  m._compile(src, filename);
  return m.exports;
};


/**
 * @desc XML解析器
 * @param {String} file 文件名
 * @param {Function} callback 回调函数，返回解析后结果
 */
exports.xmlParser = function (file, callback) {
  var path = process.cwd() + file;

  if (fs.existsSync(path)) {
    var data = fs.readFileSync(path);
    new xml.Parser().parseString(data, function (err, result) {
      callback(err, result);
    });
    return;
  }

  callback(undefined, {});
};

/**
 * @desc 压缩指定的文件列表
 * @param {Array} list 文件数组
 * @param {String|Object} out 输出文件名或者输出流
 * @param {Function} callback 回调函数，返回解析后结果
 */
exports.zipFiles = function (list, out, callback) {

  var archive = new packer()
    , result = []
    , output = _.isString(out) ? fs.createWriteStream(out) : out; // 输出文件名或输出流

  if (list && list.length > 0) {
    async.eachSeries(list, function (file, next) {
      archive.entry(fs.createReadStream(file), {name: file}, function (err, entry) {
        result.push(entry);
        next(err, entry);
      });
    }, function (err) {
      archive.finish();
      if (callback) {
        callback(err, result);
      }
    });
  } else {

    // 生成一个空文件，标识没有内容
    archive.entry("No file.", {name: "NoFile"}, function (err, entry) {
      archive.finish();
      if (callback) {
        callback(err, result);
      }
    });
  }

  archive.pipe(output);
};

/**
 * @desc 生成QRcode
 * @param {String} message 信息
 * @param {String|Object} out 输出文件名或者输出流
 * @param {Function} callback 回调函数，返回解析后结果
 */
exports.qrcode = function (message, out, callback) {

  var png = qr.image(message, {type: "png", ec_level: "L", margin: 1})
    , stream = _.isString(out) ? fs.createWriteStream(out) : out;

  stream.on("close", function () {
    callback();
  });
  png.pipe(stream);
};

/**
 * @desc 删除文件夹
 * @param {String} path 文件夹
 */
exports.rmdir = function (path) {

  fs.readdirSync(path).forEach(function (file) {

    var current = path + "/" + file;
    if (fs.lstatSync(current).isDirectory()) {
      exports.rmdir(current);
    } else {
      fs.unlinkSync(current);
    }
  });
  fs.rmdirSync(path);
};


/**
 * @desc 字符串格式化
 * @param {String} val 字符串
 * @param {String} format 格式
 * @returns {String} 格式化后结果
 */
exports.format = function(val, format) {
  if (_.str.isBlank(format)) {
    return val;
  }

  // Format number
  if (_.isNumber(val)) {
    return numeral(val).format(format);
  }

  // Format string
  if (_.isString(val)) {
    return util.format(format, val);
  }

  // Format date
  if (_.isDate(val)) {
    return moment(val).format(format);
  }

  return val;
};