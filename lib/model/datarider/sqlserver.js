/**
 *
 */

'use strict';

const _   = require('lodash')
  , error = require('../../error')
  , CONST = require('../../constant')
  , ctrl  = require('../../db/sqlserver/controller')
  , cache = require('../../cache')
;

exports.add = (handler, callback) => {
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
};

exports.update = (handler, callback) => {
};

function buildScript(board, params) {

  if (board.script) {
    return board.script;
  }

  // SCHEMA
  const struct = getStructure(board.schema)
    , schema   = struct.parent ? board.schema : struct.parent;

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
      selects.push(`[${item.key}]`);
    }
  });

  // WHERE
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

  const method = CONST.METHOD[board.type];

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
    return insertStatement();
  }

  // 生成SQL - UPDATE
  if (method === 'UPDATE') {
    return updateStatement();
  }

  // 生成SQL - DELETE
  if (method === 'REMOVE') {
    return deleteStatement();
  }

}

function selectStatement(params, schema, selects, wheres, sorts) {

  let sql = ' SELECT ';

  // 没有指定select项目，则通过count(1)获取件数
  if (!selects || selects.length <= 0) {
    sql = sql + ' COUNT(1) AS COUNT '
  } else {
    sql = sql + selects.join(', ')
  }

  // 条件
  const parent = getStructure(schema).parent;
  sql = sql + ` FROM ${parent ? parent : schema}` + (getWhere(params, schema, wheres) || '');

  // 排序（没有指定排序时，为了能使用 OFFSET 语句，使用_id排序）
  if (sorts && sorts.length > 0) {
    sql = sql + ' ORDER BY ' + sorts.join(', ');
  } else {
    sql = sql + ' ORDER BY [_id]';
  }

  // 行数限制
  sql = sql + ` OFFSET ${(!params.skip || params.skip < 0) ? 0 : params.skip} ROW`;
  if (params.limit && params.limit > 0) {
    sql = sql + ` FETCH NEXT ${params.limit} ROWS ONLY`;
  }

  console.log(sql);
  return sql;
}

function insertStatement(params, schema) {

  let sql = ` INSERT INTO [${schema}] ( `;

  let structure = getStructure(schema);

  const values = [
    '<%= data._id %>',
    '<%= data.createAt %>',
    '<%= data.createBy %>',
    '<%= data.updateAt %>',
    '<%= data.updateBy %>',
    '<%= data.valid %>'
  ];

  const column = ['_id', 'createAt', 'createBy', 'updateAt', 'updateBy', 'valid']
    , keys     = Object.keys(structure.items);

  keys.forEach(item => {
    if (typeof params.data[item] !== 'undefined') {
      column.push(`[${item}]`);
      values.push(`<%= data.${item}%>`);
    }
  });

  sql = sql + column.join(', ');
  sql = sql + ' ) VALUES ( ';
  sql = sql + values.join(', ');
  sql = sql + ')';
  return sql;
}

function updateStatement(params, schema, wheres) {

  let sql = ` UPDATE [${schema}] SET `;

  let structure = getStructure(schema);

  const values = [
    '<%= [updateAt] = data.updateAt %>',
    '<%= [updateBy] = data.updateBy %>'
  ];

  const keys = Object.keys(structure.items);
  keys.forEach(item => {
    if (typeof params.data[item] !== 'undefined') {
      values.push(` [${item}] = <%= data.${item}%>`);
    }
  });

  sql = sql + values.join(',');
  sql = sql + getWhere(params, schema, wheres);

  return sql;
}

function deleteStatement(params, schema, wheres) {

  let sql = ` UPDATE [${schema}] SET `;
  const values = [
    '<%= [updateAt] = data.updateAt %>',
    '<%= [updateBy] = data.updateBy %>',
    '<%= [valid] = data.valid %>'
  ];

  sql = sql + values.join(',');
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
      return `${key} = <%- condition.${value} %>`;
    case '$ne':
      return `${key} != <%- condition.${value} %>`;
    case '$gt':
      return `${key} > <%- condition.${value} %>`;
    case '$gte':
      return `${key} >= <%- condition.${value} %>`;
    case '$lt':
      return `${key} < <%- condition.${value} %>`;
    case '$lte':
      return `${key} <= <%- condition.${value} %>`;
    case '$regex':
      return `${key} LIKE <%- condition.${value} %>`;
    case '$in':
      return `${key} IN <%- condition.${value} %>`;
    case '$nin':
      return `${key} NOT IN (<%- condition.${value} %>)`;
    case '$exists':
      return `${key} IS NOT NULL`;
  }

  throw new error.parameter.ParamError('Core has not yet supported the operator.');
}
