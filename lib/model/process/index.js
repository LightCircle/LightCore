/**
 * process
 */

'use strict';

const Activity = require('./activity')
  , Engine = require('./engine')
  , rider = require('../datarider');

class Process {

  constructor(hanadler, option) {

    this.handler = handler;

  }

  create() {

  }

  approve() {

  }

  deny() {

  }

  terminate() {

  }

  fetchWorkflow(id, callback) {
    rider.workflow.get(this.handler, {id: id}, (err, workflow) => {
      if (err) {
        return callback(err);
      }

      this.workflow = workflow;
      option.engine = new Engine(workflow.activities, option.formData);
      next(null, handler, option);
    });
  }

  fetchProcess() {

  }

  getRoute() {

  }

}

Process.Activity = Activity;
Process.Engine = Engine;

module.exports = Process;
