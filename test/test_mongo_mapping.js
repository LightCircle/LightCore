/**
 * @file test mapping
 */

"use strict";

let should    = require("should")
  , moment    = require("moment")
  , _         = require("underscore")
  , ObjectID  = require("mongodb").ObjectID
  , mapping   = require("../lib/mongo/mapping")
  ;


let define = {
  _id: {type: ObjectID},
  name: {type: String, default: "zhangsan"},
  age: {type: Number},
  createAt: {type: "Date", default: new Date().toString()},
  single: {type: "Boolean"},
  address: {type: Object, default: "{\"province\": \"辽宁\", \"city\": \"大连\"}"},
  friends: {type: Array, default: "[\"jobs\", \"bill\", \"ma\"]"},
  hobby: {
    type: Array,
    contents: {
      _id: {type: "ObjectID", default: "000000000000000000000000"},
      name: {type: "String"},
      degree: {type: "Number", default: "3"},
      last: {type: Date},
      goodAt: {type: Boolean, default: "false"},
      detail: {type: Object},
      equipment: {type: Array},
      playmate: {
        type: Array,
        contents: {
          name: {type: String},
          age: {type: Number},
          scores: {type: "Array", contents: "String", default: "[80, 90, 99]"}
        }
      },
      require: {
        type: Object,
        contents: {
          age: {type: Number, default: "18"},
          sex: {type: String, default: "male"}
        },
        default: "{\"age\": \"20\", \"sex\": \"female\"}"
      }
    }
  },
  weather: {
    type: Object,
    contents: {
      temperature: {type: Number},
      description: {type: String, default: "very good!"}
    },
    default: "{\"temperature\": 22}"
  }
};

