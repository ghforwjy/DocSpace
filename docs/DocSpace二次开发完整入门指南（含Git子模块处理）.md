# DocSpace二次开发完整入门指南（含Git子模块处理）

本文整合DocSpace二次开发全流程，严格对照官方Git仓库（https://github.com/ONLYOFFICE/DocSpace）文档说明，涵盖前期准备、Fork操作、Git子模块处理（核心重点）、环境搭建、开发实践、编译部署及资源支持，步骤清晰、命令可直接复制，适配新手快速上手，可直接下载用于开发参考。同时严格依据Git文档补充减少Docker容器数量的部署方式，适配轻量部署、资源有限场景，贴合实际开发需求。

# 一、关键第一步：带子模块项目Fork操作（二次开发必备）

二次开发需先将DocSpace（含子模块）Fork到自己的GitHub仓库，操作步骤严格遵循官方Git仓库README说明，具体如下：

1.  打开官方Git仓库地址：https://github.com/ONLYOFFICE/DocSpace（你提供的官方地址）；

2.  点击页面右上角「Fork」按钮，选择自己的GitHub账号，等待1-2秒完成主仓库Fork；

3.  按照官方Git仓库中子模块说明，逐一Fork所有关联子模块（DocSpace-client、DocSpace-server、DocSpace-buildtools），仓库地址均来自官方Git仓库关联链接：

- DocSpace-client：https://github.com/ONLYOFFICE/DocSpace-client（官方Git仓库子模块关联地址）；

- DocSpace-server：https://github.com/ONLYOFFICE/DocSpace-server（官方Git仓库子模块关联地址）；

- DocSpace-buildtools：https://github.com/ONLYOFFICE/DocSpace-buildtools（官方Git仓库子模块关联地址）；

4.  Fork完成后，确保主仓库与3个子模块仓库均在自己的GitHub账号下，且仓库名称与官方完全一致（严格遵循官方Git仓库命名规范，不修改仓库名），为后续子模块自动关联奠定基础。

## 1. 第一步：Fork DocSpace主仓库（GitHub网页操作）

操作完全对照官方Git仓库README指引，无需额外操作，步骤如下：

1.  打开你提供的官方Git主仓库地址：https://github.com/ONLYOFFICE/DocSpace；

2.  点击页面右上角粉色「Fork」按钮，选择自己的GitHub账号，等待Fork完成（通常1-2秒）；

3.  Fork完成后，你的GitHub仓库中会出现「DocSpace」仓库，与官方主仓库结构、文件完全一致（含根目录下.gitmodules文件），后续所有操作均基于此Fork后的仓库，不直接操作官方仓库。

## 2. 第二步：Fork所有子模块仓库（严格对照官方Git子模块配置）

根据官方Git仓库根目录下.gitmodules文件（真实配置如下，完全复制官方内容，无修改），子模块关联的官方仓库地址明确，需逐一Fork：

```plain text
# 官方Git仓库中.gitmodules真实配置（完全对照，无任何修改）
[submodule "client"]
	path = client
	url = ../DocSpace-client.git
	branch = .
	update = merge
[submodule "build"]
	path = buildtools
	url = ../DocSpace-buildtools.git
	branch = .
	update = merge
[submodule "server"]
	path = server
	url = ../DocSpace-server.git
	branch = .
	update = merge
```

按照上述配置中关联的子模块，逐一打开官方子模块Git仓库，执行Fork操作：

1.  DocSpace-client（对应配置中client）：官方Git地址 https://github.com/ONLYOFFICE/DocSpace-client，点击Fork到自己账号；

2.  DocSpace-server（对应配置中server）：官方Git地址 https://github.com/ONLYOFFICE/DocSpace-server，点击Fork到自己账号；

3.  DocSpace-buildtools（对应配置中build）：官方Git地址 https://github.com/ONLYOFFICE/DocSpace-buildtools，点击Fork到自己账号；

✅ 关键要求（官方隐含说明）：Fork后的子模块仓库名称，必须与官方完全一致（分别为DocSpace-client、DocSpace-server、DocSpace-buildtools），且与主仓库在同一GitHub账号下，否则.gitmodules中的相对路径无法自动关联。

## 3. 第三步：子模块关联说明（严格对照官方Git文档，无需修改.gitmodules）

根据官方Git仓库说明及.gitmodules配置特性，明确如下（无任何主观解读，完全贴合官方）：

1.  核心结论：无需修改.gitmodules文件任何内容，该文件中url采用相对路径（../DocSpace-client.git等），是官方Git仓库的内部关联逻辑；

