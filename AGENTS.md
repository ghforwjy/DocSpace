# Agent 配置

## 概述

本项目使用 Trae IDE 进行开发，Agent 配置说明。

## 项目仓库

DocSpace 项目采用 Git 子模块结构：

- 主仓库：<https://github.com/ghforwjy/DocSpace>
- 子模块：server、client、buildtools（作为独立 Git 子模块管理）、DocumentServer(作为源码，便于分析，实际启动docker使用的本项目内目录：Docker-DocumentServer)
- 目前全部使用dev分支

## 目录结构

```
EasyDocs/
├── AGENTS.md           # 本文件（项目级规则）
├── DocSpace/           # 文档协作平台
│   ├── buildtools/     # 构建工具（Git 子模块）
│   ├── client/         # 前端代码（Git 子模块）
│   ├── server/         # 后端代码（Git 子模块）
│   └── docs/          # 文档
├── easyproxy/          # 代理服务
└── .trae/             # Trae 项目配置
    ├── rules/          # 项目规则
    └── skills/         # 项目技能
```

## 相关资源

- Trae IDE 环境说明：`/home/ubuntu/EasyDocs/trae环境说明.md`
- noVNC sudo 修复脚本：`/home/ubuntu/EasyDocs/fix_sudo.sh`
- 命名执行用sudo增加权限

## Trae Skills

| 类型   | 路径                     | 说明      |
| ---- | ---------------------- | ------- |
| 全局技能 | `~/.trae-cn/skills/`   | 所有项目可用  |
| 项目技能 | `<项目目录>/.trae/skills/` | 仅当前项目有效 |

当前已部署技能：

- **skill-creator** - 创建、改进和测试技能的技能

## 项目文档

| 项目                  | 文档目录                   | 入口文档                                                           |
| ------------------- | ---------------------- | -------------------------------------------------------------- |
| DocSpace            | `DocSpace/docs/`       | `DocSpace/README.md`                                           |
| DocSpace client     | `DocSpace/client/`     | `DocSpace/client/README.md`                                    |
| DocSpace buildtools | `DocSpace/buildtools/` | `DocSpace/buildtools/install/docker/Readme.md`                 |
| DocSpace server     | `DocSpace/server/`     | `DocSpace/server/products/ASC.Files/Server/DocStore/README.md` |

## 服务部署

部署完成后访问地址：

- DocSpace 主入口：<http://localhost:8092>
- API 入口：<http://localhost:8081>
- 按照集群模式部署

需开放端口：8092, 8081

## Git 提交流规则

**必须上传的内容**：
- 所有代码变更
- 所有文档（包含 `.claude/` 技能目录）
- 所有问题排查记录（位于 `DocSpace/docs/问题排查记录/`）

**禁止上传的临时文件**：
- `.playwright-cli/` - Playwright 测试会话记录
- `auth.json` - 认证数据文件
- 任何缓存文件

**每次提交前**：确认包含所有必要文件，排除临时文件后再推送。

## 问题排查流程

**规则**：发现问题 → 记录 → 解决 → 验证（必须重新测试）→ 关闭。禁止假设修复有效。要用playwright-cli端到端测试。

核心要求：每次有确认的新发现就要做如下动作：阅读问题排查记录，更新最新进展到记录文件，记录新的线索，并回顾和梳理问题排查逻辑，从而有理有据的制定下一步排查计划。

**记录位置**：`DocSpace/docs/问题排查记录/ISSUE-序号-问题简述.md`

**序号**：三位数字，如 `001`

**主索引**：`DocSpace/docs/问题排查清单.md`（跟踪所有问题状态）

**测试命令示例**：

```bash
playwright-cli open <URL>
playwright-cli console       # 控制台错误
playwright-cli screenshot    # 截图
```

## Playwright-cli 登录状态管理

### 登录并保存状态

```bash
# 1. 打开登录页面
playwright-cli open http://43.135.17.107:8092/login

# 2. 填写凭据（用 playwright-cli state 查看元素引用）
playwright-cli fill e27 "179537@qq.com"    # 用户名
playwright-cli fill e32 "Admin@123"        # 密码
playwright-cli click e55                    # 点击登录

# 3. 保存登录状态
sleep 3
playwright-cli state-save docspace-login.json
playwright-cli close
```

### 恢复登录状态访问受保护页面

```bash
# 1. 恢复状态并打开登录页
playwright-cli open http://43.135.17.107:8092/login
playwright-cli state-load docspace-login.json

# 2. 用 goto 导航（保持登录状态）
playwright-cli goto http://43.135.17.107:8092/doceditor?fileId=2
sleep 5
playwright-cli screenshot
```

**关键**：`goto` 在当前页面导航保持登录，`open` 开新页面会丢失状态。

**登录凭据**：用户名 `179537@qq.com`，密码 `Admin@123`

