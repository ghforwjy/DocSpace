# ISSUE-013-文件内容与扩展名不匹配

## 问题基本信息

| 项目 | 内容 |
|------|------|
| 问题编号 | ISSUE-013 |
| 发现时间 | 2026-04-14 |
| 问题类型 | 文档服务配置/权限问题 |
| 问题状态 | 🔄 排查中 |

## 问题描述

### 错误信息
```
ONLYOFFICE Document Editor reports an error: code -85, description 打开文件时出错<br>文件内容与文件扩展名不匹配。
```

### 附加错误信息
```
此文档似乎是由较新版本的 ONLYOFFICE 文档编辑器创建的
```

## 🔴 重大发现

### DocumentServer 无法下载文件 - 返回 403 Forbidden

**测试命令**：
```bash
docker exec onlyoffice-document-server curl -v "http://onlyoffice-router:8092/FileHandler.ashx?action=stream&fileId=4&authKey=test"
```

**测试结果**：
```
HTTP/1.1 403 Forbidden
您没有权限执行此操作
```

**结论**：
- DocumentServer 访问 DocSpace 的 FileHandler 返回 **403 Forbidden**
- 错误信息是"您没有权限执行此操作"（认证失败）
- 而不是"文件内容与扩展名不匹配"

### 可能的原因分析

1. **JWT Token 无效或过期**
   - DocumentServer 收到的 JWT token 无法通过验证
   - 导致 FileHandler 拒绝下载请求

2. **authKey 无效**
   - FileHandler 的 authKey 参数用于验证请求
   - 如果 token/key 不匹配，返回 403

3. **权限传递问题**
   - DocSpace 传递给 DocumentServer 的文件下载 URL
   - DocumentServer 无法使用该 URL 下载文件

### 文件元数据检查 ✅

**数据库记录与物理文件完全一致**：

| fileId | 标题 | 数据库大小 | 物理文件大小 | 格式验证 |
|--------|------|------------|--------------|----------|
| 1 | ONLYOFFICE ????.pdf | 7663050 | 7663050 | PDF 1.7 ✅ |
| 4 | ONLYOFFICE ????.docx | 391555 | 391555 | Word 2007+ ✅ |
| 6 | ?????.xlsx | 6322 | 6322 | Excel 2007+ ✅ |

**结论**：数据库和物理文件完全一致，问题不在文件本身。

## 端到端测试方法 ✅

### 正确的访问 URL
```
http://43.135.17.107:8092/doceditor?fileId=4&action=edit
```

### 登录状态保持方法 ⚠️ 重要

```bash
# 1. 登录并保存状态
playwright-cli open http://43.135.17.107:8092/login
# 填写邮箱（元素引用 e27）
playwright-cli fill e27 "179537@qq.com"
# 填写密码（元素引用 e32）
playwright-cli fill e32 "Admin@123"
# 点击登录按钮（元素引用 e55）
playwright-cli click e55
# 等待登录完成
sleep 3
# 保存登录状态到文件
playwright-cli state-save docspace-login.json

# 2. 后续使用已保存的登录状态
# 打开浏览器
playwright-cli -s=docspace-login open http://43.135.17.107:8092/
# 加载登录状态文件（需要完整路径）
playwright-cli -s=docspace-login state-load /home/ubuntu/EasyDocs/docspace-login.json
# 导航到文档编辑器
playwright-cli -s=docspace-login goto http://43.135.17.107:8092/doceditor?fileId=4&action=edit

# 3. 检查结果
# 等待页面加载
sleep 15
# 截图保存
playwright-cli -s=docspace-login screenshot
# 查看控制台错误
playwright-cli -s=docspace-login console
```

### 测试账号
- 用户名：`179537@qq.com`
- 密码：`Admin@123`

## 当前配置

```json
{
  "docServiceUrlApi": "http://43.135.17.107:8092/ds-api/web-apps/apps/api/documents/api.js",
  "docServiceUrl": "http://43.135.17.107:8092/ds-api/",
  "docServiceUrlInternal": "http://onlyoffice-document-server:80/",
  "docServicePortalUrl": "http://onlyoffice-router:8092/",
  "docServiceSignatureHeader": "AuthorizationJwt",
  "docServiceSslVerification": false,
  "isDefault": false
}
```

## JWT 配置

**DocumentServer local.json**：
```json
"secret": {
  "browser": { "string": "DocSpace2024SecureJwtSecretKey123!" },
  "inbox": { "string": "DocSpace2024SecureJwtSecretKey123!" },
  "outbox": { "string": "DocSpace2024SecureJwtSecretKey123!" },
  "session": { "string": "DocSpace2024SecureJwtSecretKey123!" }
}
```

## 待排查

1. 检查 DocSpace 传递给 DocumentServer 的 JWT token 是否有效
2. 检查 FileHandler 的 authKey 验证逻辑
3. 检查 DocumentServer 下载文件的请求流程

## 排查时间线

| 时间 | 发现 |
|------|------|
| 08:40 | 首次发现错误，成功复现 |
| 11:40 | 更新排查记录，确认错误现象 |
| 11:50 | 检查存储文件内容 - 内容与扩展名匹配 ✅ |
| 12:00 | 用户确认所有文件都报错，包括新建的文件 |
| 12:10 | 发现 JWT 密钥不一致 |
| 12:30 | 用户确认配置页面保存时报错 |
| 12:35 | 澄清问题理解：连接正常但文件内容检测失败 |
| 12:45 | 读取当前配置，发现配置参数 |
| 12:50 | 确认正确测试 URL |
| 12:55 | 掌握登录状态保持方法 ✅ |
| 13:05 | 正确获取截图 - 确认错误仍存在 ❌ |
| **13:08** | **重大发现：DocumentServer 访问 FileHandler 返回 403 Forbidden** 🔴 |