describe("/lib/mongo/mapping", function () {

  before(function() {
    _.str = require("underscore.string")
  });

  /** *************************************** **/
  describe("exports.default", function () {

    it("use an empty object", function (done) {
      var data = {};
      var result = mapping.default(data, define);
      result.name.should.be.exactly("zhangsan");
      result.should.have.property("createAt");
      result.address.should.be.eql({province: "辽宁", city: "大连"});
      result.should.have.property("friends").with.lengthOf(3);
      result.weather.should.be.eql({temperature: 22, description: "very good!"});
      done();
    });

    it("has no define", function (done) {
      var data = {name: "wangwu"};
      var result = mapping.default(data, undefined);
      result.should.have.property("name").eql("wangwu");
      done();
    });

    // 只包含第一层的数据
    it("use an object only contains first floor", function (done) {
      var data = {
        _id: "000000000000000000000000"
        , name: "lisi"
        , age: 16
        , createAt: new Date().toString()
        , single: false
        , address: {
          lazy: true
        }
        , friends: ["tom", "cat"]
      };
      var result = mapping.default(data, define);
      result.name.should.be.exactly("lisi");
      result.should.have.property("friends").with.lengthOf(2);
      result.weather.should.be.eql({temperature: 22, description: "very good!"});
      result.should.not.have.property("hobby");
      done();
    });

    // 包含第二层
    it("use an object contains second floor", function (done) {
      var date = new Date();
      var data = {
        _id: "000000000000000000000000"
        , name: "lisi"
        , age: 16
        , createAt: date
        , single: false
        , address: {
          lazy: true
        }
        , friends: ["tom", "cat"]
        , hobby: [{
          degree: 1
          , last: date
          , goodAt: true
          , detail: {no: 1001}
          , playmate: [{}, {name: "jim"}, {name: "jack", age: 22, scores: [100]}]
        }, {}]
      };
      var result = mapping.default(data, define);
      result.address.should.be.eql({lazy: true});
      result.friends.should.be.eql(["tom", "cat"]);
      result.hobby.should.be.eql([{
        _id: "000000000000000000000000",
        degree: 1,
        last: date,
        goodAt: true,
        detail: {no: 1001},
        playmate: [{scores: ["80", "90", "99"]}, {name: "jim", scores: ["80", "90", "99"]}, {
          name: "jack",
          age: 22,
          scores: [100]
        }],
        require: {age: 20, sex: "female"}
      }, {
        _id: "000000000000000000000000"
        , degree: "3"
        , goodAt: "false"
        , require: {age: 20, sex: "female"}
      }]);
      result.weather.should.be.eql({temperature: 22, description: "very good!"});
      done();
    });

    // 整体是个数组，元素中包含了第一二层数据
    it("use an array object contains second level", function (done) {
      var date = new Date();
      var data = [{
        _id: "000000000000000000000000"
        , name: "lisi"
        , age: 16
        , createAt: new Date().toString()
        , single: false
        , address: {
          lazy: true
        }
        , friends: ["tom", "cat"]
        , hobby: []
      }, {
        _id: "000000000000000000000000"
        , name: "lisi"
        , age: 16
        , createAt: date
        , single: false
        , address: {
          lazy: true
        }
        , friends: ["tom", "cat"]
        , hobby: [{
          degree: 1
          , last: date
          , goodAt: true
          , detail: {no: 1001}
          , playmate: [{}, {name: "jim"}, {name: "jack", age: 22, scores: [100]}]
        }, {}]
      }];
      var result = mapping.default(data, define);
      result.should.have.length(2);
      result[0].name.should.be.exactly("lisi");
      result[0].should.have.property("friends").with.lengthOf(2);
      result[0].weather.should.be.eql({temperature: 22, description: "very good!"});
      result[0].hobby.should.have.length(0);
      result[1].address.should.be.eql({lazy: true});
      result[1].friends.should.be.eql(["tom", "cat"]);
      result[1].hobby.should.be.eql([{
        _id: "000000000000000000000000",
        degree: 1,
        last: date,
        goodAt: true,
        detail: {no: 1001},
        playmate: [{scores: ["80", "90", "99"]}, {name: "jim", scores: ["80", "90", "99"]}, {
          name: "jack",
          age: 22,
          scores: [100]
        }],
        require: {age: 20, sex: "female"}
      }, {
        _id: "000000000000000000000000",
        degree: "3",
        goodAt: "false",
        require: {age: 20, sex: "female"}
      }]);
      result[1].weather.should.be.eql({temperature: 22, description: "very good!"});
      done();
    });
  });

  /** *************************************** **/
  describe("exports.dataParseAll", function () {

    it("parse an empty object", function (done) {
      var data = {};
      var result = mapping.dataParseAll(data, define);
      result.should.be.empty;
      done();
    });

    it("has no define", function (done) {
      var data = {
        name: 111
      };
      var result = mapping.dataParseAll(data, undefined);
      result.should.have.property("name").eql(111);
      done();
    });

    it("convert object", function (done) {
      var date = new Date();
      var data = {
        name: 111
        , age: "age"
        , _id: "000000"
        , createAt: false
        , single: /regex/i
        , address: [1, 2, 3]
        , friends: "tomcat"
        , hobby: [{
          _id: date
          , name: /regex/g
          , degree: true
          , last: "invalid date"
          , goodAt: {nothing: false}
          , detail: "123456781234567812345678"
          , equipment: false
          , playmate: [{}, {
            name: [23]
            , age: /regex/
            , scores: date
          }]
          , require: {
            age: false
            , sex: date
          }
        }]
        , weather: [{
          temperature: {name: "1"}
          , description: {type1: String}
        }]
      };
      var result = mapping.dataParseAll(data, define);
      result.name.should.eql("111");
      should(result.age).be.exactly(null);
      should(result._id).be.exactly(null);
      result.createAt.should.not.eql(false);
      should(result.single).be.exactly(null);
      result.address.should.eql([1, 2, 3]);
      result.friends.should.eql(["tomcat"]);
      result.hobby.should.eql([{
        "_id": null,
        "name": "/regex/g",
        "degree": null,
        "last": null,
        "goodAt": null,
        "detail": "123456781234567812345678",
        "equipment": [false],
        "playmate": [
          {},
          {
            "name": ["23"],
            "age": null,
            "scores": [date.toString()]
          }
        ],
        "require": {
          "age": null,
          "sex": date.toString()
        }
      }]);
      result.weather.should.eql([{
        "temperature": null,
        "description": "[object Object]"
      }]);

      done();
    });

    it("parse date type", function (done) {

      // test +8 Asia/Shanghai timezone
      let data = [
        {'hobby.last': '2016/01/01'},
        {'hobby.last': '2016-01-01'},
        {'hobby.last': '20160101'},
        {'hobby.last': '2016/01/01'},
        {'hobby.last': '2016-01-01T00:00:00.000+08:00'}
      ];

      let zoneDate = moment('2016-01-01T00:00:00.000+08:00').toDate();
      mapping.dataParseAll(data, define, {tz: 'Asia/Shanghai'});
      data.should.eql([
        {'hobby.last': zoneDate},
        {'hobby.last': zoneDate},
        {'hobby.last': zoneDate},
        {'hobby.last': zoneDate},
        {'hobby.last': zoneDate}
      ]);

      // test utc timezone
      data = [
        {'hobby.last': '2016/01/01'},
        {'hobby.last': '2016-01-01'},
        {'hobby.last': '20160101'},
        {'hobby.last': '2016/01/01'},
        {'hobby.last': '2016-01-01T00:00:00.000Z'}
      ];

      let utcDate = moment('2016-01-01T00:00:00.000Z').toDate();
      data = mapping.dataParseAll(data, define, {tz: 'UTC'});
      data.should.eql([
        {'hobby.last': utcDate},
        {'hobby.last': utcDate},
        {'hobby.last': utcDate},
        {'hobby.last': utcDate},
        {'hobby.last': utcDate}
      ]);

      // test no timezone
      data = [
        {'hobby.last': '2016/01/01'},
        {'hobby.last': '2016-01-01'},
        {'hobby.last': '20160101'},
        {'hobby.last': '2016/01/01'},
        {'hobby.last': '2016-01-01T00:00:00.000Z'}
      ];

      data = mapping.dataParseAll(data, define);
      data.should.eql([
        {'hobby.last': utcDate},
        {'hobby.last': utcDate},
        {'hobby.last': utcDate},
        {'hobby.last': utcDate},
        {'hobby.last': utcDate}
      ]);

      // test empty date & Date type date
      data = [
        {'hobby.last': null},
        {'hobby.last': utcDate}
      ];

      data = mapping.dataParseAll(data, define, {tz: 'UTC'});
      data.should.eql([
        {'hobby.last': null},
        {'hobby.last': utcDate}
      ]);

      done();
    });
  });

  describe("exports.queryParseAll", function () {

    it("convert an empty object", function (done) {
      var data = {};
      var result = mapping.queryParseAll(data, define);
      result.should.be.empty;
      done();
    });

    it("has no define", function (done) {
      var data = {
        name: 111
      };
      var result = mapping.queryParseAll(data, undefined);
      result.should.have.property("name").eql(111);
      done();
    });

    it("parse array", function (done) {
      let data = {
        'name': {$in: [1, 2]},
        'hobby.degree': {$in: ['3', '4']},

      };
      let result = mapping.queryParseAll(data, define);
      result.should.eql({'hobby.degree': {$in: [3, 4]}, 'name': {'$in': ['1', '2']}});
      done();
    });

    it("parse boolean type", function (done) {
      let data = {
        $or: [
          {'single': 'true'},
          {'single': true},
          {'single': 1}
        ]
      };
      let result = mapping.queryParseAll(data, define);
      result.should.eql({$or: [{'single': true}, {'single': true}, {'single': true}]});
      done();
    });

    it("parse date type", function (done) {

      // test +8 Asia/Shanghai timezone
      let data = {
        $or: [
          {'hobby.last': '2016/01/01'},
          {'hobby.last': '2016-01-01'},
          {'hobby.last': '20160101'},
          {'hobby.last': '2016/01/01'},
          {'hobby.last': '2015-12-31T16:00:00.000Z'},
          {'hobby.last': '2016-01-01T00:00:00.000+08:00'},
          {'hobby.last': '2016-01-01T01:00:00.000+09:00'}
        ]
      };

      let zoneDate = moment('2016-01-01T00:00:00.000+08:00').toDate();
      mapping.queryParseAll(data, define, {tz: 'Asia/Shanghai'});
      data.should.eql({
        '$or': [
          {'hobby.last': zoneDate},
          {'hobby.last': zoneDate},
          {'hobby.last': zoneDate},
          {'hobby.last': zoneDate},
          {'hobby.last': zoneDate},
          {'hobby.last': zoneDate},
          {'hobby.last': zoneDate}
        ]
      });

      // test utc timezone
      data = {
        $or: [
          {'hobby.last': '2016/01/01'},
          {'hobby.last': '2016-01-01'},
          {'hobby.last': '20160101'},
          {'hobby.last': '2016/01/01'},
          {'hobby.last': '2016-01-01T00:00:00.000Z'}
        ]
      };

      let utcDate = moment('2016-01-01T00:00:00.000Z').toDate();
      data = mapping.queryParseAll(data, define, {tz: 'UTC'});
      data.should.eql({
        '$or': [
          {'hobby.last': utcDate},
          {'hobby.last': utcDate},
          {'hobby.last': utcDate},
          {'hobby.last': utcDate},
          {'hobby.last': utcDate}
        ]
      });

      // test no timezone
      data = {
        $or: [
          {'hobby.last': '2016/01/01'},
          {'hobby.last': '2016-01-01'},
          {'hobby.last': '20160101'},
          {'hobby.last': '2016/01/01'},
          {'hobby.last': '2016-01-01T00:00:00.000Z'}
        ]
      };

      data = mapping.queryParseAll(data, define);
      data.should.eql({
        '$or': [
          {'hobby.last': utcDate},
          {'hobby.last': utcDate},
          {'hobby.last': utcDate},
          {'hobby.last': utcDate},
          {'hobby.last': utcDate}
        ]
      });

      // test empty date & Date type date
      data = {
        $or: [
          {'hobby.last': null},
          {'hobby.last': utcDate}
        ]
      };

      data = mapping.queryParseAll(data, define, {tz: 'UTC'});
      data.should.eql({
        '$or': [
          {'hobby.last': null},
          {'hobby.last': utcDate}
        ]
      });

      done();
    });

    it("parse operator", function (done) {
      let data = {
        $and: [
          {'age': {'$eq': '10'}},
          {'age': {'$gt': '10'}},
          {'age': {'$gte': '10'}},
          {'age': {'$lt': '10'}},
          {'age': {'$lte': '10'}},
          {'age': {'$ne': '10'}},
          {'friends': {'$in': [1, 'bill']}}
        ]
      };
      let result = mapping.queryParseAll(data, define);
      result.should.eql({
        $and: [
          {age: {'$eq': 10}},
          {age: {'$gt': 10}},
          {age: {'$gte': 10}},
          {age: {'$lt': 10}},
          {age: {'$lte': 10}},
          {age: {'$ne': 10}},
          {friends: {$in: [1, 'bill']}}
        ]
      });
      done();
    });
  });

});