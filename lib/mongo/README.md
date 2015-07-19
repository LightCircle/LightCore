
启用 Mongodb 密码校验
==============
让认证有效
----

## 数据库添加管理员用户, 赋予任何数据库的用户管理权限，赋予访问任何数据数据的权限
> use admin
> db.createUser({user: "admin", pwd: "admin", roles: [{role: "userAdminAnyDatabase", db: "admin"}]})
> db.grantRolesToUser("admin", [{ role: "readWriteAnyDatabase", db:"admin" }])

----
## 给指定的数据库添加用户
> use ChainStore
> db.createUser({user: "cstore", pwd: "cstore", roles: [{role: "readWrite", db: "ChainStore"}]})

> use LightDB
> db.createUser({user: "cstore", pwd: "cstore", roles: [{role: "readWrite", db: "LightDB"}]})

----
## mongod启动时，让用户验证有效，添加如下设定
security:
  authorization: enabled

----
## mongo客户端连接时，使用用户名密码
# mongo -u user -p pwd DBName
or
> use DBName
> db.auth("user", "pwd")

----
## 查看所有用户
> use admin
> db.system.users.find()

----
## 添加平台需要的数据库账户
> mongo --host 10.10.109.78 --port 57017 -u user -p password --authenticationDatabase=admin
> use admin
> db.createUser({user: "user",pwd: "password",roles: [{ role: "root", db: "admin" }]});

> use LightDB
> db.createUser({user: "user",pwd: "password",roles: [{ role: "readWrite", db: "LightDB" }]});

> use Fluentd
> db.createUser({user: "user",pwd: "password",roles: [{ role: "dbAdmin", db: "Fluentd" }]});

> use SampleDB
> db.createUser({user: "user",pwd: "password",roles: [{ role: "readWrite", db: "SampleDB" }]});

----
## 更新role
> db.getUser("sample")
> db.updateUser("sample", {"roles" : [{"role" : "dbOwner", "db" : "SampleApp"}]})

----
## 修改认证级别
> use admin
> var schema = db.system.version.findOne({"_id" : "authSchema"})
> schema.currentVersion = 3
> db.system.version.save(schema)
