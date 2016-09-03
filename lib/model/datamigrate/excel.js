/**
 * @file Excel解析
 *  参考 https://github.com/SheetJS/js-xlsx
 * @author r2space@gmail.com
 * @module lib.model.excel
 * @version 1.0.0
 */

"use strict";

var _ = require("underscore")
  , XLSX = require("xlsx");

/**
 * 抽取xlsx的内容, 以sheet为单位, 结果为二位数组
 * @param options Excel文件路径
 *   mapping object 指定excel列与数据库字段的对应关系
 *     index: field
 * @param callback
 */
exports.parse = function (options, callback) {

  var workbook = XLSX.readFile(options.name)
    , mapping = options.mapping || [];

  // 遍历Sheet
  var result = _.map(workbook.SheetNames, function (name) {

    var worksheet = workbook.Sheets[name]
      , range = XLSX.utils.decode_range(worksheet["!ref"]);

    // 根据 mapping 设定列名称, 如果 mapping 里没有指定, 则将第一行的值作为字段名
    var keys = _.map(_.range(range.e.c + 1), function (col) {
      if (_.has(mapping, String(col + 1))) {
        return mapping[String(col + 1)];
      }

      var address = XLSX.utils.encode_cell({c: col, r: 0})
        , val = XLSX.utils.format_cell(worksheet[address]);

      return val || String(col + 1);
    });

    // 转换 sheet 数据为 json
    return _.map(_.range(1, range.e.r + 1), function (row) {

      return _.reduce(_.range(range.e.c + 1), function (memo, col) {
        var address = XLSX.utils.encode_cell({c: col, r: row});
        memo[keys[col]] = XLSX.utils.format_cell(worksheet[address]);
        return memo;
      }, {});
    });
  });

  if (callback) {
    callback(null, result);
  }

  return result;
};
