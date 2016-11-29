
## 收集测试覆盖率的方法
- 安装istanbul
  $ sudo npm install -g istanbul

- 安装mocha
  $ sudo npm install -g mocha

- 执行单元测试
  $ mocha
  注: mocha默认会执行test目录下的 test_xxx.js 测试代码（不包含子文件夹）

- 执行单元测试, 并且搜集覆盖率
  $ istanbul cover _mocha
  注: 覆盖率结果在工程的 coverage 目录下 /coverage/lcov-report/index.html
