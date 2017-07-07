/**
 * @file test security
 */

'use strict';

const should  = require('should')
  , helper = require('../lib/helper')
  , security  = require('../lib/security')
;

describe('/lib/security', function () {

  /** *************************************** **/
  describe('exports.encrypt', function () {

    it('encrypt', function (done) {

      console.log(security.encrypt('1234567890123456', '1234567890123456'));
      console.log(security.decrypt('7a91d5ee4bbdc2f3bea9913118855b8f', 'light'));

      done();
    });

    it('encrypt2', function (done) {

      const pwd = helper.randomGUID12();
      console.log(security.encrypt2(pwd, 'light'));

      done();
    });
  });

  /** *************************************** **/
  describe('exports.decrypt', function () {

    it('decrypt2', function (done) {

      console.log(security.decrypt2('SPvPSa3cTKdfLgE7hKh0Pw==', 'light'));

      done();
    });
  });
});