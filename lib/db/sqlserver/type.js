/**
 * @file XPathString.js
 */

'use strict';

class XPathString {
  constructor(value) {
    this.value = value;
  }
}

class XPathBoolean {
  constructor(value) {
    this.value = value ? 'true' : 'false';
  }
}

module.exports = {
  XPathString : XPathString,
  XPathBoolean: XPathBoolean
};
