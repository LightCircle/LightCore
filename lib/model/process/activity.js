/**
 * activity.js
 */

'use strict';

class Activity {

  constructor(activity, engine) {

    this.id = activity.id;
    this.type = activity.type;
    this.transitions = activity.transitions;
    this.performerType = activity.performerType;
    this.performers = activity.performers;

    this.engine = engine;
    this.isDynamic = activity.type === 'dynamic';
    this.isEnd = activity.type === 'end';
  }

  // 下一个步骤（用condition为空来判断）
  next() {
    const transition = this.transitions.find(item => !item.condition);
    return this.engine.findActivity(transition.to);
  }

  // 上一个步骤
  prev() {
    return this.engine.activities.find(item => {
      return item.transitions.find(transition => transition.to === this.id);
    });
  }

  // 判断当前的步骤是给定步骤的前序步骤
  isBrother(to) {
    return this.next().id === to.id;
  }

  // 包含条件分支
  hasChildren() {
    return this.transitions.find(item => item.condition);
  }

  // 获取所有分支条件
  conditions() {
    return this.transitions.filter(item => item.condition);
  }

  // 获取分支步骤
  child() {

    // 遍历所有条件，确认条件是否满足
    const transition = this.conditions().find(item => this.engine.calculate(item.condition));
    if (transition) {
      return this.engine.findActivity(transition.to);
    }

    return null;
  }
}

module.exports = Activity;