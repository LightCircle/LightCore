LightCore
==============

## 平台主页
http://light.starwall.org

### 平台特点

#### 快速开发
* 轻量级开发语言，只需Javascript实现前后端快速开发。
系统自带用户，组织，分类，文件等八大共通模块，快速实现业务需求。
Web，iOS，Android三方SDK，降低学习成本，减少繁琐调试，快速上手。

#### 智能维护
* 一键化快速部署，可视化的应用运行控制，让服务器“看得见 摸得着”。
一键启动自动化监视，便可实时搜集数据，实时统计后图形化展示。
设置定时任务，添加预警条件，发生任何问题时及时智能预警。

#### 灵活扩展
* 全方位支持非关系型数据库，具备大数据存储和处理能力。
自由扩展数据结构，画面点击实现数据和接口设计，让数据库“没有束缚”。
强大的连接器(ETL)实现企业内部系统对接，实现统一化信息管理。

### LIGHT平台致力于为开发者提供五大价值：
* 基于Nodejs语言，前后端统一语言，实现快速开发
* 对应用生命周期全过程的管理，从数据设计到部署上线运维全程支持
* 手机端iOS, Android移动应用开发支持 （Native or Highbridge）
* DevOps理念设计，实现运维的自动化和可视化
* 通用企业应用模块提供，同时支持流行元素 （微信应用，移动支付等）

### 依赖
#### Microsoft Sqlserver支持
- tedious                   - sqlserver驱动
- tedious-connection-pool   - 连接池
- connect-tedious           - 基于 sqlserver 的session store实现

#### MySQL支持
- mysql                     - mysql驱动
- express-mysql-session     - 基于 mysql 的session store实现

#### MongoDB支持
- mongodb
- connect-mongo

#### Oracle支持
- oracle
- generic-pool

#### 通用工具
- lodash                    - js语言扩展
- moment                    - 日期处理
- moment-timezone           - 时区处理
- request                   - 网络请求
- async                     - 异步逻辑处理
- js-yaml                   - yaml文件处理
- uuid                      -

#### Web框架
- express
- ejs
- csurf
- cookie
- multiparty
