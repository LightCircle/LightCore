
## 功能
#### 定义structure以后，自动生成一套固定API，
#### 无需编码（ROUTE，api层ctrl层等）即可利用这些API进行缺省的数据存储。
#### 如需扩展，或改变默认行为，可通过自定义ctrl进行。或，完全自定义api

#### Exp.
if define a message structure. then default api is:

 - GET     /message      调用datastore的getList方法
 - GET     /message/:id  调用datastore的get方法
 - PUT     /message/:id  调用datastore的update方法
 - POST    /message      调用datastore的add方法
 - DELETE  /message/:id  调用datastore的remove方法

 - 确认：message是否使用复数形？

## 判断是否需要调用用户定义的ctrl
#### 有ctrl
加载用户目录下的CTRL，加载成功且有对应的方法，则调用该方法

#### 无ctrl
直接调用datastore的方法

## GET方法时，区分get，getList，getOne的方法
缺省，一个board对应一个ctrl的方法
如果指定了board，则优先调用对应的方法。

 - GET方法的请求URL分三种
    /prefix/schema/:id
    /prefix/schema
    /prefix/schema?board=getOne

 - board被指定，则调用board的方法
 - 将URL以/进行分割，最后一个与schema相同，则认为是getList
 - 否则，视为去单个对象

## 支持的Method
 - GET
 - POST
 - PUT
 - DELETE
 - PATCH

[HTTP的Method日文说明文档](http://www.studyinghttp.net/method)

## DataStore给出的方法
 - get
 - getList
 - getOne
 - update
 - upsert
 - remove
 - add

## 限制
该dispatcher只是针对api，不对website做自动dispatch

## 扩张方法
对应board里自由定义的key

## TODO: API允许的开关画面
## TODO: 文件，tag，category，等的缺省API的支持