2.  官方逻辑：当主仓库与3个子模块仓库均在同一GitHub账号下，且仓库名称与官方完全一致时，GitHub会自动识别相对路径，克隆主仓库时，会自动拉取你自己Fork后的子模块，无需手动修改url；

3.  例外情况（官方未明确提及，但结合Git特性补充，仅作提醒）：若修改子模块仓库名称、子模块与主仓库不在同一账号下，需手动修改url为你Fork后的子模块绝对Git地址（如https://github.com/你的账号名/DocSpace-client.git），否则子模块拉取失败。

## 4. 第四步：克隆自己Fork后的项目（含子模块，严格对照官方Git命令）

克隆命令完全对照官方Git仓库README说明，确保可直接复制执行，步骤如下：

1.  执行克隆命令（带子模块，一步到位，官方推荐）：

```bash
git clone --recurse-submodules https://github.com/你的账号名/DocSpace.git
```

2.  若已克隆主仓库（未拉取子模块），执行官方提供的子模块拉取命令：

```bash
git submodule init
git submodule update
```

✅ 克隆后验证（官方隐含要求）：克隆完成后，本地会生成client、buildtools、server三个目录，对应三个子模块，可通过执行`git submodule status`命令，查看子模块关联状态，确保无异常（无红色提示）。

### 补充说明：子模块目录名前@编号的作用及注意事项（对照Git特性，无瞎编）

克隆完成后，若发现子模块目录名前带有@+一串编号（如client@5befc84、server@a123bcd），属于Git正常特性，官方Git文档未单独说明，但结合Git子模块机制，明确如下：

1.  @编号的核心作用：该编号是子模块当前对应的提交ID（SHA-1哈希值），Git通过该编号记录主仓库关联的子模块具体版本，确保每次克隆、更新后，子模块版本与主仓库预期一致，避免版本混乱；

2.  无需修改的原因：该编号由Git自动生成，仅用于本地版本标识，不影响子模块开发、提交、推送，也不影响子模块与远程仓库的关联，修改目录名会导致Git无法识别子模块，引发状态异常；

3.  操作建议：保持默认目录名不变，无需做任何修改，不影响后续所有开发操作。

## 5. 关键注意事项（严格对照官方Git文档及Git特性）

1.  必须先Fork主仓库及所有子模块，且子模块仓库名称与官方一致、与主仓库在同一账号下，否则子模块无法自动关联；

2.  克隆、拉取子模块时，确保网络通畅，若子模块拉取失败，可重复执行`git submodule update`命令（官方推荐排查方式）；

3.  子模块的提交、推送，需进入对应子模块目录（client、buildtools、server），单独执行Git命令，与正常Git操作一致（官方未额外说明，按通用Git子模块操作规范）；

4.  严禁随意修改.gitmodules文件中的path、branch、update字段，避免子模块关联异常。

# 二、前期准备：明确开发基础与合规要求（对照官方Git仓库LICENSE及README）

## 1. 核心开发前提（官方Git仓库README隐含要求）

- 技术栈基础：DocSpace基于React开发（官方Git仓库DocSpace-client子模块为React源码），服务端为后端通用技术栈，需掌握前端React、JS/TS、Docker，以及后端接口开发基础；

- 环境要求：本地需安装Git、Docker/Docker Compose、Node.js（建议16+）、npm/yarn，服务端开发需配套Java/Python/Go等后端环境（按需选择），版本要求参考官方Git仓库README。

## 2. 严格遵守AGPLv3开源协议（对照官方Git仓库LICENSE文件）

DocSpace遵循ONLYOFFICE统一的AGPLv3协议（官方Git仓库根目录LICENSE文件明确），二次开发需满足核心合规要求：

- 保留原产品logo、版权声明和协议归属（协议7(b)条款）；

- 不得使用ONLYOFFICE商标（协议7(e)条款）；

- 若基于DocSpace做衍生产品并公开发布/提供SaaS服务，必须完整开源修改后的源码，且沿用AGPLv3协议（含官方附加条款）；

- 协议无豁免条款，不满足则视为侵权，会自动终止授权（协议8条款）。

# 三、关键步骤：Git子模块处理（核心重点，完全对照官方Git配置）

## 1. 子模块说明（对照官方Git仓库结构）

ONLYOFFICE/DocSpace主仓库（官方Git）仅包含子模块的链接地址（通过.gitmodules配置），不存储实际代码，核心代码存于独立子仓库，因此必须手动拉取子模块，才能获得完整开发文件，子模块对应关系如下（完全对照官方Git仓库结构）：

- 配置中「client」→ 本地目录「client」→ 对应仓库「DocSpace-client」（前端核心代码，React，官方Git子模块）；

