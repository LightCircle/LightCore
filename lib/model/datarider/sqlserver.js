/**
 *
 */

'use strict';

const _   = require('lodash')
  , error = require('../../error')
  , CONST = require('../../constant')
  , Ctrl  = require('../../db/sqlserver/controller')
  , cache = require('../../cache')
;

exports.add = (handler, callback) => {
};

exports.list = (handler, callback) => {

  let board = {
    schema: 'xml',
    selects: [{key: '_id', select: true}, {key: 'createAy'}],
    type: 'LIST',
    sorts: [],
    filters: [],
  };

  let script = buildScript(handler, board, {}, {});

  callback(null, script);
};

exports.get = (handler, callback) => {
};

exports.count = (handler, callback) => {

  let board = {
    schema: 'xml',
    selects: [],
    type: 'COUNT',
    sorts: [],
    filters: [{key: '_id', operator: '$eq', parameter: 'x123456780'}],
  };

  let script = buildScript(handler, board, {}, {});

  callback(null, script);
};

exports.remove = (handler, callback) => {
};

exports.update = (handler, callback) => {
};

function buildScript(handler, board, params, parent) {

  if (board.script) {
    return board.script;
  }

  // SCHEMA
  const schema = parent ? board.schema : parent;

  // SELECT
  const selects = [];
  board.selects.forEach(item => {
    if (item.select) {
      selects.push(`[${item.key}]`);
    }
  });

  // SORT
  const sorts = board.sorts.sort((a, b) => a.order > b.order).map(item => {
    return `[${item.key}] ${item.order ? 'ASC' : 'DESC'}`
  });

  // WHERE
  const filters = board.filters.reduce((memo, item) => {
    const value = params.condition[item.parameter];
    if (typeof value !== 'undefined') {
      memo[item.group] = memo[item.group] || [];
      memo[item.group].push(item);
    }
  }, {});

  const or = Object.values(filters).map(item => {
    return getCompiler(item.key, item.operator, item.parameter);
  });

  if (board.type === 'GET' || board.type === 'LIST') {
    return selectStatement(params, parent, schema, selects, or, sorts);
  }

  if (board.type === 'COUNT') {
    return selectStatement(params, parent, schema, null, or, null);
  }

  if (board.type === 'ADD') {
    return insertStatement();
  }

  if (board.type === 'UPDATE') {
    return updateStatement();
  }

  if (board.type === 'REMOVE') {
    return deleteStatement();
  }

}

function selectStatement(params, parent, schema, selects, wheres, sorts) {

  let sql = ' SELECT ';

  // 没有指定select项目，则通过count(1)获取件数
  if (!selects || selects.length <= 0) {
    sql = sql + ' COUNT(1) AS COUNT '
  } else {
    sql = sql + selects.join(', ')
  }

  // 条件
  sql = sql + ` FROM ${schema}` + (getWhere(params, parent, wheres) || '');

  // 排序（没有指定排序时，为了能使用 OFFSET 语句，使用_id排序）
  if (sorts && sorts.length > 0) {
    sql = sql + ' ORDER BY' + sorts.join(', ');
  } else {
    sql = sql + ' ORDER BY [_id]';
  }

  // 行数限制
  sql = sql + ` OFFSET ${(!params.skip || params.skip < 0) ? 0 : params.skip} ROW`;
  if (params.limit && params.limit > 0) {
    sql = sql + ` FETCH NEXT ${params.limit} ROWS ONLY`;
  }

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

function updateStatement(params, schema, parent, wheres) {

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
  sql = sql + getWhere(params, parent, wheres);

  return sql;
}

function deleteStatement(params, schema, parent, wheres) {

  let sql = ` UPDATE [${schema}] SET `;
  const values = [
    '<%= [updateAt] = data.updateAt %>',
    '<%= [updateBy] = data.updateBy %>',
    '<%= [valid] = data.valid %>'
  ];

  sql = sql + values.join(',');
  sql = sql + getWhere(params, parent, wheres);

  return sql;
}

function getWhere(params, parent, where) {

  // 没有指定where，尝试使用_id检索
  if (!where || where.length <= 0) {

    const condition = [];

    condition.push(`[valid] = 1`);
    if (params.id) {
      condition.push(`[_id] = <%= ${condition._id} %>`);
    }

    return ' WHERE ' + condition.join(' AND ');
  }

  // 没有OR条件，所有项目用 AND 连接
  if (where.length === 1) {

    const condition = [];

    condition.push(`[valid] = 1`);
    if (parent) {
      condition.push(`[type] = <%= ${condition.type} %>`);
    }
    condition.concat(where[0]);

    return ' WHERE ' + condition.join(' AND ');
  }

  // 有OR条件，所有项目先用AND连接，然后再用OR连接
  if (where.length > 1) {
    return ' WHERE ' + where.map(item => {

      const condition = [];
      condition.push(`[valid] = 1`);
      if (parent) {
        condition.push(`[type] = <%= ${condition.type} %>`);
      }
      condition.concat(item);

      return condition.join(' AND ');

    }).join(' OR ');
  }
}

function getStructure(schema) {
  return cache.get(CONST.SYSTEM_DB_STRUCTURE).find(item => item.schema === schema);
}

function getCompiler(key, operator, value) {

  switch (operator) {
    case '$eq':
      return `${key} = <%= condition.${value} %>`;
    case '$ne':
      return `${key} != <%= condition.${value} %>`;
    case '$gt':
      return `${key} > <%= condition.${value} %>`;
    case '$gte':
      return `${key} >= <%= condition.${value} %>`;
    case '$lt':
      return `${key} < <%= condition.${value} %>`;
    case '$lte':
      return `${key} <= <%= condition.${value} %>`;
    case '$regex':
      return `${key} LIKE <%= condition.${value} %>`;
    case '$in':
      return `${key} IN <%= condition.${value} %>`;
    case '$nin':
      return `${key} NOT IN (<%= condition.${value} %>)`;
    case '$exists':
      return `${key} IS NOT NULL`;
  }

  throw new error.parameter.ParamError('Core has not yet supported the operator.');
}
