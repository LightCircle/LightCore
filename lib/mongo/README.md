
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