##########
 - 平台表 在LightDB下 全平台共同的表
   app,machine,middleware ...

 - 应用表 在应用的DB下
   - Tenant表 tenant名为前缀 nec.ticket nec.location ...
   - 系统表 固定light为前缀 light.structure light.route ...
   - 扩展表 扩展用户和组用的表
      - u user
      - g group
      - c category
      - f file

- 共享DB 多个应用共享的DB

##########

- kind
 系统表 2，用户定义表 0，扩展类型表 1

- type
 扩展表类型 1，2，3，4

- tenant
 0 平台表 1 共同表 2 tenant表

############################################

var Setting = {
    type:         { type: String, description: "分类" }
  , key:          { type: String, description: "标识" }
  , value:        { type: String, description: "值" }
  , option:       { type: Object, description: "附加项" }
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};

var Template = {
    name:         { type: String, description: "名称"}
  , type:         { type: Number, description: "模板类型 1:通知模板 2:回答模板 3:定期模板 4:应用模板"}
  , draft:        { type: Number, description: "临时保存 0:正式版 1:临时保存"}
  , items:        { type: Array,  description: "项目" }
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};

var Role = {
    name:         { type: String, description: "名称"}
  , type:         { type: String, description: "权限分类"}
  , roles:        { type: Array,  description: "包含的角色" }
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};

