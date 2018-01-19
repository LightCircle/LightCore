/**
 * @file test mapping
 */

'use strict';

const should = require('should')
  , mapping  = require('../lib/db/sqlserver/mapping')
;

describe('/lib/sqlserver/mapping', () => {

  before(() => {
  });

  /** *************************************** **/
  describe('build', () => {

    it('build', done => {

      const data = {
        a: 1,
        b: ['a', 'b', 'c'],
        c: {a: 1, b: 2},
        d: [{a: 1}, {b: 2}],
        e: [[1, 2], [3, 4], [5, 6]],
        f: {a: [1, 2], b: [3, 4]},
        g: [{a: [1, 2, 3]}, {b: [4, 5, 6]}],
        h: [{a: [1]}, {b: [2]}]
      };

      const result = new mapping().build(data);
      console.log(result);

      done();
    });

    it('parse', done => {

      const data = [[
        {
          type : 'INT',
          name : 'a',
          value: 1
        },
        {
          type : 'XML',
          name : 'b',
          value: '<root><element>a</element><element>b</element><element>c</element></root>'
        },
        {
          type : 'XML',
          name : 'c',
          value: '<root><a>1</a><b>2</b></root>'
        },
        {
          type : 'XML',
          name : 'd',
          value: '<root><element><a>1</a></element><element><b>2</b></element></root>'
        },
        {
          type : 'XML',
          name : 'e',
          value: '<root><element><element>1</element><element>2</element></element><element><element>3</element><element>4</element></element><element><element>5</element><element>6</element></element></root>',
        },
        {
          type : 'XML',
          name : 'f',
          value: '<root><a><element>1</element><element>2</element></a><b><element>3</element><element>4</element></b></root>'
        },
        {
          type : 'XML',
          name : 'g',
          value: '<root><element><a><element>1</element><element>2</element><element>3</element></a></element><element><b><element>4</element><element>5</element><element>6</element></b></element></root>'
        },
        {
          type : 'XML',
          name : 'h',
          value: '<root><element><a><element>1</element></a></element><element><b><element>2</element></b></element></root>'
        }
      ]];

      new mapping().parse(data, (err, result) => {

        result.forEach(row => {
          Object.keys(row).forEach(key => {
            console.log(key, row[key]);
          });
        });

        done();
      });
    });
  });

});
