/**
 * @file Excel解析, 生成
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
 * @param name Excel文件路径
 * @param mapping 指定excel列与数据库字段的对应关系
 */
exports.parse = function (name, mapping) {

  var workbook = XLSX.readFile(name);

  // 遍历Sheet
  return _.map(workbook.SheetNames, function (name) {

    var worksheet = workbook.Sheets[name]
      , range = XLSX.utils.decode_range(worksheet["!ref"]);

    // 根据 mapping 设定列名称, 如果 mapping 里没有指定, 则将第一行的值作为字段名
    var keys = _.map(_.range(range.e.c + 1), function (col) {
      var item = _.findWhere(mapping, {col: col + 1});
      if (item) {
        return item.key;
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

};


/**
 * 导出数据到xlsx里
 * @param name
 * @param data
 */
exports.dump = function (name, data) {

  function Workbook() {
    if(!(this instanceof Workbook)) return new Workbook();
    this.SheetNames = ['data'];
    this.Sheets = {data: toCsrSpreadSheet(data)};
  }

  XLSX.writeFile(new Workbook(), name);
};


function toCsrSpreadSheet(data) {

  var range = {s: {c: 0, r: 0}, e: {c: 1, r: data.length}};
  var sheet = _.reduce(_.range(data.length), function (memo, row) {

    return _.reduce(_.range(data[row].length), function (memo, index) {
      range.e.c = range.e.c < index ? index : range.e.c;

      var cell = {v: data[row][index], t: 's'};
      if (cell.v === 'number') {
        cell.t = 'n';
      }

      if (cell.v === 'boolean') {
        cell.t = 'b';
      }

      memo[XLSX.utils.encode_cell({c: index, r: row})] = cell;
      return memo;
    }, memo);

  }, {});

  sheet['!ref'] = XLSX.utils.encode_range(range);
  sheet['!cols'] = range.e.c;
  return sheet;
}