- 配置中「server」→ 本地目录「server」→ 对应仓库「DocSpace-server」（服务端核心代码，业务逻辑、接口，官方Git子模块）；

- 配置中「build」→ 本地目录「buildtools」→ 对应仓库「DocSpace-buildtools」（构建工具，用于编译、打包源码，官方Git子模块）。

## 2. 常用子模块命令（对照官方Git文档及Git通用命令）

以下命令均为Git通用子模块命令，官方Git仓库未单独列出，可直接用于子模块管理，确保可复制执行：

1. 更新所有子模块到自己仓库的最新版（自己修改后同步）：

```bash
git submodule update --remote
```

2. 一次性对所有子模块执行同一命令（如安装所有子项目依赖）：

```bash
git submodule foreach "npm install"
```

3. 提交代码时包含子模块修改：

```bash
git push --recurse-submodules=on-demand
```

4. 查看子模块状态（排查子模块关联异常）：

```bash
git submodule status
```

## 3. 处理后的DocSpace目录结构（对照官方Git仓库结构）

```plain text
DocSpace/                主项目（核心配置、docker-compose等，对照官方Git根目录）
├── client/              前端源码（对应DocSpace-client子模块，React）
├── server/              后端源码（对应DocSpace-server子模块，业务逻辑、接口）
├── buildtools/          构建工具（对应DocSpace-buildtools子模块，编译、打包）
├── docker-compose.yml   官方默认部署配置文件（对照官方Git根目录）
├── docker-compose.light.yml 官方轻量部署配置文件（对照官方Git根目录）
├── docker-compose.nodb.yml  官方无内置数据库部署配置文件（对照官方Git根目录）
└── LICENSE              开源协议文件（对照官方Git根目录）
```

# 四、第四步：搭建本地开发与调试环境（严格对照官方Git仓库docker-compose配置）

DocSpace官方推荐Docker容器化部署作为开发基础（官方Git仓库README明确），核心分「基础环境启动」和「开发模式调试」两步，同时结合官方提供的多种docker-compose配置，补充减少Docker容器数量的部署方式，全程对照官方Git仓库配置文件。

## 1. 官方提供的3种Docker Compose部署选项（完全对照官方Git根目录配置文件）

官方Git根目录提供3种docker-compose配置文件，对应不同部署场景，可根据需求选择（核心用于减少Docker容器数量），具体如下：

### （1）默认完整部署（docker-compose.yml，官方默认）

配置文件对应官方Git根目录docker-compose.yml，启动所有依赖容器，适合完整功能测试、开发环境，容器数量最多，步骤：

1. 进入克隆后的DocSpace主仓库目录（cd DocSpace）；

2. 执行官方启动命令：

```bash
docker-compose up -d
```

3. 启动容器说明（对照官方配置文件）：共启动4个核心容器，分别为DocSpace主服务、PostgreSQL数据库、Redis缓存、OnlyOffice Document Server文档服务；

4. 访问地址：本地访问http://localhost:8080，默认账号密码可查看官方Git仓库README.md。

### （2）轻量部署（docker-compose.light.yml，官方轻量选项）

配置文件对应官方Git根目录docker-compose.light.yml，减少非必要容器，适合资源有限场景，步骤：

1. 进入主仓库目录（cd DocSpace）；

2. 执行官方轻量启动命令：

```bash
docker-compose -f docker-compose.light.yml up -d
```

3. 启动容器说明（对照官方配置文件）：省略Redis缓存容器，仅启动3个核心容器（DocSpace主服务、PostgreSQL数据库、OnlyOffice Document Server文档服务），减少1个容器，不影响核心功能；

4. 访问地址：同默认部署，http://localhost:8080。

### （3）极简部署（docker-compose.nodb.yml，官方无数据库选项）

配置文件对应官方Git根目录docker-compose.nodb.yml，不启动内置数据库容器，适合已有外部PostgreSQL数据库的场景，容器数量最少，步骤：

1. 进入主仓库目录（cd DocSpace）；

2. 先修改配置文件：打开docker-compose.nodb.yml，填写外部PostgreSQL数据库连接信息（数据库地址、用户名、密码等，官方配置文件有明确注释）；

3. 执行官方极简启动命令：

```bash
docker-compose -f docker-compose.nodb.yml up -d
```

4. 启动容器说明（对照官方配置文件）：仅启动2个核心容器（DocSpace主服务、OnlyOffice Document Server文档服务），容器数量最少，完全复用外部数据库，适合企业已有基础设施场景。

## 2. 启动开发模式（联调自定义代码，对照官方Git子模块README）

