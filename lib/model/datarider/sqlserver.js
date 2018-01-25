/**
 *
 * 1. 组装SQL模板，在model里正式将sql和params合并成可执行的SQL语句
 * 2. 内嵌的对象，检索时获取内嵌对象的所有内容
 * 3. 条件里有内嵌的对象，需要将项目转换成 如 [column].value('(/root/a)[1]', 'varchar(10)')
 */

'use strict';

const _      = require('lodash')
  , async    = require('async')
  , mpath    = require('../../mpath')
  , CONST    = require('../../constant')
  , ctrl     = require('../../db/sqlserver/controller')
  , operator = require('../../db/sqlserver/operator')
  , cache    = require('../../cache')
;

exports.add = (handler, callback) => {
  handler.params.script = buildScript(handler.api, handler.params);
  new ctrl(handler).add(callback);
};

exports.list = (handler, callback) => {
  handler.params.script = buildScript(handler.api, handler.params);
  new ctrl(handler).list((err, data) => {
    if (err) {
      return callback(err);
    }

    fetchOptions(handler, data, handler.api, callback);
  });
};

exports.get = (handler, callback) => {
  handler.params.script = buildScript(handler.api, handler.params);
  new ctrl(handler).get((err, data) => {
    if (err) {
      return callback(err);
    }

    fetchOptions(handler, data, handler.api, callback);
  });
};

exports.count = (handler, callback) => {
  handler.params.script = buildScript(handler.api, handler.params);
  new ctrl(handler).count(callback);
};

exports.remove = (handler, callback) => {
  handler.params.script = buildScript(handler.api, handler.params);
  new ctrl(handler).remove(callback);
};

exports.update = (handler, callback) => {
  handler.params.script = buildScript(handler.api, handler.params);
  new ctrl(handler).update(callback);
};

function buildScript(board, params) {
  if (board.script) {
    return board.script;
  }

  params.condition = params.condition || {};
  params.data = params.data || {};

  const method = CONST.METHOD_NAME[board.type];

  // 如果指定了id参数，就将id参数转存到condition中
  if (['GET', 'UPDATE', 'REMOVE'].includes(method) && params.id) {
    params.condition._id = params.id;
  }

  // WHERE
  const filter = _filter(board, params)
    , selects  = _select(board, params)
    , sorts    = _sort(board, params);

  // 如果是继承的表，那么在条件里设定type
  const struct = _structure(board.schema);
  if (struct.parent) {
    params.condition.type = board.schema;
    params.data.type = board.schema;
  }

  // 生成SQL - SELECT
  if (method === 'GET') {
    return selectStatement(params, board.schema, selects, filter, null, method);
  }

  // 生成SQL - SELECT
  if (method === 'LIST') {
    return selectStatement(params, board.schema, selects, filter, sorts, method);
  }

  // 生成SQL - COUNT
  if (method === 'COUNT') {
    return selectStatement(params, board.schema, null, filter, null, method);
  }

  // 生成SQL - INSERT
  if (method === 'ADD') {
    return insertStatement(params, board.schema);
  }

  // 生成SQL - UPDATE
  if (method === 'UPDATE') {
    return updateStatement(params, board.schema, filter, method);
  }

  // 生成SQL - DELETE
  if (method === 'REMOVE') {
    return deleteStatement(params, schema, filter, method);
  }

}

function selectStatement(params, schema, selects, wheres, sorts, method) {

  // 没有指定select项目，则通过count(1)获取件数
  let sql = 'SELECT ' + (method === 'COUNT' ? ' COUNT(1) AS COUNT ' : selects.join(', '));

  // 条件
  const parent = _structure(schema).parent;
  sql = sql + ` FROM [${parent ? parent : schema}]`;
  sql = sql + (_where(params, schema, wheres, method) || '');

  // 获取件数，就不生成排序
  if (method === 'COUNT') {
    return sql;
  }

  // 排序（没有指定排序时，为了能使用 OFFSET 语句，使用_id排序）
  const hasSort = (sorts && sorts.length > 0);
  sql = sql + (hasSort ? ' ORDER BY ' + sorts.join(', ') : ' ORDER BY [_id] DESC');

  // 当skip和limit都没有指定时，不限制获取的行数
  if (!params.skip && !params.limit) {
    return sql;
  }

  // 起始行数
  sql = sql + ` OFFSET ${(!params.skip || params.skip < 0) ? 0 : params.skip} ROW`;

  // 行数限制
  if (params.limit && params.limit > 0) {
    params.limit = params.limit > CONST.DB_MILLION_LIMIT ? CONST.DB_MILLION_LIMIT : params.limit;
    sql = sql + ` FETCH NEXT ${params.limit} ROWS ONLY`;
  }

  return sql;
}

