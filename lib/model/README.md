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

