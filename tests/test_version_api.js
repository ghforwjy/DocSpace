/**
 * EasyDocs 文档版本管理 API 测试
 *
 * 通过 HTTP Web 接口模式测试
 *
 * API 入口：http://localhost:8092
 *
 * 测试环境：通过 Router 代理到 .NET 文件服务
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置
const BASE_URL = 'http://localhost:8092';
const API_BASE = `${BASE_URL}/api/2.0`;

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
            data: jsonData
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

// 检查认证状态
async function checkAuth() {
  console.log('检查认证状态...');
  try {
    const result = await request(`${API_BASE}/authentication`);
    return result.statusCode === 200 && result.data;
  } catch (e) {
    return false;
  }
}

// ========================================
// 测试场景 1: 获取文件版本列表
// ========================================

async function testGetFileVersionList(fileId) {
  console.log('\n📋 测试 1: 获取文件版本列表');
  try {
    const result = await request(`${API_BASE}/files/file/${fileId}/history`);

    if (result.statusCode === 200) {
      recordTest('获取文件版本列表', true, `获取成功，版本数量：${Array.isArray(result.data) ? result.data.length : '未知'}`, result.data);
      return result.data;
    } else {
      recordTest('获取文件版本列表', false, `失败状态码：${result.statusCode}`, result.data);
      return null;
    }
  } catch (e) {
    recordTest('获取文件版本列表', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 2: 合并版本历史
// ========================================

async function testMergeVersionHistory(fileId, version, continueVersion = true) {
  console.log('\n📋 测试 2: 合并版本历史');
  try {
    const result = await request(`${API_BASE}/files/file/${fileId}/history`, {
      method: 'PUT',
      body: {
        file: {
          version: version,
          continueVersion: continueVersion
        }
      }
    });

    if (result.statusCode === 200) {
      recordTest('合并版本历史', true, '合并成功', result.data);
      return result.data;
    } else {
      recordTest('合并版本历史', false, `失败状态码：${result.statusCode}`, result.data);
      return null;
    }
  } catch (e) {
    recordTest('合并版本历史', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 3: 恢复到指定版本
// ========================================

async function testRestoreVersion(fileId, version) {
  console.log('\n📋 测试 3: 恢复到指定版本');
  try {
    const result = await request(`${API_BASE}/files/file/${fileId}/restoreversion?version=${version}`, {
      method: 'POST'
    });

    if (result.statusCode === 200 || result.statusCode === 201) {
      recordTest('恢复到指定版本', true, '恢复成功', result.data);
      return result.data;
    } else {
      recordTest('恢复到指定版本', false, `失败状态码：${result.statusCode}`, result.data);
      return null;
    }
  } catch (e) {
    recordTest('恢复到指定版本', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 4: 获取编辑历史
// ========================================

async function testGetEditHistory(fileId) {
  console.log('\n📋 测试 4: 获取编辑历史');
  try {
    const result = await request(`${API_BASE}/files/file/${fileId}/edit/history`);

    if (result.statusCode === 200) {
      recordTest('获取编辑历史', true, '获取成功', result.data);
      return result.data;
    } else {
      recordTest('获取编辑历史', false, `失败状态码：${result.statusCode}`, result.data);
      return null;
    }
  } catch (e) {
    recordTest('获取编辑历史', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 5: 获取版本差异 URL
// ========================================

async function testGetEditDiffUrl(fileId, version) {
  console.log('\n📋 测试 5: 获取版本差异 URL');
  try {
    const result = await request(`${API_BASE}/files/file/${fileId}/edit/diff?version=${version}`);

    if (result.statusCode === 200) {
      recordTest('获取版本差异 URL', true, '获取成功', result.data);
      return result.data;
    } else {
      recordTest('获取版本差异 URL', false, `失败状态码：${result.statusCode}`, result.data);
      return null;
    }
  } catch (e) {
    recordTest('获取版本差异 URL', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 6: 更新版本注释
// ========================================

async function testUpdateVersionComment(fileId, version, comment) {
  console.log('\n📋 测试 6: 更新版本注释');
  try {
    const result = await request(`${API_BASE}/files/file/${fileId}/comment`, {
      method: 'PUT',
      body: {
        file: {
          version: version,
          comment: comment
        }
      }
    });

    if (result.statusCode === 200) {
      recordTest('更新版本注释', true, '更新成功', result.data);
      return result.data;
    } else {
      recordTest('更新版本注释', false, `失败状态码：${result.statusCode}`, result.data);
      return null;
    }
  } catch (e) {
    recordTest('更新版本注释', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 7: 获取指定版本文件信息
// ========================================

async function testGetFileInfoWithVersion(fileId, version) {
  console.log('\n📋 测试 7: 获取指定版本文件信息');
  try {
    const result = await request(`${API_BASE}/files/file/${fileId}?version=${version}`);

    if (result.statusCode === 200) {
      recordTest('获取指定版本文件信息', true, '获取成功', result.data);
      return result.data;
    } else {
      recordTest('获取指定版本文件信息', false, `失败状态码：${result.statusCode}`, result.data);
      return null;
    }
  } catch (e) {
    recordTest('获取指定版本文件信息', false, e.message);
    return null;
  }
}

// ========================================
// 测试场景 8: 获取文件操作历史
// ========================================

async function testGetFileOperationHistory(fileId) {
  console.log('\n📋 测试 8: 获取文件操作历史');
  try {
    const result = await request(`${API_BASE}/files/file/${fileId}/log`);

    if (result.statusCode === 200) {
      recordTest('获取文件操作历史', true, '获取成功', result.data);
      return result.data;
    } else {
      recordTest('获取文件操作历史', false, `失败状态码：${result.statusCode}`, result.data);
      return null;
    }
  } catch (e) {
    recordTest('获取文件操作历史', false, e.message);
    return null;
  }
}

// ========================================
// 辅助：创建测试文件
// ========================================

async function createTestFile(folderId, title) {
  console.log(`\n📁 创建测试文件：${title}`);
  try {
    const result = await request(`${API_BASE}/files/${folderId}/file`, {
      method: 'POST',
      body: {
        file: {
          title: title
        }
      }
    });

    if (result.statusCode === 200 || result.statusCode === 201) {
      console.log('✅ 文件创建成功！');
      return result.data;
    } else {
      console.log('❌ 文件创建失败！', result.statusCode);
      return null;
    }
  } catch (e) {
    console.error('❌ 创建文件出错：', e.message);
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
  console.log('║     EasyDocs 文档版本管理 API 测试     ║');
  console.log('║                                      ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('\n');
  console.log(`API 入口：${API_BASE}`);
  console.log('='.repeat(50));
  console.log('\n');

  // 1. 首先检查 API 连通性
  console.log('1️⃣ 检查 API 连通性...');
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

  // 2. 检查认证状态
  console.log('\n2️⃣ 检查用户认证...');
  const isAuth = await checkAuth();

  if (!isAuth) {
    console.log('⚠️ 用户未登录，部分测试需要认证');
  } else {
    console.log('✅ 用户已登录');
  }

  // 3. 获取根目录
  console.log('\n3️⃣ 获取根目录内容...');
  let testFileId = null;
  try {
    const root = await request(`${API_BASE}/files/0`);
    if (root.statusCode === 200 && root.data) {
      console.log('✅ 根目录获取成功');

      const folders = root.data.folders || [];
      const files = root.data.files || [];

      if (files.length > 0) {
        testFileId = files[0].id;
        console.log(`📄 找到测试文件：${files[0].title}`);
      } else {
        console.log('根目录无文件，尝试创建测试文件...');
        if (isAuth) {
          const newFile = await createTestFile(0, '版本测试文档.docx');
          if (newFile && newFile.id) {
            testFileId = newFile.id;
          }
        }
      }
    }
  } catch (e) {
    console.log('⚠️ 获取根目录失败：', e.message);
  }

  // 4. 运行所有版本管理测试
  if (testFileId) {
    console.log(`\n4️⃣ 开始测试，测试文件 ID：${testFileId}`);

    const versions = await testGetFileVersionList(testFileId);
    await testGetEditHistory(testFileId);
    await testGetFileOperationHistory(testFileId);

    if (versions && versions.length >= 2) {
      const firstVersion = versions[versions.length - 1].version;
      const latestVersion = versions[0].version;

      await testGetFileInfoWithVersion(testFileId, firstVersion);
      await testGetEditDiffUrl(testFileId, firstVersion);
      await testMergeVersionHistory(testFileId, firstVersion, true);
      await testUpdateVersionComment(testFileId, latestVersion, '测试版本注释');
      await testRestoreVersion(testFileId, firstVersion);
    } else {
      console.log('\n⚠️ 提示：文件只有一个版本，部分测试跳过');
    }
  } else {
    console.log('\n⚠️ 无法找到测试文件！');
  }

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
    console.log(`${index + 1}. ${test.name}: ${test.success ? '✅' : '❌'} ${test.message || ''}`);
  });

  const reportPath = path.join(__dirname, 'test_version_api_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log('\n📄 测试报告已保存到:', reportPath);
}

// 运行主测试
runCompleteTest().catch(console.error);

module.exports = {
  request,
  checkAuth,
  testFileVersionManagementTest: runCompleteTest
};
