/**
 * EasyDocs 用户管理 API 测试
 *
 * 通过 HTTP Web 接口模式测试
 *
 * API 入口：http://localhost:8092
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置
const BASE_URL = 'http://localhost:8092';
const API_BASE = `${BASE_URL}/api/2.0`;

// 测试凭证
const TEST_USER = {
  email: '179537@qq.com',
  password: 'Admin@123'
};

// 测试结果存储
const testResults = [];
let cookies = '';

// 辅助函数：发送 HTTP 请求
async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const defaultOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (cookies) {
      defaultOptions.headers.Cookie = cookies;
    }

    const reqOptions = { ...defaultOptions, ...options };

    const req = client.request(reqOptions, (res) => {
      let data = '';

      if (res.headers['set-cookie']) {
        cookies = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 记录测试结果
function recordTest(name, success, message, data) {
  testResults.push({ name, success, message, data });
  console.log(`\n========================================`);
  console.log(success ? '✅' : '❌', name);
  if (message) console.log(message);
  console.log(`========================================\n`);
}

// 登录获取认证
async function login(email, password) {
  console.log('\n🔐 用户登录...');
  try {
    const result = await request(`${API_BASE}/authentication/`, {
      method: 'POST',
      body: {
        userName: email,
        password: password,
        session: true
      }
    });

    if (result.statusCode === 200) {
      console.log('✅ 登录成功！');
      return true;
    } else {
      console.log('❌ 登录失败！', result.statusCode, result.data);
      return false;
    }
  } catch (e) {
    console.error('❌ 登录出错：', e.message);
    return false;
  }
}

// ========================================
// 测试场景 1: 获取当前用户信息
// ========================================

async function testGetCurrentUser() {
  console.log('\n📋 测试 1: 获取当前用户信息');
  try {
    const result = await request(`${API_BASE}/people/@self`);

    if (result.statusCode === 200) {
      const user = result.data.response || result.data;
      recordTest('获取当前用户信息', true,
        `用户: ${user.displayName}, Email: ${user.email}, IsAdmin: ${user.isAdmin}`,
        user
      );
      return user;
    } else {
      recordTest('获取当前用户信息', false,
        `失败状态码：${result.statusCode}`,
        result.data
      );
      return null;
    }
  } catch (e) {
    recordTest('获取当前用户信息', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 2: 获取用户列表
// ========================================

async function testGetUserList() {
  console.log('\n📋 测试 2: 获取用户列表');
  try {
    const result = await request(`${API_BASE}/people`);

    if (result.statusCode === 200) {
      const data = result.data;
      const users = data.response || data;
      const items = users.items || users;
      recordTest('获取用户列表', true,
        `总用户数: ${users.total || '未知'}, 本页: ${items.length || 0}`,
        users
      );
      return users;
    } else {
      recordTest('获取用户列表', false,
        `失败状态码：${result.statusCode}`,
        result.data
      );
      return null;
    }
  } catch (e) {
    recordTest('获取用户列表', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 3: 按邮箱获取用户
// ========================================

async function testGetUserByEmail(email) {
  console.log('\n📋 测试 3: 按邮箱获取用户');
  try {
    const result = await request(`${API_BASE}/people/email?email=${encodeURIComponent(email)}`);

    if (result.statusCode === 200) {
      const user = result.data.response || result.data;
      recordTest('按邮箱获取用户', true,
        `找到用户: ${user.displayName}`,
        user
      );
      return user;
    } else {
      recordTest('按邮箱获取用户', false,
        `失败状态码：${result.statusCode}`,
        result.data
      );
      return null;
    }
  } catch (e) {
    recordTest('按邮箱获取用户', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 4: 获取用户信息（通过 ID）
// ========================================

async function testGetUserById(userId) {
  console.log('\n📋 测试 4: 获取用户信息（通过 ID）');
  try {
    const result = await request(`${API_BASE}/people/${userId}`);

    if (result.statusCode === 200) {
      const user = result.data.response || result.data;
      recordTest('获取用户信息', true,
        `找到用户: ${user.displayName}`,
        user
      );
      return user;
    } else {
      recordTest('获取用户信息', false,
        `失败状态码：${result.statusCode}`,
        result.data
      );
      return null;
    }
  } catch (e) {
    recordTest('获取用户信息', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 5: 获取用户头像
// ========================================

async function testGetUserPhoto(userId) {
  console.log('\n📋 测试 5: 获取用户头像');
  try {
    const result = await request(`${API_BASE}/people/${userId}/photo`);

    if (result.statusCode === 200 || result.statusCode === 302) {
      recordTest('获取用户头像', true,
        `状态码：${result.statusCode}`,
        result.headers['content-type']
      );
      return true;
    } else {
      recordTest('获取用户头像', false,
        `失败状态码：${result.statusCode}`,
        result.data
      );
      return false;
    }
  } catch (e) {
    recordTest('获取用户头像', false, e.message);
    return false;
  }
}

// ========================================
// 测试场景 6: 获取管理员列表
// ========================================

async function testGetAdmins() {
  console.log('\n📋 测试 6: 获取管理员列表');
  try {
    const result = await request(`${API_BASE}/people/filter?isadministrator=true`);

    if (result.statusCode === 200) {
      const data = result.data;
      const users = data.response || data;
      const items = users.items || users;
      recordTest('获取管理员列表', true,
        `管理员数量: ${items.length || 0}`,
        users
      );
      return users;
    } else {
      recordTest('获取管理员列表', false,
        `失败状态码：${result.statusCode}`,
        result.data
      );
      return null;
    }
  } catch (e) {
    recordTest('获取管理员列表', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 7: 用户搜索
// ========================================

async function testSearchUsers(keyword) {
  console.log(`\n📋 测试 7: 用户搜索 - "${keyword}"`);
  try {
    const result = await request(`${API_BASE}/people?search=${encodeURIComponent(keyword)}`);

    if (result.statusCode === 200) {
      const data = result.data;
      const users = data.response || data;
      const items = users.items || users;
      recordTest('用户搜索', true,
        `找到 ${items.length || 0} 个用户`,
        users
      );
      return users;
    } else {
      recordTest('用户搜索', false,
        `失败状态码：${result.statusCode}`,
        result.data
      );
      return null;
    }
  } catch (e) {
    recordTest('用户搜索', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 8: 用户分页
// ========================================

async function testUserPagination() {
  console.log('\n📋 测试 8: 用户分页');
  try {
    const result = await request(`${API_BASE}/people?startIndex=0&count=2`);

    if (result.statusCode === 200) {
      const data = result.data;
      const users = data.response || data;
      const items = users.items || users;
      recordTest('用户分页', true,
        `第1页，每页${items.length || 0}条，总计${users.total || 0}条`,
        users
      );
      return users;
    } else {
      recordTest('用户分页', false,
        `失败状态码：${result.statusCode}`,
        result.data
      );
      return null;
    }
  } catch (e) {
    recordTest('用户分页', false, e.message);
    return null;
  }
}

// ========================================
// 完整测试流程
// ========================================

async function runCompleteTest() {
  console.log('\n');
  console.log('╔══════════════════════════════════════╗');
  console.log('║                                      ║');
  console.log('║     EasyDocs 用户管理 API 测试         ║');
  console.log('║                                      ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('\n');
  console.log(`API 入口：${API_BASE}`);
  console.log('='.repeat(50));

  // 1. 首先检查 API 连通性
  console.log('\n1️⃣ 检查 API 连通性...');
  try {
    const result = await request(`${API_BASE}/settings/colortheme`);
    if (result.statusCode === 200) {
      console.log('✅ API 连接成功！');
    } else {
      console.log('⚠️ API 响应状态码：', result.statusCode);
    }
  } catch (e) {
    console.log('❌ API 连接失败：', e.message);
    return;
  }

  // 2. 登录认证
  console.log('\n2️⃣ 用户登录认证...');
  const isAuth = await login(TEST_USER.email, TEST_USER.password);

  if (!isAuth) {
    console.log('❌ 登录失败，无法继续测试！');
    printTestReport();
    return;
  }

  // 3. 执行用户管理测试
  console.log('\n3️⃣ 执行用户管理 API 测试...\n');

  // 测试 1: 获取当前用户信息
  const currentUser = await testGetCurrentUser();

  // 测试 2: 获取用户列表
  await testGetUserList();

  // 测试 3: 获取管理员列表
  await testGetAdmins();

  // 测试 4-6: 基于当前用户信息进行测试
  if (currentUser && currentUser.id) {
    // 测试 4: 获取用户头像
    await testGetUserPhoto(currentUser.id);

    // 测试 5: 按邮箱获取用户
    await testGetUserByEmail(TEST_USER.email);

    // 测试 6: 通过 ID 获取用户
    await testGetUserById(currentUser.id);
  }

  // 测试 7: 用户搜索
  await testSearchUsers('admin');
  await testSearchUsers('Administrator');

  // 测试 8: 用户分页
  await testUserPagination();

  // 输出测试报告
  printTestReport();
}

// 打印测试报告
function printTestReport() {
  console.log('\n');
  console.log('╔══════════════════════════════════════╗');
  console.log('║         测试报告总结                    ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('\n');

  const totalTests = testResults.length;
  const successTests = testResults.filter(t => t.success).length;
  const failTests = testResults.filter(t => !t.success).length;

  console.log(`总测试数： ${totalTests}`);
  console.log(`✅ 成功： ${successTests}`);
  console.log(`❌ 失败： ${failTests}`);
  console.log('\n');

  console.log('测试详情：\n');
  testResults.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.name}: ${test.message || ''}`);
  });

  const reportPath = path.join(__dirname, 'test_user_api_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log('\n📄 测试报告已保存到:', reportPath);
}

// 运行主测试
runCompleteTest().catch(console.error);

module.exports = {
  request,
  login,
  testUserManagementAPI: runCompleteTest
};
