/**
 *
 * 1. 组装SQL模板，在model里正式将sql和params合并成可执行的SQL语句
 * 2. 内嵌的对象，检索时获取内嵌对象的所有内容
 * 3. 条件里有内嵌的对象，需要将项目转换成 如 [column].value('(/root/a)[1]', 'varchar(10)')
 */

'use strict';

const _   = require('lodash')
  , error = require('../../error')
  , CONST = require('../../constant')
  , ctrl  = require('../../db/sqlserver/controller')
  , cache = require('../../cache')
;

exports.add = (handler, callback) => {
  handler.params.script = buildScript(handler.api, handler.params);
  new ctrl(handler).add(callback);
};

exports.list = (handler, callback) => {
  handler.params.script = buildScript(handler.api, handler.params);
  new ctrl(handler).list(callback);
};

exports.get = (handler, callback) => {
  handler.params.script = buildScript(handler.api, handler.params);
  new ctrl(handler).get(callback);
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

  // SCHEMA
  const struct = getStructure(board.schema)
    , schema   = struct.parent ? struct.parent : board.schema;

  params.condition = params.condition || {};
  params.data = params.data || {};

  // 如果是继承的表，那么在条件里设定type
  if (struct.parent) {
    if (!params.condition.type) {
      params.condition.type = board.schema;
    }
    if (!params.data.type) {
      params.data.type = board.schema;
    }
  }

  // 将id参数转存到condition中
  if (params.id) {
    params.condition._id = params.id;
  }

  // SELECT
  const selects = [];
  board.selects.forEach(item => {
    if (item.select) {
      const [top] = item.key.split('.'); // 选择项目为 a.b 时，取 a 的值
      if (!selects.includes(`[${top}]`)) {
        selects.push(`[${top}]`);
      }
    }
  });

  // WHERE
  board.filters = board.filters || [];
  const filters = board.filters.reduce((memo, item) => {
    const value = params.condition[item.parameter];
    if (typeof value !== 'undefined') {
      memo[item.group] = memo[item.group] || [];
      memo[item.group].push(item);
    }
    return memo;
  }, {});

  const or = Object.values(filters).map(filter => {
    return filter.map(and => {
      return getCompiler(and.key, and.operator, and.parameter);
    });
  });

  // SORT
  board.sorts = board.sorts || [];
  const sorts = board.sorts.sort((a, b) => a.order > b.order).map(item => {
    return `[${item.key}] ${item.order ? 'ASC' : 'DESC'}`
  });

  const method = CONST.METHOD_NAME[board.type];

  // 生成SQL - SELECT
  if (method === 'GET' || method === 'LIST') {
    return selectStatement(params, schema, selects, or, sorts);
  }

  // 生成SQL - COUNT
  if (method === 'COUNT') {
    return selectStatement(params, schema, null, or, null);
  }

  // 生成SQL - INSERT
  if (method === 'ADD') {
    return insertStatement(params, schema);
  }

  // 生成SQL - UPDATE
  if (method === 'UPDATE') {
    return updateStatement(params, schema);
  }

  // 生成SQL - DELETE
  if (method === 'REMOVE') {
    return deleteStatement(params, schema);
  }

}

function selectStatement(params, schema, selects, wheres, sorts) {

  const isCount = (selects === null)
    , hasSort   = (sorts && sorts.length > 0);

  // 没有指定select项目，则通过count(1)获取件数
  let sql = 'SELECT ' + (isCount ? ' COUNT(1) AS COUNT ' : selects.join(', '));

  // 条件
  const parent = getStructure(schema).parent;
  sql = sql + ` FROM [${parent ? parent : schema}]` + (getWhere(params, schema, wheres) || '');

  // 获取件数，不指定排序和行数限制
  if (isCount) {
    return sql;
  }

  // 排序（没有指定排序时，为了能使用 OFFSET 语句，使用_id排序）
  sql = sql + (hasSort ? ' ORDER BY ' + sorts.join(', ') : ' ORDER BY [_id]');

  // 行数限制
  sql = sql + ` OFFSET ${(!params.skip || params.skip < 0) ? 0 : params.skip} ROW`;
  if (params.limit && params.limit > 0) {
    sql = sql + ` FETCH NEXT ${params.limit} ROWS ONLY`;
  }

  return sql;
}

function insertStatement(params, schema) {

  const structure = getStructure(schema)
    , parent      = structure.parent
    , column      = ['[_id]', '[createAt]', '[createBy]', '[updateAt]', '[updateBy]', '[valid]']
    , keys        = Object.keys(structure.items);

  const values = [
    '<%- data._id %>',
    '<%- data.createAt %>',
    '<%- data.createBy %>',
    '<%- data.updateAt %>',
    '<%- data.updateBy %>',
    '<%- data.valid %>'
  ];

  keys.forEach(item => {
    if (typeof params.data[item] !== 'undefined') {
      column.push(`[${item}]`);
      values.push(`<%- data.${item} %>`);
    }
  });

  let sql = `INSERT INTO [${parent ? parent : schema}] ( `;
  sql = sql + column.join(', ');
  sql = sql + ' ) VALUES ( ';
  sql = sql + values.join(', ');
  sql = sql + ')';

  return sql;
}

function updateStatement(params, schema, wheres) {

  const structure = getStructure(schema)
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
  return sql + getWhere(params, schema, wheres);
}

function deleteStatement(params, schema, wheres) {

  const values = [
    ' [updateAt] = <%- data.updateAt %>',
    ' [updateBy] = <%- data.updateBy %>',
    ' [valid] = <%- data.valid %>'
  ];

  let sql = `UPDATE [${schema}] SET ` + values.join(',');
  sql = sql + getWhere(params, schema, wheres);

  return sql;
}

function getWhere(params, schema, where) {

  const parent = getStructure(schema).parent;

  // 缺省的条件
  function defaults() {
    const condition = [];
    if (typeof params.condition.valid === 'undefined') {
      condition.push(['[valid] = <%- condition.valid %>']);
    }

    // 如果指定有id参数，那么可以忽略type条件（id可以唯一标识数据）
    if (parent && !params.id) {
      condition.push('[type] = <%- condition.type %>');
    }
    return condition;
  }

  // 没有指定where，尝试使用_id检索
  if (!where || where.length <= 0) {
    const condition = defaults();

    if (params.id) {
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

function getStructure(schema) {
  return cache.get(CONST.SYSTEM_DB_STRUCTURE).find(item => item.schema === schema);
}

function getCompiler(key, operator, value) {

  switch (operator) {
    case '$eq':
      return `[${key}] = <%- condition.${value} %>`;
    case '$ne':
      return `[${key}] != <%- condition.${value} %>`;
    case '$gt':
      return `[${key}] > <%- condition.${value} %>`;
    case '$gte':
      return `[${key}] >= <%- condition.${value} %>`;
    case '$lt':
      return `[${key}] < <%- condition.${value} %>`;
    case '$lte':
      return `[${key}] <= <%- condition.${value} %>`;
    case '$regex':
      return `[${key}] LIKE <%- condition.${value} %>`;
    case '$in':
      return `[${key}] IN <%- condition.${value} %>`;
    case '$nin':
      return `[${key}] NOT IN (<%- condition.${value} %>)`;
    case '$exists':
      return `[${key}] IS NOT NULL`;
  }

  throw new error.parameter.ParamError('Core has not yet supported the operator.');
}
