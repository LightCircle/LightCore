/**
 * @file 多国语言
 * @author r2space@gmail.com
 * @module light.framework.i18n
 * @version 1.0.0
 */

"use strict";

var _         = require("underscore")
  , constant  = require("./constant")
  , cache     = require("./cache");

module.exports = {

  load: function (catalog) {
    this.catalog = catalog;
  },

  /**
   * 翻译
   * @param key
   * @returns {*}
   */
  i: function (key) {

    var pos = key.indexOf(".")
      , type = key.substring(0, pos);

    key = key.substr(pos + 1);
    var item = _.find(this.catalog, function (cata) {
      return type == cata.type && key == cata.key;
    });

    if (item && item.lang[this.lang]) {
      return item.lang[this.lang];
    }

    return key;
  }

};
