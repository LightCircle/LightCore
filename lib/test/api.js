/**
 * @file api
 * @author r2space@gmail.com
 * @module light.core.test.api
 * @version 1.0.0
 */


// TODO

var request = require("request");

exports.verify = function(req, res, callback) {

  var req = req || {
    method: "GET",
    uri: "/api/login",
    params: {},
    headers: {},
    qs: {},
    body: {}
  };

  // TODO: check timeout, set multipart

  request(req, function(err, response, body) {


    // TODO: equal to res

    callback(err, {
      status: response.statusCode,
      body: body
    });
  });

};
