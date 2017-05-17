/**
 * @file Excel解析, 生成
 *  参考 https://github.com/SheetJS/js-xlsx
 * @author r2space@gmail.com
 * @module lib.model.datamigrate.excel
 * @version 1.0.0
 */

'use strict';

const _   = require('underscore')
  , XLSX  = require('xlsx');


/**
 * 抽取xlsx的内容, 以sheet为单位, 结果为二位数组
 * @param name Excel文件路径
 * @param mapping 指定excel列与数据库字段的对应关系
 */
exports.parse = function (name, mapping) {

  const workbook = XLSX.readFile(name);

  // 遍历Sheet
  return workbook.SheetNames.map(name => {

    const worksheet = workbook.Sheets[name]
      , range = XLSX.utils.decode_range(worksheet['!ref']);

    // 根据 mapping 设定列名称, 如果 mapping 里没有指定, 则将第一行的值作为字段名
    const keys = _.range(range.e.c + 1).map(col => {
      const item = _.findWhere(mapping, {col: col + 1});
      if (item) {
        return item.variable || item.key;
      }

      const address = XLSX.utils.encode_cell({c: col, r: 0})
        , val = XLSX.utils.format_cell(worksheet[address]);

      return val || String(col + 1);
    });

    // 转换 sheet 数据为 json
    return _.range(1, range.e.r + 1).map(row => {

      return _.reduce(_.range(range.e.c + 1), (memo, col) => {
        const address = XLSX.utils.encode_cell({c: col, r: row});
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

  const range = {s: {c: 0, r: 0}, e: {c: 0, r: data.length - 1}};
  const sheet = _.reduce(_.range(data.length), (memo, row) => {

    return _.reduce(_.range(data[row].length), (memo, index) => {
      range.e.c = range.e.c < index ? index : range.e.c;

      let cell = {v: data[row][index], t: 's'};
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
