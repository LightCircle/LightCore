/**
 * @file test operator
 */

'use strict';

const should = require('should')
  , operator = require('../lib/db/sqlserver/operator')
;

describe('/lib/sqlserver/operator', () => {

  before(() => {
  });

  /** *************************************** **/
  describe('parseFree', () => {

    it('basic type', done => {

      const out = {condition: {}}, free = {a: 1, b: 0};
      const result = operator.parseFree(free, 'test', out);
      console.log(result, out);

      done();
    });

    it('compare operator', done => {

      const out  = {condition: {}},
            free = {a: {$gt: 1}, b: {$regex: '^2$'}, c: 3};

      const result = operator.parseFree(free, 'test', out);
      console.log(result, out);

      done();
    });

    it('or', done => {

      const out  = {condition: {}},
            free = {
              $or: [{a: 1, b: 2}, {c: 3}], d: 4
            };

      const result = operator.parseFree(free, 'test', out);
      console.log(result, out);

      done();
    });

    it('mix', done => {

      const out  = {condition: {}},
            free = {
              $or: [{a: 1, b: {$in: [2, 3]}}, {$or: [{c: 3, d: {$gt: 4}}, {e: 5}]}], f: 6
            };

      const result = operator.parseFree(free, 'test', out);
      console.log(result, out);

      done();
    });

    it('vacation', done => {

      const out  = {condition: {}},
            free = {
              valid: 1,
              $or  : [
                {start: {$gte: '2008-01-01', $lte: '2008-01-31'}},
                {end: {$gte: '2008-02-01', $lte: '2008-02-31'}}
              ],
              uid  : {$in: [1, 2, 3]}
            };

      const result = operator.parseFree(free, 'test', out);
      console.log(result, out);

      done();
    });

    it('empty list', done => {

      const out  = {condition: {}},
            free = {
              valid: 1,
              $or  : [{level: 'system'}, {_id: {$in: []}}]
            };

      const result = operator.parseFree(free, 'test', out);
      console.log(result, out);

      done();
    });

  });

});