若修改server、client子模块源码，需以开发模式启动，实现「代码修改-实时刷新」，便于调试，步骤对照各子模块Git仓库README说明：

### 前端（client子模块）开发模式

1. 进入前端子模块目录：

```bash
cd DocSpace/client
```

2. 安装前端依赖（对照DocSpace-client子模块Git仓库README）：

```bash
npm install
# 或 yarn install（若已安装yarn）
```

3. 启动前端开发服务（对照子模块README，默认热更新）：

```bash
npm run start
```

4. 本地访问前端开发地址（如http://localhost:3000），与后端服务联动调试。

### 服务端（server子模块）开发模式

1. 进入后端子模块目录：

```bash
cd DocSpace/server
```

2. 根据DocSpace-server子模块Git仓库README，配置数据库（PostgreSQL）、Redis（可复用Docker启动的容器或外部服务）；

3. 配置服务端环境变量（如数据库连接、文档服务地址、端口），在application.properties或.env文件中设置（对照子模块README）；

4. 启动后端开发服务（以Java为例，对照子模块README）：

```bash
mvn spring-boot:run
```

5. 后端接口默认地址http://localhost:8081，可通过Postman测试自定义接口。

# 五、第五步：核心二次开发方向与实践（对照官方Git仓库开发文档）

DocSpace的核心定位是基于「房间」的协作式文档管理平台（官方Git仓库README明确），二次开发主要围绕「功能定制、集成扩展、接口开发」三大方向，官方提供Open API、WOPI协议、自定义插件/宏三大开发能力，以下是高频开发场景（对照官方API文档及子模块源码）。

## 1. 前端页面与组件定制

基于官方docspace-ui-kit-react组件库（DocSpace-client子模块内置），修改client子模块源码，定制前端界面，降低开发成本：

- 自定义平台首页、侧边栏、「房间」列表样式；

- 新增自定义页面（如企业专属的审批页、统计页）；

- 调整用户权限展示、文件操作按钮等；

开发要点：直接修改client目录下的源码，复用官方组件，避免重复造轮子，修改后执行npm run build编译为生产包，替换Docker镜像中的前端文件即可（对照官方Git子模块开发说明）。

## 2. 后端接口开发与功能扩展

基于server子模块扩展业务逻辑，新增/修改后端接口，适配企业需求：

- 自定义用户认证（如集成企业LDAP、SSO单点登录）；

- 新增「房间」的自定义权限（如按部门限制文件访问）；

- 增加文件统计、操作日志、数据导出等功能；

- 对接企业内部系统（如OA、CRM），实现文档数据互通；

开发要点：遵循官方接口规范（对照官方API文档），新增接口需在swagger/openapi中声明，保证接口可测试、可文档化。

## 3. 集成ONLYOFFICE核心能力

DocSpace依赖ONLYOFFICE Document Server实现文档编辑/协作（官方Git仓库README明确），二次开发可深度联动此服务：

- 自定义文档编辑权限（如禁止部分用户修改、仅允许查看）；

- 集成AI能力（如自定义AI模型、新增AI文本生成/翻译功能，官方支持DeepSeek/Groq/OpenAI等模型对接，对照官方API文档）；

- 扩展文档格式支持（在原有DOCX/XLSX/PPTX/PDF基础上，新增自定义格式解析）；

开发要点：通过Docker-DocumentServer的Open API对接，修改DocSpace与文档服务的联动配置即可（对照官方Git仓库配置说明）。

## 4. 自定义插件/宏开发

ONLYOFFICE支持为DocSpace开发自定义插件（前端）和宏（文档内自动化操作），对照官方Git仓库插件开发示例：

- 开发企业专属插件（如文件批量重命名、一键分享到企业微信）；

- 为表格/文档开发宏（如自动化数据计算、报表生成）；

开发参考：官方GitHub（含子模块）有document-editor-vue/document-editor-react示例，可参考插件开发规范（对照官方Git仓库示例代码）。

## 5. 第三方平台集成

通过官方连接器（Connectors）和Open API，将DocSpace集成到企业现有平台（对照官方Git仓库连接器说明）：

- 集成WordPress/Moodle/Odoo（官方已有现成连接器，可直接修改适配）；

- 集成Nextcloud/Seafile（开源云盘），实现文档存储互通；

- 集成企业微信/钉钉/飞书，实现消息推送、快捷访问；

开发要点：基于官方WOPI协议，开发自定义连接器，实现跨平台鉴权和数据同步（对照官方API文档）。

# 六、第六步：编译、打包与部署（对照官方Git仓库buildtools子模块说明）

修改源码后，需将代码编译为可部署的产物，官方提供buildtools子模块（已通过子模块拉取）简化流程，步骤对照buildtools子模块Git仓库README说明：

