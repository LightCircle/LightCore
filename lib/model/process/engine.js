/**
 * engine.js
 */

'use strict';

const Activity = require('./activity');

class Engine {

  /**
   * 构造函数
   * @param activities 流程步骤
   * @param data 表单数据
   */
  constructor(activities, data) {
    this.activities = activities.map(item => new Activity(item, this));
    this.data = data;
  }

  getStart() {
    return this.activities.find(item => item.type === 'start');
  }

  getNext(id) {

    const activity = this.findActivity(id);

    // 优先执行子步骤
    if (activity.hasChildren()) {
      const child = activity.child();

      // 如果找到满足条件的子步骤就返回，没有满足条件的子步骤时，继续执行后续的兄弟步骤
      if (child) {
        return child;
      }
    }

    // 执行兄弟步骤
    const next = activity.next();
    if (next) {
      return next;
    }

    // 没有设置下一步节点，那么回到上一层的节点继续
    return this.getParent(activity);
  }

  getParent(activity) {

    let prev = activity.prev();

    // 如果前序步骤是是兄弟步骤，那就继续找上一层，直到找到父步骤
    if (prev.isBrother(activity)) {
      return this.getParent(prev);
    }

    // 否则prev就是父步骤，回到父步骤继续
    return prev.next();
  }

  // 计算所有条件，找到满足条件的分支
  calculate(condition) {
    return condition.find(or => {
      return or.reduce((prev, and) => prev && this.compare(and), true);
    });
  }

  findActivity(id) {
    return this.activities.find(item => item.id === id);
  }

  compare(item) {

    const a = this.data[item.key], b = item.value;

    switch (item.operator) {
      case 'eq':
        return a === b;
      case 'gt':
        return a > b;
      case 'gte':
        return a >= b;
      case 'lt':
        return a < b;
      case 'lte':
        return a <= b;
      case 'include':
        return a.includes(b);
      case 'exclude':
        return !a.includes(b);
      case 'regex':
        return a.match(new RegExp(b));
    }

    return false;
  }

  // 判断 Activity 是否被通过
  static approve(performer, approve) {

    if (approve === 'AND') {
      return !performer.find(item => item.action !== 'approve');
    }

    if (approve === 'XOR') {
      return typeof performer.find(item => item.action === 'approve') !== 'undefined';
    }
  }

  // 判断 Activity 是否被拒绝
  static deny(performer, approve) {

    if (approve === 'AND') {
      return !performer.find(item => item.action !== 'deny');
    }

    if (approve === 'XOR') {
      return typeof performer.find(item => item.action === 'deny') !== 'undefined';
    }
  }

}

module.exports = Engine;