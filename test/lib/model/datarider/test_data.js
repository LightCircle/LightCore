/**
 * @file test data
 * @author r2space@hotmail.com
 * @module /test/lib/datarider/data.js
 */

"use strict";

var test = light.framework.test
  , should = test.should
  , mock = test.mock
  , async = test.async
  , data = require(__model + "/lib/model/datarider/data")
  ;

describe("/lib/mongo/model", function () {

  var domain = "Test"
    , code = "lotus"
    , current = new Date()
    , _id = undefined;

  /** *************************************** **/
  describe("exports.join", function () {

    var handler = mock.handler();
    handler.domain = domain;
    handler.code = code;

    it("join user collection - single", function (done) {

      var value = {column1: mock.dummyUID, column2: 1, column3: current};
      data.join(handler, value, "column1", "user", null, ["id", "name"], function (err) {
        should.not.exist(err);
        value.options.user.should.have.property(mock.dummyUID);
        done();
      });
    });

    it("join user collection - array", function (done) {

      var value = [
        {column1: mock.dummyUID, column2: 1, column3: current},
        {column1: mock.dummyUID, column2: 2, column3: current}
      ];
      data.join(handler, value, "column1", "user", "_id", ["id", "name"], function (err) {
        should.not.exist(err);
        value.options.user.should.have.property(mock.dummyUID);
        done();
      });
    });

    it("not find user data", function (done) {

      var value = {column1: "none", column2: 1, column3: current};
      data.join(handler, value, "column1", "user", "_id", ["id", "name"], function (err) {
        should.not.exist(err);
        should.not.exist(value.options.user);
        done();
      });
    });

    it("not content column", function (done) {

      var value = {column2: 1, column3: current};
      data.join(handler, value, "column1", "user", "_id", ["id", "name"], function (err) {
        should.not.exist(err);
        should.not.exist(value.options.user);
        done();
      });
    });

    it("no link kye", function (done) {

      var value = {column1: "none", column2: 1, column3: current};
      data.join(handler, value, "column1", "user", null, ["id", "name"], function (err) {
        should.not.exist(err);
        should.not.exist(value.options.user);
        done();
      });
    });

    it("select is empty", function (done) {

      var value = {column1: "none", column2: 1, column3: current};
      data.join(handler, value, "column1", "user", null, null, function (err) {
        should.not.exist(err);
        should.not.exist(value.options);
        done();
      });
    });
  });


  /** *************************************** **/
  describe("exports.reject", function () {

    it("reject column", function () {

      var board = {
          selects: [
            {key: "column1", format: "formated: %s", alias: "column4", select: true},
            {key: "column2", format: "", alias: "", select: false},
            {key: "column3", format: "YYYY/MM/DD", select: true}
          ]
        }
        , value = {column1: "string", column2: 10, column3: current};

      var result = data.reject(value, board);
      result.column4.should.be.equal("formated: string");
      should.not.exist(result.column2);
      result.column3.should.be.a.Date;
      result.column3.should.be.a.String;
    });

    it("reject sub object column", function () {

      var board = {
          selects: [
            {key: "column1.sub1", format: "formated: %s", alias: "column5", select: true},
            {key: "column2", format: "", alias: "", select: false},
            {key: "column3.sub1", select: true},
            {key: "column4.sub1", select: true}
          ]
        }
        , value = {
          column1: {sub1: "string", sub2: "string2"},
          column2: 10,
          column3: {sub1: current},
          column4: ""
        };

      var result = data.reject(value, board);
      should.not.exist(result.column2);
      should.not.exist(result.column3.sub2);
      result.column3.sub1.should.be.a.Date;
      result.column5.should.be.equal("formated: string");
    });

    it("reject sub object column", function () {

      var board = {
          selects: [
            {key: "column1.sub1", format: "formated: %s", alias: "column5", select: true},
            {key: "column2", select: false},
            {key: "column3.sub1", select: true},
            {key: "column4.sub1", select: true}
          ]
        }
        , value = {
          column1: [{sub1: "string", sub2: "string2"}, {sub1: "string", sub2: "string2"}, {sub3: "string3"}],
          column2: 10,
          column3: [{sub1: current, sub2: current}],
          column4: ""
        };

      var result = data.reject(value, board);
      should.not.exist(result.column2);
      should.not.exist(result.column3.sub2);
      result.column3[0].sub1.should.be.a.Date;
      result.column1.should.have.length(3);
      result.column1[0].column5.should.be.equal("formated: string");
      should.not.exist(result.column1[0].column5.sub2);
    });

    it("empty data", function () {

      var result = data.reject(undefined, {});
      result.should.be.empty;
    });
  });


  /** *************************************** **/
  describe("exports.order", function () {

    it("fix or dynamic sort", function () {

      var handler = mock.handler({sort: {c: "c", d: "d", e: "e"}});
      var result = data.order(handler,
        {
          sorts: [
            {index: 1, key: "a", dynamic: "fix", order: "asc"},
            {index: 2, key: "b", dynamic: "fix", order: "desc"},
            {index: 3, key: "c", dynamic: "dynamic", order: "asc"},
            {index: 4, key: "d", dynamic: "dynamic", order: "desc"},
            {index: 0, key: "e", dynamic: "dynamic", order: "desc"}
          ]
        });

      result.should.have.length(5);
      result[0][0].should.be.equal("e");
      result[0][1].should.be.equal(-1);
      result[1][1].should.be.equal(1);
    });

    it("use order", function () {

      var handler = mock.handler({order: {a: "a"}});
      var result = data.order(handler, {
        sorts: [
          {index: 1, key: "a", dynamic: "dynamic", order: "asc"}
        ]
      });

      result.should.have.length(1);
    });

  });


  /** *************************************** **/
  describe("exports.filter", function () {

    it("free filter", function () {
      var handler = mock.handler({free: {a1: 1, b1: {b11: 2}}});
      var result = data.filter(handler, {});
      result.should.have.property("a1");
    });

    it("use default, reserved", function () {

      var handler = mock.handler({
          condition: {uid: mock.dummyUID}
        })
        , board = {
          filters: [{
            key: "default",
            operator: "$eq",
            parameter: "",
            default: "10",
            group: "1"
          }, {
            key: "reserved",
            operator: "$eq",
            parameter: "",
            default: "$uid",
            group: "1"
          }, {
            key: "nodata",
            operator: "$eq",
            parameter: "nodata",
            default: "10",
            group: "1"
          }, {
            key: "parameter",
            operator: "$eq",
            parameter: "uid",
            default: "",
            group: "1"
          }]
        };
      var result = data.filter(handler, board);
      result.default.$eq.should.be.equal("10");
      result.reserved.$eq.should.be.equal(mock.dummyUID);
      result.parameter.$eq.should.be.equal(mock.dummyUID);
      result.nodata.$eq.should.be.equal("10");
    });

    it("compare parameter", function () {

      var handler = mock.handler({
          condition: {
            uid: mock.dummyUID,
            in: [1, 1, 1],
            nin: [2, 2, 2],
            regex: /^.*/,
            exists: true
          }
        })
        , board = {
          filters: [{
            key: "ne",
            operator: "$ne",
            parameter: "uid",
            default: "",
            group: "1"
          }, {
            key: "gt",
            operator: "$gt",
            parameter: "uid",
            default: "",
            group: "1"
          }, {
            key: "gte",
            operator: "$gte",
            parameter: "uid",
            default: "",
            group: "1"
          }, {
            key: "lt",
            operator: "$lt",
            parameter: "uid",
            default: "",
            group: "1"
          }, {
            key: "lte",
            operator: "$lte",
            parameter: "uid",
            default: "",
            group: "1"
          }, {
            key: "in",
            operator: "$in",
            parameter: "in",
            default: "",
            group: "1"
          }, {
            key: "nin",
            operator: "$nin",
            parameter: "nin",
            default: "",
            group: "1"
          }, {
            key: "regex",
            operator: "$regex",
            parameter: "regex",
            default: "",
            group: "1"
          }, {
            key: "exists",
            operator: "$exists",
            parameter: "exists",
            default: "",
            group: "1"
          }]
        };
      var result = data.filter(handler, board);
      result.ne.should.have.property("$ne");
      result.gt.should.have.property("$gt");
      result.gte.should.have.property("$gte");
      result.lt.should.have.property("$lt");
      result.lte.should.have.property("$lte");
      result.in.should.have.property("$in");
      result.nin.should.have.property("$nin");
      result.regex.should.have.property("$regex");
      result.exists.should.have.property("$exists");
    });

    it("multi parameter", function () {

      var handler = mock.handler({
          condition: {gt: 1, lt: 10}
        })
        , board = {
          filters: [{
            key: "same",
            operator: "$gt",
            parameter: "gt",
            default: "",
            group: "1"
          }, {
            key: "same",
            operator: "$lt",
            parameter: "lt",
            default: "",
            group: "1"
          }]
        };
      var result = data.filter(handler, board);
      result.same.$gt.should.be.equal(1);
      result.same.$lt.should.be.equal(10);
    });

    it("empty parameter value", function () {

      var handler = mock.handler({
          filter: {}
        })
        , board = {
          filters: [{
            key: "same",
            operator: "$gt",
            parameter: "gt",
            default: "",
            group: "1"
          }]
        };
      var result = data.filter(handler, board);
      result.should.be.empty;
    });

    it("empty board filters value", function () {

      var handler = mock.handler({filter: {}})
        , board = {filters: []};
      var result = data.filter(handler, board);
      result.should.be.empty;
    });

    it("or condition", function () {

      var handler = mock.handler({
          filter: {uid: mock.dummyUID}
        })
        , board = {
          filters: [{
            key: "same",
            operator: "$eq",
            parameter: "uid",
            default: "",
            group: "1"
          }, {
            key: "same",
            operator: "$eq",
            parameter: "uid",
            default: "",
            group: "2"
          }]
        };
      var result = data.filter(handler, board);
      result.$or.should.have.length(2);
    });
  });


  /** *************************************** **/
  describe("exports.add", function () {

    var __api = {
      schema: "test",
      api: "/api/test/add",
      selects: [
        {key: "_id", select: true},
        {key: "valid", select: false},
        {key: "createAt", select: false},
        {key: "createBy", select: false},
        {key: "updateAt", select: true},
        {key: "updateBy", select: true, format: "", alias: "", option: "user", fields: ["id", "name"]},
        {key: "column1", select: true},
        {key: "column2", select: false},
        {key: "column3", select: false},
        {key: "column4", select: false},
        {key: "column5", select: false},
        {key: "column6.sub1", select: false},
        {key: "column6.sub2", select: false},
        {key: "column7.sub1", select: false},
        {key: "column7.sub2", select: false}
      ]
    };

    it("add empty object", function (done) {

      var handler = mock.handler({__api: __api});
      handler.domain = domain;
      handler.code = code;

      data.add(handler, function (err, result) {
        should.not.exist(err);
        should.not.exist(result.createAt);
        should.not.exist(result.createBy);
        result.options.should.have.property("user");

        done();
      });
    });

    it("add an object", function (done) {

      var handler = mock.handler({__api: __api});
      handler.domain = domain;
      handler.code = code;
      handler.addParams("data", {
        column1: "string",
        column2: "10",
        column3: "2015/01/01",
        column4: "true",
        column5: "000000000000000000000000",
        column6: [{sub1: "string", sub2: "20"}, {sub1: "string", sub2: "30"}],
        column7: {sub1: [1, 2, 3], sub2: {child1: "string"}}
      });

      data.add(handler, function (err, result) {
        should.not.exist(err);
        should.not.exist(result.createAt);
        should.not.exist(result.createBy);
        result.options.should.have.property("user");

        _id = result._id; // 后续测试用
        done();
      });
    });
  });


  /** *************************************** **/
  describe("exports.list", function () {

    var __api = {
      schema: "test",
      api: "/api/test/list",
      selects: [
        {key: "_id", select: true},
        {key: "valid", select: false},
        {key: "createAt", select: false},
        {key: "createBy", select: false},
        {key: "updateAt", select: true},
        {key: "updateBy", select: true, format: "", alias: "", option: "user", fields: ["id", "name"]},
        {key: "column1", select: true},
        {key: "column2", select: false},
        {key: "column3", select: false},
        {key: "column4", select: false},
        {key: "column5", select: false},
        {key: "column6.sub1", select: false},
        {key: "column6.sub2", select: false},
        {key: "column7.sub1", select: false},
        {key: "column7.sub2", select: false}
      ],
      filters: [{
        default: "",
        key: "column1",
        operator: "$eq",
        parameter: "column1",
        group: "0000"
      }, {
        default: "",
        key: "column2",
        operator: "$eq",
        parameter: "column2",
        group: "21c1"
      }],
      sorts: [{
        dynamic: "fix",
        key: "updateAt",
        order: "desc",
        index: 0
      }]
    };

    var handler = mock.handler({__api: __api});
    handler.domain = domain;
    handler.code = code;

    it("get user list, no filter", function (done) {

      data.list(handler, function (err, result) {

        should.not.exist(err);
        result.totalItems.should.be.above(0);
        result.items.should.be.exist;

        done();
      });
    });

    it("get user list by condition", function (done) {

      handler.addParams("condition", {column1: "string"});
      data.list(handler, function (err, result) {

        should.not.exist(err);
        result.totalItems.should.be.above(0);
        result.items.should.be.exist;

        done();
      });
    });

  });


  /** *************************************** **/
  describe("exports.get", function () {

    var __api = {
      schema: "test",
      api: "/api/test/get",
      selects: [
        {key: "_id", select: true},
        {key: "valid", select: false},
        {key: "createAt", select: false},
        {key: "createBy", select: false},
        {key: "updateAt", select: true},
        {key: "updateBy", select: true, format: "", alias: "", option: "user", fields: ["id", "name"]},
        {key: "column1", select: true},
        {key: "column2", select: false}
      ],
      filters: [{
        default: "",
        key: "column1",
        operator: "$eq",
        parameter: "column1",
        group: "0000"
      }]
    };

    var handler = mock.handler({__api: __api});
    handler.domain = domain;
    handler.code = code;

    it("get user by id", function (done) {

      handler.params.id = _id;
      data.get(handler, function (err, result) {
        should.not.exist(err);
        result._id.should.be.exist;

        done();
      });
    });

    it("get user by condition", function (done) {

      handler.params.condition = {column1: "string"};
      data.get(handler, function (err, result) {
        should.not.exist(err);
        result._id.should.be.exist;

        done();
      });
    });

  });


  /** *************************************** **/
  describe("exports.count", function () {

    var __api = {
      schema: "test"
    };

    var handler = mock.handler({__api: __api});
    handler.domain = domain;
    handler.code = code;

    it("get data count", function (done) {

      data.count(handler, function (err, result) {
        should.not.exist(err);
        result.should.be.a.Number;

        done();
      });
    });

  });


  /** *************************************** **/
  describe("exports.update", function () {

    var __api = {
      schema: "test",
      api: "/api/test/update",
      selects: [
        {key: "_id", select: true},
        {key: "valid", select: false},
        {key: "createAt", select: false},
        {key: "createBy", select: false},
        {key: "updateAt", select: true},
        {key: "updateBy", select: true, format: "", alias: "", option: "user", fields: ["id", "name"]},
        {key: "column1", select: true},
        {key: "column2", select: false}
      ]
    };

    it("update by id", function (done) {

      var handler = mock.handler({__api: __api});
      handler.domain = domain;
      handler.code = code;
      handler.params.id = _id;
      handler.params.data = {column1: "update value"};
      data.update(handler, function (err, result) {
        should.not.exist(err);
        should.not.exist(result.createAt);
        should.exist(result.updateAt);
        result.options.should.have.property("user");

        done();
      });
    });

    it("update by condition", function (done) {

      var handler = mock.handler({__api: __api});
      handler.domain = domain;
      handler.code = code;
      handler.params.condition = {column2: "0"};
      handler.params.data = {column3: "2015/01/01"};
      data.update(handler, function (err, result) {
        should.not.exist(err);
        result.should.be.above(0);

        done();
      });
    });
  });


  /** *************************************** **/
  describe("exports.upsert", function () {

    var __api = {
      schema: "test",
      api: "/api/test/upsert",
      selects: [
        {key: "_id", select: true},
        {key: "valid", select: false},
        {key: "createAt", select: false},
        {key: "createBy", select: false},
        {key: "updateAt", select: true},
        {key: "updateBy", select: true},
        {key: "column1", select: true},
        {key: "column2", select: false}
      ]
    };

    it("update by condition", function (done) {

      var handler = mock.handler({__api: __api});
      handler.domain = domain;
      handler.code = code;
      handler.params.condition = {column1: "NoData"};
      handler.params.data = {column1: "upsert value"};
      data.upsert(handler, function (err, result) {
        should.not.exist(err);
        done();
      });
    });
  });


  /** *************************************** **/
  describe("exports.remove", function () {

    var __api = {
      schema: "test"
    };

    var handler = mock.handler({__api: __api});
    handler.domain = domain;
    handler.code = code;

    it("remove by condition", function (done) {

      handler.params.condition = {column1: "string"};
      data.remove(handler, function (err, result) {
        should.not.exist(err);
        result.should.be.above(0);

        done();
      });
    });

    it("remove by id", function (done) {

      handler.params.id = _id;
      data.remove(handler, function (err, result) {
        should.not.exist(err);
        result.should.be.above(0);

        done();
      });
    });
  });


});