function insertStatement(params, schema) {

  const structure = _structure(schema)
    , parent      = structure.parent
    , keys        = Object.keys(structure.items)
    , column      = []
    , values      = [];

  keys.forEach(item => {
    // 值被设定时，才作为SQL的项目生成L
    if (typeof params.data[item] !== 'undefined') {
      column.push(`[${item}]`);
      values.push(`<%- data.${item} %>`);
    }
  });

  // 固定项目
  ['_id', 'createAt', 'createBy', 'updateAt', 'updateBy', 'valid'].forEach(item => {
    if (!column.includes(`[${item}]`)) {
      column.push(`[${item}]`);
      return values.push(`<%- data.${item} %>`);
    }
  });

  let sql = `INSERT INTO [${parent ? parent : schema}] ( `;
  sql = sql + column.join(', ');
  sql = sql + ' ) VALUES ( ';
  sql = sql + values.join(', ');
  sql = sql + ')';

  return sql;
}

function updateStatement(params, schema, wheres, method) {

  const structure = _structure(schema)
    , parent      = structure.parent
    , keys        = Object.keys(structure.items);

  const values = [
    ' [updateAt] = <%- data.updateAt %>',
    ' [updateBy] = <%- data.updateBy %>'
  ];

  keys.forEach(item => {
    if (typeof params.data[item] !== 'undefined') {
      values.push(` [${item}] = <%- data.${item}%>`);
    }
  });

  let sql = `UPDATE [${parent ? parent : schema}] SET ` + values.join(',');
  return sql + _where(params, schema, wheres, method);
}

function deleteStatement(params, schema, wheres, method) {

  const structure = _structure(schema)
    , parent      = structure.parent;

  const values = [
    ' [updateAt] = <%- data.updateAt %>',
    ' [updateBy] = <%- data.updateBy %>',
    ' [valid] = <%- data.valid %>'
  ];

  let sql = `UPDATE [${parent ? parent : schema}] SET ` + values.join(',');
  sql = sql + _where(params, schema, wheres, method);

  return sql;
}

function _filter(board, params) {

  if (params.free) {
    return [operator.parseFree(params.free, params.condition)];
  }

  board.filters = board.filters || [];

  const or = board.filters.reduce((memo, item) => {
    const value = params.condition[item.parameter];
    if (typeof value !== 'undefined' && value !== '') {
      memo[item.group] = memo[item.group] || [];
      memo[item.group].push(item);
    }
    return memo;
  }, {});

  return _.values(or).map(item => {
    return item
      .filter(and => {
        const value = params.condition[and.parameter];
        return typeof value !== 'undefined' && value !== '';
      })
      .map(and => {
        return operator.getCompiler(and.key, and.operator, and.parameter);
      });
  });

}

function _sort(board, params) {

  if (params.sort) {
    return Object.keys(params.sort).map(key => {
      const value = params.sort[key];
      return `[${key}] ${value > 0 ? 'ASC' : 'DESC'}`;
    });
  }

  board.sorts = board.sorts || [];
  return board.sorts.sort((a, b) => a.order > b.order).map(item => {
    return `[${item.key}] ${item.order ? 'ASC' : 'DESC'}`
  });

}

