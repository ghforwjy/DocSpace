# 01 - 认证 API

## 📍 服务信息

**服务模块**: 认证服务
**Controller**: `server/web/ASC.Web.Api/Api/AuthenticationController.cs`

---

## 🔐 API 接口列表

### 1. 检查认证状态
### 2. 用户登录
### 3. 通过代码认证用户
### 4. 注销登录
### 5. 打开确认邮件链接
### 6. 设置手机号
### 7. 发送短信验证码

---

## 1️⃣ 检查认证状态

**接口**: `GET /api/2.0/authentication`

**功能**: 检查当前用户是否已认证

**请求参数**: 无

**响应示例**:
```json
true
```

**调用示例 (JavaScript)**:
```javascript
async function checkAuth() {
  const response = await fetch('{baseUrl}/api/2.0/authentication', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include' // 重要：包含 Cookie
  });
  return await response.json();
}
```

---

## 2️⃣ 用户登录

**接口**: `POST /api/2.0/authentication`

**功能**: 使用用户名密码登录（支持多种认证方式）

**请求参数**:
```json
{
  "userName": "user@example.com",
  "password": "plain_password",
  "passwordHash": "hashed_password",
  "provider": "internal",
  "accessToken": "external_token",
  "serializedProfile": "profile_data",
  "code": "two_factor_code",
  "authCode": "oauth_code",
  "session": true,
  "recaptchaResponse": "captcha_solution",
  "recaptchaType": "type",
  "culture": "en-US"
}
```

**参数说明**:
| 参数 | 必填 | 说明 |
|-----|------|
| `userName` | 是 | 用户名或邮箱 |
| `password` | 否 | 明文密码 |
| `passwordHash` | 否 | 哈希密码（推荐使用 |
| `provider` | 否 | 认证提供商（internal, Google, Azure 等 |
| `session` | 否 | 是否为会话认证（true/false） |
| `culture` | 否 | 语言文化代码（如 en-US, zh-CN） |
| `recaptchaResponse | 否 | 验证码响应 |

**响应示例 (成功)**:
```json
{
  "token": "auth_token_here",
  "expires": "2026-05-23T12:00:00.000Z",
  "sms": false,
  "tfa": false
}
```

**响应示例 (需要 SMS 验证)**:
```json
{
  "sms": true,
  "phoneNoise": "+86 138****0000",
  "expires": "2026-04-23T13:00:00.000Z",
  "confirmUrl": "..."
}
```

**完整调用示例**:
```javascript
async function login(userName, password) {
  const response = await fetch('{baseUrl}/api/2.0/authentication', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'include', // 重要：保存 Cookie
    body: JSON.stringify({
      userName: userName,
      password: password,
      session: true
    })
  });

  const result = await response.json();
  
  if (response.status === 200) {
    if (result.sms) {
      // 需要短信验证
      console.log('请输入短信验证码');
    } else if (result.tfa) {
      // 需要双因素验证
      console.log('请输入两步验证代码');
    } else {
      // 登录成功
      console.log('登录成功', result);
    }
  } else {
    console.error('登录失败');
  }
}
```

---

## 3️⃣ 通过代码认证用户

**接口**: `POST /api/2.0/authentication/{code}`

**功能**: 使用 SMS 或双因素验证代码完成认证

**请求参数**:
```json
{
  "userName": "user@example.com",
  "password": "password",
  "code": "123456"
}
```

**响应示例**:
```json
{
  "token": "auth_token_here",
  "expires": "2026-05-23T12:00:00.000Z",
  "sms": true
}
```

---

## 4️⃣ 注销登录

**接口**: `POST /api/2.0/authentication/logout`

**功能**: 注销当前用户

**请求参数**: 无

**调用示例**:
```javascript
async function logout() {
  await fetch('{baseUrl}/api/2.0/authentication/logout', {
    method: 'POST',
    headers: {
      'Accept': 'application/json'
    },
    credentials: 'include'
  });
}
```

---

## 5️⃣ 打开确认邮件链接

**接口**: `POST /api/2.0/authentication/confirm`

**功能**: 验证邮件确认链接（如员工邀请、门户移除等）

**请求参数**:
```json
{
  "key": "confirmation_key",
  "email": "user@example.com",
  "type": "LinkInvite",
  "uiD": "ui_id"
}
```

**响应示例**:
```json
{
  "result": "Ok",
  "email": "user@example.com"
}
```

---

## 6️⃣ 设置手机号

**接口**: `POST /api/2.0/authentication/setphone`

**功能**: 设置用户手机号

**请求参数**:
```json
{
  "mobilePhone": "+8613800138000"
}
```

**响应示例**:
```json
{
  "sms": true,
  "phoneNoise": "+86 138****0000",
  "expires": "2026-04-23T13:00:00.000Z"
}
```

---

## 7️⃣ 发送短信验证码

**接口**: `POST /api/2.0/authentication/sendsms`

**功能**: 发送认证短信

**请求参数**:
```json
{
  "userName": "user@example.com",
  "password": "password"
}
```

**响应示例**:
```json
{
  "sms": true,
  "phoneNoise": "+86 138****0000",
  "expires": "2026-04-23T13:00:00.000Z"
}
```

---

## 📋 完整登录流程示例

### 标准登录流程（无验证）:
```javascript
// 1. 检查是否已登录
const isAuth = await checkAuth();
if (!isAuth) {
  // 2. 执行登录
  await login('user@example.com', 'password123');
}
```

### 需要短信验证流程:
```javascript
// 1. 初始登录
const loginResult = await login('user@example.com', 'password123');

if (loginResult.sms) {
  // 2. 如果需要 SMS 验证，提示用户输入验证码
  const smsCode = prompt('请输入短信验证码');
  
  // 3. 使用验证码完成认证
  await authenticateByCode('user@example.com', 'password123', smsCode);
}
```

### 密码哈希安全登录（推荐）:
```javascript
// 在客户端进行密码哈希（需要实现与服务器一致的哈希算法）
const passwordHash = hashPassword('password123');

// 使用哈希密码登录
await fetch('{baseUrl}/api/2.0/authentication', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    userName: 'user@example.com',
    passwordHash: passwordHash
  })
});
```

---

## 📝 注意事项

1. **会话管理**: 所有请求都需要 `credentials: 'include'` 来保持 Cookie
2. **密码安全**: 推荐使用 `passwordHash` 代替明文密码
3. **验证码处理**: 注意处理 SMS 和 TFA 的验证流程
4. **错误处理**: 适当处理 401（认证失败）和 429（尝试过多）
5. **文化设置**: 可以通过 `culture` 参数设置用户偏好的语言
