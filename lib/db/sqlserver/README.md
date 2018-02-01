## DataRider的处理流程
====
1. 拷贝参数（防止修改用户的参数值）
2. 根据环境变量中的连接信息，觉得使用哪种数据库
3. 处理script（即，mongo的free）
4. 如果指定了id参数，就将id参数转存到condition中（handler.params.id）

- 根据board的数据类型，转换参数值

5. 处理条件
 - 5.1 如果指定了free，尝试解析针对mongo写的free条件（能解析的条件有限）
 - 5.2 根据board的条件定义，生成SQL中的where条件（过滤掉没有指定值的条件 handler.params.data里没有值的条件）

6. 处理选择项目
 - 6.1 优先hanadler.params.select内容
 - 6.2 尝试使用board里定义的select内容

7. 处理排序项目
 - 7.1 优先handler.params.sort内容
 - 7.2 尝试使用board里定义的sort内容

8. 如果表有parent，添加condition.type和data.type值

9. 生成SELECT，INSERT，UPDATE，DELETE语句
 - 9.1 select需要添加offset和fetch next
 - 9.2 insert需要添加固定项目 _id,createAt,createBy,updateAt,updateBy,valid

10. 获取Option的内容

## 参数值的处理
====

#### 条件参数转换格式

- 为了使用数据库定义类型对参数进行转换，要把参数名称转换成数据库字段名称
  {ids: [1, 2]} => {_id: [1, 2]}

- 设定缺省值
- 数据参数转换格式

- 对free条件的值，不进行类型转换