function _select(board, params) {

  const selects = ['[_id]']; // 始终返回_id

  if (params.select) {

    let items = [];
    if (typeof params.select === 'string') {  // 格式 'field1, field2'
      items = params.select.split(',');
    } else {
      if (Array.isArray(params.select)) {     // 格式 [field1, field2]
        items = params.select;
      } else {
        items = Object.keys(params.select);   // 格式 {field1:1, field2:1}
      }
    }

    items.map(item => {
      const [top] = item.trim().split('.');
      selects.push(`[${top}]`);
    });

    return Array.from(new Set(selects)); // 去重
  }

  board.selects.forEach(item => {
    if (item.select) {
      const [top] = item.key.split('.'); // 选择项目为 a.b 时，取 a 的值
      if (!selects.includes(`[${top}]`)) {
        selects.push(`[${top}]`);
      }
    }
  });

  return Array.from(new Set(selects)); // 去重
}

function _where(params, schema, where, method) {

  const parent = _structure(schema).parent;

  // 缺省的条件
  function defaults() {
    const condition = [];
    if (typeof params.condition.valid === 'undefined') {
      condition.push(['[valid] = <%- condition.valid %>']);
    }
    if (parent) {
      condition.push('[type] = <%- condition.type %>');
    }
    return condition;
  }

  // 没有指定where，尝试使用_id检索
  if (!where || where.length <= 0) {
    const condition = defaults();

    if (['GET', 'UPDATE', 'REMOVE'].includes(method) && params.id) {
      condition.push('[_id] = <%- condition._id %>');
    }

    return ' WHERE ' + condition.join(' AND ');
  }

  // 没有OR条件，所有项目用 AND 连接
  if (where.length === 1) {
    return ' WHERE ' + defaults().concat(where[0]).join(' AND ');
  }

  // 有OR条件，所有项目先用AND连接，然后再用OR连接
  if (where.length > 1) {
    return ' WHERE ' + where.map(item => defaults().concat(item).join(' AND ')).join(' OR ');
  }
}

function _structure(schema) {
  return cache.get(CONST.SYSTEM_DB_STRUCTURE).find(item => item.schema === schema);
}

// 遍历所有的选择项目，获取options项的值 （与Mongo的方法相同）
function fetchOptions(handler, data, board, callback) {
  if (_.isEmpty(data)) {
    return callback(null, data);
  }

  async.eachSeries(board.selects, (item, next) => {
    if (item.select) {
      return join(handler, data, item, board.type, next);
    }
    next();
  }, err => callback(err, data));
}

// 在数据中找到指定的key值，检索关联表，获取数据，并将结果保存到data的options里（与Mongo的方法相同）
function join(handler, data, item, type, callback) {

  const schema = item.schema;
  if (!data || !schema) {
    return callback();
  }

  // 已经获取的内容（不再重复获取，检索时剔除这些内容）
  const selected = data.options ? _.keys(data.options[schema]) : [];

  // 最终结果保存在options里
  data.options = data.options || {};

  // 指定检索条件
  let filter = {free: {}, select: item.fields}, storeKey;
  Object.keys(item.conditions).forEach(key => {

    let dataKey = item.conditions[key];

    // $符号开头的是变量，需要在data里取值作为真正的检索条件值
    if (dataKey[0] === '$') {
      let val = mpath.get(dataKey.substr(1), (type === 4) ? data.items : data); // 列表类型（type=4）时，在items里取值
      val = _.isArray(val) ? val : [val];
      val = _.union(_.compact(_.difference(_.flatten(val), selected)));     // 去除已经获取的，空的，重复的

      if (!_.isEmpty(val)) {
        filter.free[key] = {$in: val};
      }

      // 确定保存Option数据的key，找出与当前数据字段相同的条件的名称
      if (dataKey.substr(1) === item.key) {
        storeKey = key;
      }
    } else {
      filter.free[key] = dataKey;
    }
  });

  // 没有条件，不检索options项，防止检索所有的值出来
  if (_.isEmpty(filter.free)) {
    return callback();
  }

  // 找到新的board
  const board = cache.get(CONST.SYSTEM_DB_BOARD).find(item => item.schema === schema && item.action === 'list')
    , script  = buildScript(board, filter);

  // 查询
  new ctrl(handler.copy({script: script, condition: filter.condition}), schema).list((err, result) => {
    result.items.forEach(item => {
      data.options[schema] = data.options[schema] || {};
      data.options[schema][item[storeKey] || item._id] = item;
    });

    callback(err);
  });
}