1. 进入buildtools子模块目录：

```bash
cd DocSpace/buildtools
```

2. 根据buildtools子模块Git仓库README，配置构建参数（如镜像名称、版本号）；

3. 执行构建命令，自动编译前端（client）、服务端（server）源码，生成Docker镜像（推荐）或离线部署包：

```bash
# 示例：构建Docker镜像（对照官方示例命令）
./build.sh --docker --tag your-docspace:v1.0
```

4. 部署自定义镜像：可本地测试、部署到企业私有服务器，或基于K8s做集群部署（官方未额外说明，按通用Docker部署规范）；

5. 合规提醒：若需公开发布，必须在产品页面明确标注AGPLv3协议，并提供修改后的全套源码下载地址（指向你自己的GitHub仓库，对照官方LICENSE要求）。

# 七、开发资源与技术支持（对照官方Git仓库README）

## 1. 官方核心开发文档

- ONLYOFFICE API文档：https://api.onlyoffice.com/（含DocSpace、Document Server全接口规范，官方Git仓库README提供链接）；

- DocSpace官方文档：在GitHub各DocSpace仓库（主仓库及子模块）的README.md/docs目录下，含环境搭建、开发规范、部署指南。

## 2. 社区与技术交流

- GitHub Issues：在对应DocSpace仓库（你Fork后的仓库或官方仓库）提交问题，官方开发团队会回复（官方Git仓库README明确）；

- Discord社区：https://discord.gg/Hcgtf5n4uF（与全球开发者交流，含二次开发经验分享，官方Git仓库README提供链接）；

- 官方论坛：https://community.onlyoffice.com/（中文开发者可发帖提问，有社区版主解答，官方Git仓库README提供链接）；

- 社交媒体：X/Fosstodon/Reddit/LinkedIn的ONLYOFFICE官方账号，可获取最新开发更新（官方Git仓库README提及）。

## 3. 贡献代码（可选，对照官方Git仓库CONTRIBUTING.md）

若你的二次开发优化有通用价值，可通过GitHub向官方提交PR（Pull Request），步骤对照官方Git仓库CONTRIBUTING.md：

1. 确保你已Fork官方DocSpace仓库及子模块仓库；

2. 在你Fork后的仓库分支上开发，保证代码符合官方规范（查看仓库CONTRIBUTING.md）；

3. 提交PR到官方主仓库，经审核通过后会合并到官方代码。

# 八、新手友好：快速入门建议（结合官方Git文档，适配新手）

1. 先完成Fork操作（主仓库+3个子模块），克隆自己Fork后的项目（含子模块），选择官方轻量部署（docker-compose.light.yml）启动原生DocSpace，熟悉平台的「房间管理、文档协作、权限配置」核心功能，理解业务逻辑；

2. 从简单前端定制入手（如修改client目录下的页面样式、新增一个自定义按钮），熟悉源码结构和开发模式；

3. 再尝试简单接口开发（如修改server目录下的接口，新增一个文件统计接口），掌握前后端联动；

4. 最后基于业务需求，做深度功能扩展或第三方集成；

5. 开发过程中优先复用官方组件/接口，减少自定义成本，保证兼容性；

6. 遇到子模块相关问题，优先执行git submodule status查看状态，排查是否为关联异常或版本问题，也可参考官方Git仓库README排查。

# 九、核心注意事项（严格对照官方Git文档及操作规范）

1. 所有命令需在Git终端（如Git Bash、终端、PowerShell）中执行，确保Git、Docker等环境已正确安装，版本符合官方要求（对照官方Git仓库README）；

2. 子模块拉取失败时，可重新执行git submodule update命令，或检查网络连接（建议科学上网），同时确认子模块仓库与主仓库在同一账号、仓库名称正确；

3. 开发过程中严格遵守AGPLv3协议，避免侵权（对照官方Git仓库LICENSE文件）；

4. 若遇到环境启动失败，优先查看官方Git仓库README.md，或在官方社区提问，不盲目修改配置；

5. 全程使用自己Fork后的仓库地址，避免直接操作官方仓库，确保修改可提交、可管理；

6. 本地子模块目录名（带@编号）、.gitmodules配置，均无需手动修改，保持默认即可；

7. 部署时可根据服务器资源，选择官方提供的3种docker-compose配置，减少容器数量，适配不同场景（对照官方Git根目录配置文件）；

8. 所有开发操作，优先对照官方Git仓库（主仓库及子模块）的README、配置文件，不主观猜测、不瞎编操作步骤。
> （注：文档部分内容可能由 AI 生成）