var Place = {
    name:         { type: String, description: "名称"}
  , parent:       { type: String, description: "父地址" }
  , sort:         { type: Number, description: "排序因子(一般按照降序)"}
  , invisible:    { type: Number, description: "不可见" , default: 0}
  , extend:       { type: Object, description: "附加项(扩展用)" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};

var Markdown = {

  title: {type: String, description: ""},
  boyd: {type: String, description: ""},
  html: {type: String, description: ""},


  option: {
    html: {type: Boolean, description: ""},
    breaks: {type: Boolean, description: ""},
    linkify: {type: Boolean, description: ""}
  }

  , valid: {type: Number, description: "删除 0:无效 1:有效", default: constant.VALID}
  , createAt: {type: Date, description: "创建时间"}
  , createBy: {type: String, description: "创建者"}
  , updateAt: {type: Date, description: "最终修改时间"}
  , updateBy: {type: String, description: "最终修改者"}
};

var Job = {

  step: {
    index:     { type: Number, description: "顺序" },
    type:   { type: String, description: "class, script, ..." },
    script: { type: String, description: "ls -ln" },
    class:  {},
    action: {},
    params: { type: String, description: "" }

    //start:  { type: Date, description: "结果：开始日" },
    //end:    { type: Date, description: "结果：结束日" },
    //exit:   { type: String, description: "Exit code" },
    //status: { type: String, description: "STARTED, FAILED, COMPLETED  PAUSED" }
  },

  schedule: { type: String, description: "" },
  start: {
    date: {}
  },
  limit: {
    date: {},
    count: {}
  },

  last:    { type: Date, description: "最终结束日" },
  status: { type: String, description: "STARTED, FAILED, COMPLETED" },

  extend: {
    color: {},
    notice: {},
    auth: {}
  }

  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};


var I18n = {
    category: { type: String, description: "分类 按app名分类", default: constant.DEFAULT_I18N_CATEGORY }
  , key:      { type: String, description: "词条key" }
  , lang:     { type: Object, description: "翻译结果" }
  , valid:    { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt: { type: Date,   description: "创建时间" }
  , createBy: { type: String, description: "创建者" }
  , updateAt: { type: Date,   description: "最终修改时间" }
  , updateBy: { type: String, description: "最终修改者" }
};

## 备份履历
var History = {

  job: { type: String, description: "" },
  step: {},

  stdout: { type: String, description: "标准输出" },
  stderr: { type: String, description: "标准错误" },

  result: { type: String, description: "结果，通常由脚本程序设定" },

  start:  { type: Date, description: "结果：开始日" },
  end:    { type: Date, description: "结果：结束日" },
  exit:   { type: String, description: "Exit code" },
  status: { type: String, description: "STARTED, FAILED, COMPLETED  PAUSED" },



  extend: {
  }

  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};

var Function = {
    //app:          { type: String, description: "应用"}
   type:         { type: String, description: "菜单级别"}
  , name:         { type: String, description: "名称"}
  , menu:         { type: String, description: "菜单标识"}
  , parent:       { type: String, description: "父菜单"}
  , url:          { type: String, description: "URL" }
  , description:  { type: String, description: "描述" }
  , order:        { type: String, description: "顺序" }
  , icon:         { type: String, description: "图标" }
  , active:       { type: String, description: "有效 0:disabled 1:enabled Disable时是禁用按钮" }
  , public:       { type: String, description: "公开 0:invisible 1:visible" }
  , role:         { type: Array,  description: "权限" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};

var ETL = {
    name:         { type: String, description: "名称" }
  , format:       { type: String, description: "格式: CSV,XLS,XML,JSON,HTML" }
  , charset:      { type: String, description: "编码: UTF-8,Shift-JIS" }
  , template:     { type: String, description: "模板，说明文件" }
  , target:       { type: String, description: "导入Collection" }
  , description:  { type: String, description: "描述" }
  , history:      { type: Object, description: "导入履历" }
  , extend:       { type: Object, description: "扩展属性" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};


// 设备
var Device = {
    token:        { type: String, description: "标识 通常是QRcode内容" }
  , qrcode:       { type: String, description: "二维码 图片ID" }
  , identifier:   { type: String, description: "设备号 设备的唯一标识" }
  , pushToken:    { type: String, description: "推送识别号 由推行服务商发行" }
  , type:         { type: String, description: "设备类型 iPhone, Android等" }
  , user:         { type: String, description: "使用者" }
  , active:       { type: Date,   description: "激活日期" }
  , status:       { type: String, description: "设备状态 0:禁止 1:已激活 2:未激活"}
  , description:  { type: String, description: "描述" }
  , extend:       { type: Object, description: "扩展属性" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};

// 权限定义
var Authority = {
    name:         { type: String, description: "名称"}
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};

var ACLink = {
    resource:     { type: String, description: "资源" }
  , type:         { type: String, description: "类型 (未使用)" }
  , authority:    { type: Array,  description: "权限名称" }
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};

var Middleware = {
    name:           { type: String, description: "名称 Mongodb,Node,..."}
  , version:        { type: String, description: "版本" }
  , source:         { type: String, description: "YUM,NPM,BOWER,..." }
  , os:             { type: String, description: "操作系统" }
  , setting:        { type: Array,  description: "配置内容" }
  , config:         { type: Array,  description: "配置内容 物理文件" }
  , description:    { type: String, description: "描述" }
  , valid:          { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:       { type: Date,   description: "创建时间" }
  , createBy:       { type: String, description: "创建者" }
  , updateAt:       { type: Date,   description: "最终修改时间" }
  , updateBy:       { type: String, description: "最终修改者" }
};


var Machine = {
    name:           { type: String, description: "服务器名"}
  , type:           { type: String, description: "类型: 1:master 2:minion" }
  , master:         { 管理服务器 }
//  , dns:            { type: String, description: "DNS" }
  , ip:             { type: String, description: "IPv4地址" }
  , ipv6:           { type: String, description: "IPv6地址" }
//  , os:             { type: String, description: "操作系统" }
//  , cpu:            { type: String, description: "CPU" }
//  , memory:         { type: String, description: "内存" }
//  , hdd:            { type: String, description: "硬盘" }
  , usage:         { type: Array,  description: "用途" }
  , description:    { type: String, description: "描述" }
  , valid:          { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:       { type: Date,   description: "创建时间" }
  , createBy:       { type: String, description: "创建者" }
  , updateAt:       { type: Date,   description: "最终修改时间" }
  , updateBy:       { type: String, description: "最终修改者" }
};

var Cron = {
    name:     { type: String, description: "脚本名"}
  , param:    { type: String, description: "脚本参数" }
  , host:     { type: String, description: "定时主机" }
  , timing:   { type: String, description: "定时" }
  , valid:    { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt: { type: Date,   description: "创建时间" }
  , createBy: { type: String, description: "创建者" }
  , updateAt: { type: Date,   description: "最终修改时间" }
  , updateBy: { type: String, description: "最终修改者" }
};

var Backup = {

    description:  { type: String, description: "描述" },

    type: { type: String, description: "db, file, code" },
    keep: {
      day: {},
      count: {},
      size: {}
    },

  option: {
    // db
    db:{},
    collection:{},
    query:{},

    // code
    url: {},
    account: {},

    // file
    path: {},
    exclude: {}
  }

  , job: { type: String, description: "关联JOB" }

  //, increment:    { type: Number, description: "增分备份 0:保存差分备份 1:不保存差分备份（只同步）" }

  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};


var Tenant = {
    name:         { type: String, description: "名称"}
  , code:         { type: String, description: "标识" }
  , logo:         { type: String, description: "公司Logo" }
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};


-------------
var Validator = {
  name:           { type: String, description: "校验对象" }
  , rule:         [ String ]
  , message:      { type: Object, description: "校验用属性" }
};


var Item = {
  key:            { type: String, description: "标示key" }
  , type:         { type: String, description: "String, Number, Date, Array, Mixed" }
  , name:         { type: String, description: "名称" }
  , translation:  { type: String, description: "名称翻译" }
  , validator:    [ Validator ]
  , contents:     [ Object ]
  , default:      { type: Object, description: "缺省值" }
  , description:  { type: String, description: "说明" }
  , reserved:     { type: Number, description: "字段类型 1：系统默认 2：用户自定义", default: 2}
};

var Structure = {
  public:         { type: Number, description: "公开标识，1：公开，0：非公开" }
  , lock:         { type: Number, description: "更新锁，1：锁定，0：开放 锁定是不能 增删改" }
  , type:         { type: Number, description: "类型 1:User 2:Group 3:Category 4:File" }
  , kind:         { type: Number, description: "类型 0:Normal 1:EXTEND 2:SYSTEM " }
  , tenant:       { type: Number, description: "类型 1:common 2:tenant  是否是tenant表" }
  , version:      { type: String, description: "版本" }
  , schema:       { type: String, description: "Schema名", required: true, unique: true} //
  , items:        [ Item ]
  , extend:       { type: Object, description: "扩展属性" }
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "更新时间" }
  , updateBy:     { type: String, description: "更新者" }
};
---------------


var Route = {
  url:            { type: String, description: "路径"}
  , category:     { type: String, description: "分类"}
  , class:        { type: String, description: "controller类名 逻辑处理用" }
  , action:       { type: String, description: "controller类的方法名 参数 handler callback req res" }
  , template:     { type: String, description: "渲染画面 ejs模板用" }
  , parameter:    { type: Array,  description: "参数" }
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};


var Log = {
    time:     { type: Date,   description: "日志输出时间" }
  , uid:      { type: String, description: "执行操作的用户的标识" }
  , host:     { type: String, description: "产生日志的机器的IP地址" }
  , source:   { type: String, description: "产生日志的软件分类" }
  , type:     { type: String, description: "日志类型，audit | operation | application" }
  , level:    { type: String, description: "日志输出级别" }
  , code:     { type: String, description: "信息编号" }
  , message:  { type: String, description: "详细信息" }
  , file:     { type: String, description: "输出日志的代码文件" }
  , line:     { type: String, description: "输出日志的代码在文件中的行号" }
};


var Developer = {
    id:       { type: String, description: "用户标识" }
  , name:     { type: String, description: "用户称" }
  , password: { type: String, description: "密码" }
  , type:     { type: Number, description: "用户类型 1:owner 2:一般开发" }
  , corp:     { type: String, description: "账户识别号" }
  , roles:    { type: Array,  description: "所属角色一览" }
  , email:    { type: String, description: "电子邮件地址" }
  , phone:    { type: String, description: "电话号码" }
  , lang:     { type: String, description: "语言" }
  , timezone: { type: String, description: "时区" }
  , status:   { type: String, description: "状态 开发中，公开，停止等" }
  , valid:    { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt: { type: Date,   description: "创建时间" }
  , createBy: { type: String, description: "创建者" }
  , updateAt: { type: Date,   description: "最终修改时间" }
  , updateBy: { type: String, description: "最终修改者" }
};


var Configuration = {
  domain:         { type: String, description: "应用程序标识" }
  , owner:        { type: String, description: "所有者" }
  , type:         { type: String, description: "分类" }
  , key:          { type: String, description: "标识" }
  , value:        { type: String, description: "值" }
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};

var App = {
    name:         { type: String, description: "名称"}
  , domain:       { type: String, description: "应用程序标识，即AppID", unique: true }
  , corp:         { type: String, description: "账户识别号"}
  , icon:         { type: String, description: "应用程序图标"}
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};


---------
var Filter = {
  key:           { type: String, description: "Schema的item" }
  , operator:     { type: String, description: "条件: >, <, =" }
  , parameter:{ type: String, description: "参数名称" }
  , default:{ type: String, description: "参数值，参数名没指定或指定的参数名没有值则，这个值被使用" }
  , group: { description: "或 group" }
};

var Select = {
    key:          { type: String, description: "Schema的item" }
  , select:       { type: Boolean, description: "选择:true 非选择:false" }
  , format:       { type: String, description: "格式化" }
  , alias:        { type: String, description: "项目别名" }
  , option:       { type: String, description: "附加项 Schema名 如 user, group等" }
  , fields:       { type: Array, description: "附加项 附加项的字段 如 id, name等" }
  , link:         { type: String, description: "关联字段，缺省用 _id关联", default: "_id" }
};

var Sort = {
  key:            { type: String, description: "Schema的item" }
  , order:        { type: String, description: "desc asc" }
  , index:        { type: Number, description: "index" }
  , dynamic:      { type: String, description: "排序字段是否是通过参数动态指定的 fix: 静态 dynamic: 动态" }
};

var Group = {
  item:           { type: String, description: "Schema的item" }
  , operator:     { type: String, description: "$sum,$avg..." }
  , index:        { type: String, description: "index" }
};

var Advance = {
  before:         { type: String, description: "" }
  , after:        { type: String, description: "" }
  , next:         { type: String, description: "" }
};

var Board = {
    schema:       { type: String, description: "Schema名", required: true }
  //, api:          { type: String, description: "Board名", required: true  }

  , api:          { type: String, description: "路径, 唯一识别board", required: true, unique: true }
  , type:         { type: Number, description: "类别 1:添加 2:更新 3:删除 4:检索 5:全文检索 6:单项检索 7:获取件数 100:sys", default: 4 }
  , kind:         { type: Number, description: "类型 0:Normal 1:FREE 2:SYSTEM " }
  , path:         {description: "斜线开头 结尾无斜线的路径"}
  , class:        { type: String, description: "controller类名 逻辑处理用" }
  , action:       { type: String, description: "controller类的方法名 参数 [handler,callback] or [req, res]" }

  , filters:      [ Filter ]
  , selects:      [ Select ]
  , sorts:        [ Sort ]
  , groups:       [ Group ]
  , description:  { type: String, description: "描述" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};



---------------



var Group = {
    name:         { type: String, description: "组名" }
  , outer:        { type: String, description: "outer id"}
  , type:         { type: String, description: "类型, 1:部门（公司组织结构）, 2:组（自由创建）, 3:职位组" }
  , description:  { type: String, description: "描述" }
  , visible:      { type: String, description: "可见性, 1:私密，2:公开" }
  , parent:       { type: String, description: "父组标识" }
  , owners:       { type: Array,  description: "经理一览" }
  , sort:         { type: String, description: "排序" }
  , status:       { type: String, description: "状态" }
  , extend:       { type: Object, description: "扩展属性" }
  , valid:        { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,   description: "创建时间" }
  , createBy:     { type: String, description: "创建者" }
  , updateAt:     { type: Date,   description: "最终修改时间" }
  , updateBy:     { type: String, description: "最终修改者" }
};


/**
 * @desc 用户schema
 */
var User = {
    id:       { type: String, description: "用户标识"}
  , outer:    { type: String, description: "外部ID，用户导入时使用" }
  , name:     { type: String, description: "用户称" }
  , password: { type: String, description: "密码" }
  , type:     { type: Number, description: "用户类型" }
  , groups:   { type: Array,  description: "所属组一览" }
  , roles:    { type: Array,  description: "所属角色一览" }
  , email:    { type: String, description: "电子邮件地址" }
  , lang:     { type: String, description: "语言" }
  , timezone: { type: String, description: "时区" }
  , status:   { type: String, description: "状态" }
  , extend:   { type: Object, description: "扩展属性" }
  , valid:    { type: Number, description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt: { type: Date,   description: "创建时间" }
  , createBy: { type: String, description: "创建者" }
  , updateAt: { type: Date,   description: "最终修改时间" }
  , updateBy: { type: String, description: "最终修改者" }
};


var File = {
    fileId:       { type: ObjectID, description: "GridFS的ID", unique: true }
  , length:       { type: Number,   description: "文件大小" }
  , path:         { type: String,   description: "路径" }
  , name:         { type: String,   description: "文件名" }
  , category:     { type: String,   description: "文件分类" }
  , description:  { type: String,   description: "文件说明" }
  , contentType:  { type: String,   description: "文件类型" }
  , extend:       { type: Object,   description: "扩展属性" }
  , valid:        { type: Number,   description: "删除 0:无效 1:有效", default: constant.VALID }
  , createAt:     { type: Date,     description: "创建时间" }
  , createBy:     { type: String,   description: "创建者" }
  , updateAt:     { type: Date,     description: "更新时间" }
  , updateBy:     { type: String,   description: "更新者" }
};
