/**
 * @file Excel解析
 * @author r2space@gmail.com
 * @module light.lib.model.excel
 * @version 1.0.0
 */

"use strict";

var fs      = require("fs")
  , unzip   = require("unzip")
  , _       = require("underscore")
  , xml2js  = require("xml2js")
  , async   = require("async")
  , parser  = new xml2js.Parser();

/**
 * 抽取xmlx的内容, 以sheet为单位, 结果为二位数组
 * @param path Excel文件路径或Stream
 * @param callback
 */
exports.parse = function (path, callback) {

  var file = _.isString(path) ? fs.createReadStream(path) : path
    , sheets = {}
    , strings = "";

  file.pipe(unzip.Parse())
    .on("error", function (err) {
      callback(err);
    })
    .on("close", function () {
      extract(strings, sheets, callback);
    })
    .on("entry", function (entry) {

      // 字符串集合, xml格式
      if (entry.path == "xl/sharedStrings.xml") {
        entry.on("data", function (data) {
          strings += data.toString();
        });
      }

      // sheet值, xml格式
      var sheet = entry.path.match(/^xl\/worksheets\/(sheet\d+)\.xml$/);
      if (sheet) {
        sheets[sheet[1]] = "";
        entry.on("data", function (data) {
          sheets[sheet[1]] += data.toString();
        });
      }
    });
};

/**
 * 单元格对象
 * @param cell
 * @constructor
 */
var Cell = function (cell) {
  var pos = cell.$.r.split(/([0-9]+)/);
  this.column = pos[0].charCodeAt() - 65;
  this.row = parseInt(pos[1]) - 1;
  this.value = cell.v ? cell.v[0] : "";
  this.type = cell.$.t;
};

/**
 * 抽取sheet中的数据
 * @param strings
 * @param sheets
 * @param callback
 */
function extract(strings, sheets, callback) {

  var data = {};

  parser.parseString(strings, function (err, strings) {
    async.forEachOf(sheets, function (sheet, key, next) {
      extractSheet(strings.sst.si, sheet, function (err, result) {
        data[key] = result;
        next(err);
      });
    }, function (err) {
      callback(err, data);
    });
  });
}

function extractSheet(strings, sheet, callback) {
  parser.parseString(sheet, function (err, sheet) {

    // 获取单元格数据
    var cells = [];
    _.each(sheet.worksheet.sheetData, function (sheetData) {
      _.each(sheetData.row, function (row) {
        _.each(row.c, function (c) {
          cells.push(new Cell(c));
        });
      });
    });

    var data = []
      , rows = _.max(cells, "row").row - _.min(cells, "row").row + 1
      , cols = _.max(cells, "column").column - _.min(cells, "column").column + 1;

    // 生成空的二维数组矩阵
    _.times(rows, function () {
      var row = [];
      _.times(cols, function () {
        row.push("");
      });
      data.push(row);
    });

    // 将cell的值, 保存到数组矩阵当中
    _.each(cells, function (cell) {
      if (cell.type != "s") {
        data[cell.row][cell.column] = cell.value;
        return;
      }

      // 如果是s类型, 需要从sheetData里取值
      data[cell.row][cell.column] = _.reduce(strings[parseInt(cell.value)].t, function (result, item) {
        return result + item;
      });
    });

    callback(err, data);
  });
}