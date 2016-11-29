/**
 * @file test mapping
 */

"use strict";

global.light        = require("../../../../LightCore");
global.light.rider  = light.model.rider;

var test = light.framework.test
  , ObjectID  = light.util.mongodb.ObjectID
  , should = test.should
  , mapping = require(__core + "/lib/mongo/mapping")
  ;


var define = {
    _id: {type: ObjectID}
  , name: {type: String, default: "zhangsan"}
  , age: {type: Number}
  , createAt: {type: "Date", default: new Date().toString()}
  , single: {type: "Boolean"}
  , address: {type: Object, default: "{\"province\": \"辽宁\", \"city\": \"大连\"}"}
  , friends: {type: Array, default: "[\"jobs\", \"bill\", \"ma\"]"}
  , hobby: {type: Array, contents: {
      _id: {type: "ObjectID", default: "000000000000000000000000"}
    , name: {type: "String"}
    , degree: {type: "Number", default: "3"}
    , last: {type: Date}
    , goodAt: {type: Boolean, default: "false"}
    , detail: {type: Object}
    , equipment: {type: Array}
    , playmate: {type: Array, contents: {
        name: {type: String}
      , age: {type: Number}
      , scores: {type: "Array", contents: "String", default: "[80, 90, 99]"}
      }}
    , require: {type: Object, contents: {
        age: {type: Number, default: "18"}
      , sex: {type: String, default: "male"}
      }, default: "{\"age\": \"20\", \"sex\": \"female\"}"}
    }}
  , weather: {type: Object, contents: {
      temperature: {type: Number}
    , description: {type: String, default: "very good!"}
    }, default: "{\"temperature\": 22}"}
  };

describe("/lib/mongo/mapping", function () {

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

    it("has no define", function(done) {
      var data = {name: "wangwu"};
      var result = mapping.default(data, undefined);
      result.should.have.property("name").eql("wangwu");
      done();
    });

    // 只包含第一层的数据
    it("use an object only contains first floor", function(done) {
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
    it("use an object contains second floor", function(done) {
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
          , playmate: [{}, {name: "jim"}, {name: "jack", age:22, scores: [100]}]
        }, {}]
      };
      var result = mapping.default(data, define);
      result.address.should.be.eql({lazy: true});
      result.friends.should.be.eql(["tom", "cat"]);
      result.hobby.should.be.eql([{
        _id: "000000000000000000000000"
        , degree: 1
        , last: date
        , goodAt: true
        , detail: {no: 1001}
        , playmate: [{scores: ["80", "90", "99"]}, {name: "jim", scores: ["80", "90", "99"]}, {name: "jack", age:22, scores: [100]}]
        , require: {age: 20, sex: "female"}
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
    it("use an array object contains second level", function(done) {
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
          , playmate: [{}, {name: "jim"}, {name: "jack", age:22, scores: [100]}]
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
        _id: "000000000000000000000000"
        , degree: 1
        , last: date
        , goodAt: true
        , detail: {no: 1001}
        , playmate: [{scores: ["80", "90", "99"]}, {name: "jim", scores: ["80", "90", "99"]}, {name: "jack", age:22, scores: [100]}]
        , require: {age: 20, sex: "female"}
      }, {
        _id: "000000000000000000000000"
        , degree: "3"
        , goodAt: "false"
        , require: {age: 20, sex: "female"}
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

    it("convert object", function(done) {
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
      result.address.should.eql([1,2,3]);
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
  });

});