# 问题排查记录表

## 问题基本信息

| 项目 | 内容 |
|------|------|
| 问题编号 | ISSUE-014 |
| 发现时间 | 2026-04-15 |
| 问题类型 | SMTP配置问题 |
| 问题状态 | 🔍 排查中 |

## 问题描述

### 问题现象
- SMTP设置页面配置163邮箱后，点击"发送测试邮件"按钮无响应
- 测试邮件请求持续轮询状态，但无最终结果
- 保存按钮在填写密码后可点击，但保存后刷新页面密码为空

### 涉及页面
- URL: http://43.135.17.107:8092/portal-settings/integration/smtp-settings
- 测试账号: 179537@qq.com / Admin@123
- SMTP配置: smtp.163.com:25, 18665696590@163.com, 密码: Xiaoxiao2010?

## 代码分析

### SMTP设置前端逻辑

#### 关键文件
1. `client/packages/client/src/pages/PortalSettings/categories/integration/SMTPSettings/index.js` - 主组件
2. `client/packages/client/src/pages/PortalSettings/categories/integration/SMTPSettings/sub-components/CustomSettings.js` - 配置表单
3. `client/packages/client/src/pages/PortalSettings/categories/integration/SMTPSettings/sub-components/ButtonContainer.js` - 按钮操作
4. `client/packages/shared/api/settings/index.ts` - API调用

#### API端点
```javascript
// 保存SMTP设置
POST /api/2.0/smtpsettings/smtp
// 获取SMTP设置
GET /api/2.0/smtpsettings/smtp
// 发送测试邮件
GET /api/2.0/smtpsettings/smtp/test
// 获取测试状态
GET /api/2.0/smtpsettings/smtp/test/status
```

#### 后端关键文件
- `server/web/ASC.Web.Api/Api/SmtpSettingsController.cs` - API控制器
- `server/web/ASC.Web.Api/Core/SmtpJob.cs` - 邮件发送任务

## 排查过程记录

### 阶段1：端到端测试

| 步骤 | 操作 | 结果 |
|------|------|------|
| 1.1 | 登录系统 (179537@qq.com/Admin@123) | ✅ 登录成功 |
| 1.2 | 访问SMTP设置页面 | ✅ 页面加载成功 |
| 1.3 | 填写SMTP密码 | ✅ 密码字段可编辑 |
| 1.4 | 点击保存按钮 | ⚠️ 保存请求返回200但刷新后密码为空 |
| 1.5 | 点击发送测试邮件 | 🔄 请求持续轮询，无最终结果 |

## 网络连接测试结果

| 测试项 | 目标 | 端口 | 结果 |
|--------|------|------|------|
| 2.1 | smtp.163.com | 25 | ❌ Connection timed out（云服务器被封禁） |
| 2.2 | smtp.163.com | 465 | ✅ Connection succeeded |
| 2.3 | smtp.163.com | 587 | ✅ Connection succeeded |

**结论**：
- 云服务器到163邮箱的25端口被云服务商封禁
- 465端口（SMTPS）和587端口（Submission）均可用
- **推荐使用587端口**替代25端口

## 根因分析

### 测试结果汇总

| 端口 | SSL类型 | 网络连接 | SMTP响应 |
|------|---------|----------|----------|
| 25 | 无 | ❌ 超时 | 无法连接 |
| 465 | SSL/SMTPS | ✅ 成功 | ❌ 535 authentication failed |
| 587 | STARTTLS | ❌ 失败 | 无法建立连接 |

### R1: 25端口被封禁
云服务商封禁了出向25端口。

### R2: 587端口STARTTLS失败
163邮箱587端口不支持STARTTLS协议。

### R3: 465端口认证失败
**当前发现**：使用465端口时报 `535: Error: authentication failed`

可能原因：
1. 密码错误（163邮箱需要**授权码**而非登录密码）
2. 需要检查163邮箱的SMTP授权码设置

## 解决方案

### 方案：修改SMTP端口配置

将DocSpace的SMTP配置从端口25改为587（587端口可用）：

| 配置项 | 当前值 | 修改为 |
|--------|--------|--------|
| 主机 | smtp.163.com | smtp.163.com（不变） |
| 端口 | 25 | **587** |
| 启用SSL | 是 | 是（不变） |

## 待验证项

- [x] 检查25端口网络连通性 - ❌ 超时
- [x] 检查465端口网络连通性 - ✅ 成功
- [x] 检查587端口网络连通性 - ✅ 成功
- [x] 修改端口为587后测试邮件发送 - ✅ 成功！
- [x] 验证密码保存功能 - ✅ 成功！

## 验证结果

### 端到端测试（端口改为587）

| 步骤 | 操作 | 结果 |
|------|------|------|
| 1 | 修改端口从25改为587 | ✅ |
| 2 | 填写密码 Xiaoxiao2010? | ✅ |
| 3 | 点击保存按钮 | ✅ |
| 4 | 页面刷新验证配置保持 | ✅ 端口587，密码保持显示 |
| 5 | 点击发送测试邮件 | ✅ |
| 6 | 查看结果 | ✅ "测试邮件已成功发送至 179537@qq.com" |

**截图证据**: [.playwright-cli/page-2026-04-15T16-22-20-241Z.png](file:///home/ubuntu/EasyDocs/DocSpace/.playwright-cli/page-2026-04-15T16-22-20-241Z.png)

## 排查日志

- 2026-04-15 15:50 - 登录成功，进入SMTP设置页面
- 2026-04-15 15:55 - 填写密码并保存，刷新后密码为空
- 2026-04-15 15:59 - 点击发送测试邮件，按钮显示loading但无结果
- 2026-04-15 16:10 - 检查后端服务日志，未发现明显错误
- 2026-04-15 16:15 - 测试网络连接：smtp.163.com:25 超时，smtp.163.com:465/587 成功
- 2026-04-15 16:20 - **根因确定：云服务器25端口被封禁，改用587端口**
- 2026-04-15 16:22 - **端到端验证通过：587端口发送测试邮件成功！**
