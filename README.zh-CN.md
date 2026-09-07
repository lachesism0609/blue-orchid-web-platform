[English](README.md)

# Blue Orchid Web Platform

Blue Orchid 是一个双语全栈时尚电商演示项目，基于 React、Node.js、Cloudflare Pages Functions 和托管 PostgreSQL 构建。项目包含响应式商城、完整的用户认证与购物流程、带库存校验的结算，以及受角色保护的商品与订单后台。

项目定位为面向生产环境的学习平台与电商原型。结算流程会真实写入订单并扣减库存，但当前尚未接入支付服务商。

## 项目亮点

### 商城前端

- 中英双语界面，支持人民币（CNY）与欧元（EUR）展示
- 首页自动轮播，以及新品、女装、男装、包袋、鞋履、配饰、折扣等分类页
- PostgreSQL 驱动的商品目录，支持搜索、分类与价格筛选、库存筛选和分页
- 商品详情包含大图、双语描述、材质、颜色/款式、尺码，以及精确到 SKU 的库存信息
- 折扣商品统一展示原价、售价与折扣标签
- 通过 Frankfurter 获取实时 EUR/CNY 参考汇率，并提供缓存兜底

### 用户与购物体验

- 邮箱注册、一次性验证链接、登录、退出，以及一小时有效的密码重置链接
- 设备会话管理：识别当前设备、单独撤销会话、退出其他设备
- 收藏与购物车通过 PostgreSQL 同步，刷新页面或更换设备后数据保持一致
- 购物车数量编辑、商品规格切换、个人资料与收货地址管理
- 带库存校验的结算流程：
  1. 核对购物车商品、数量、价格与合计金额
  2. 选择已有收货地址
  3. 确认下单
  4. 在事务中创建订单并扣减 SKU 库存
  5. 展示下单结果并进入订单历史
- 订单历史与订单详情，包含商品、数量、价格、时间、状态和收货地址
- 账户、购物车、收藏、结算、后台和商品目录均支持基于 hash 的页面状态恢复

### 后台管理

- 基于数据库的 `customer` 与 `admin` 角色，服务端统一鉴权
- 商品创建与编辑：双语文案、材质、分类、价格、折扣比例、可见性和图片
- 颜色/款式管理，以及按尺码维护 SKU 库存
- 商品编辑完成后可返回商品与库存列表
- 订单查询、详情查看与状态流转：已确认、处理中、已发货、已完成、已取消
- 仅管理员可访问的响应式后台工作区

## 技术栈

| 层次 | 技术 |
| --- | --- |
| 前端 | React 18、Vite 6、JSX 组件、响应式 CSS |
| 生产 API | Cloudflare Pages Functions |
| 本地 API | Node.js 与 Express 4 |
| 数据库 | Neon 兼容 PostgreSQL、Drizzle ORM schema 与 SQL migration |
| 认证 | 生产环境 PBKDF2，本地 fallback 使用 `crypto.scryptSync`，安全 Cookie 会话 |
| 邮件 | Resend 验证邮件发送，并支持本地开发演示模式 |
| 质量保障 | Node test runner、Prettier、Drizzle schema 校验、Vite 生产构建 |
| 交付 | GitHub Actions 与 Cloudflare Pages |

## 环境要求

- 推荐 Node.js 22
- npm
- PostgreSQL 连接串（用于商品、用户、购物车、订单与后台功能）
- 需要真实验证邮件时配置 Resend 凭据

## 本地运行

安装依赖：

```bash
npm install
```

复制 `.env.example` 为 `.env` 供数据库脚本使用，并替换所有占位值。Express 开发服务器从进程环境变量读取配置，因此启动组合开发环境前需要先导出变量。

PowerShell 示例：

```powershell
$env:AUTH_SECRET="replace-with-a-long-random-secret"
$env:DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
$env:SITE_URL="http://localhost:5173"
$env:DEV_EMAIL_VERIFICATION="true"
npm run db:migrate
npm run db:seed
npm run dev
```

开发服务默认地址：

- 前端：`http://localhost:5173`
- Express API：`http://localhost:3010`

Vite 会将 `/api` 请求代理到 Express 服务。测试认证、账户、购物车、地址、订单或后台功能时，需要同时保持两个服务运行。

## 环境变量

| 变量 | 是否必需 | 用途 |
| --- | --- | --- |
| `AUTH_SECRET` | 生产环境 | 认证与安全工具使用的强密钥 |
| `DATABASE_URL` | 是 | 托管 PostgreSQL 连接串 |
| `RESEND_API_KEY` | 邮件发送 | Resend API 凭据 |
| `EMAIL_FROM` | 邮件发送 | 使用 Resend 已验证域名的发件人 |
| `SITE_URL` | 是 | 用于验证链接的应用公开地址 |
| `DEV_EMAIL_VERIFICATION` | 仅开发 | 设为 `true` 时返回演示验证链接 |
| `ADMIN_EMAIL` | 管理员初始化 | `db:promote-admin` 提升的已注册邮箱 |
| `ADMIN_EMAILS` | 本地开发 | 可选，逗号分隔的 Express 管理员邮箱 |
| `CLOUDFLARE_API_TOKEN` | 部署 | Cloudflare Pages 部署令牌 |
| `CLOUDFLARE_ACCOUNT_ID` | 部署 | Cloudflare 账户标识 |

请勿提交真实密钥或数据库地址。生产值应保存在 GitHub `production` 环境与 Cloudflare Pages 配置中。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 同时启动 Vite 与 Express API |
| `npm run dev:client` | 仅启动 Vite 前端 |
| `npm run server` | 仅启动 Express API |
| `npm run build` | 构建生产前端到 `dist/` |
| `npm run preview` | 本地预览生产构建 |
| `npm test` | 运行全部前端与后端测试 |
| `npm run test:frontend` | 测试商品目录、筛选、分页与购物车工具函数 |
| `npm run test:backend` | 测试 Cloudflare API 与后台行为 |
| `npm run format:check` | 校验源码与测试格式化 |
| `npm run db:generate` | schema 变更后生成 Drizzle migration |
| `npm run db:check` | 校验 Drizzle schema 与迁移历史 |
| `npm run db:migrate` | 执行待应用的 PostgreSQL 迁移 |
| `npm run db:seed` | 插入缺失的商品与 SKU 种子数据，不覆盖已管理数据 |
| `npm run db:promote-admin` | 将 `ADMIN_EMAIL` 对应账户提升为管理员 |

## 项目结构

```text
blue-orchid-web-platform/
├── src/
│   ├── components/             # 商城、账户、结算、商品与后台视图
│   ├── App.jsx                 # 应用状态、API 集成与导航
│   ├── main.jsx                # React 入口
│   ├── store-utils.js          # 商品目录、分页与购物车工具函数
│   └── styles.css              # 响应式应用样式
├── functions/
│   ├── api/[[path]].js         # Cloudflare Pages API 路由
│   └── _lib/                   # 数据库、商品目录、用户与后台辅助模块
├── server/
│   ├── index.js                # Express 开发 API
│   ├── dev.js                  # 本地组合启动器
│   └── data/                   # 仅用于开发的 JSON fallback 数据
├── db/
│   ├── schema.js               # 托管 PostgreSQL schema
│   ├── migrate.js              # 迁移执行器
│   ├── seed.js                 # 非破坏性商品种子数据
│   └── promote-admin.js        # 管理员初始化脚本
├── drizzle/                    # 版本控制的 PostgreSQL migrations
├── tests/                      # 前端工具与后端集成测试
├── public/_routes.json         # Cloudflare Pages Function 路由
└── .github/workflows/          # 校验与部署流水线
```

## 数据库与迁移

PostgreSQL 存储商品、款式、尺码、SKU、用户、邮箱验证与密码重置令牌、设备会话、限流记录、收藏、购物车、地址、订单、订单明细以及错误监控事件。外键、唯一约束、索引与级联行为定义在 `db/schema.js`，并由 `drizzle/` 目录进行版本控制。

修改 schema 后：

```bash
npm run db:generate
npm run db:check
npm run db:migrate
npm run db:seed
```

种子数据默认非破坏性：管理员维护过的商品字段、可见性、营销信息、款式数据与库存都会保留，只插入缺失的种子记录。

创建订单时，服务端会读取当前登录用户的购物车，校验商品、款式、尺码、数量与当前库存，然后在同一数据库事务中创建订单、扣减 SKU 库存并清空购物车。

### 初始化管理员

先注册并验证邮箱，然后执行：

```powershell
$env:DATABASE_URL="postgresql://..."
$env:ADMIN_EMAIL="owner@example.com"
npm run db:migrate
npm run db:promote-admin
```

退出并重新登录，使 `/api/auth/me` 返回更新后的 `admin` 角色。所有 `/api/admin/*` 接口都会在服务端校验该角色；前端是否显示后台入口不作为授权依据。

## API 概览

| 区域 | 代表性接口 |
| --- | --- |
| 商品目录 | `GET /api/products`、`GET /api/products/:id`、`GET /api/exchange-rate` |
| 认证 | `POST /api/auth/register`、`GET /api/auth/verify-email`、`POST /api/auth/resend-verification`、`POST /api/auth/forgot-password`、`POST /api/auth/reset-password`、`POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/auth/me`、`POST /api/auth/revoke-sessions` |
| 用户账户 | `/api/account/profile`、`/api/account/addresses`、`/api/account/orders` |
| 设备会话 | `GET /api/account/sessions`、`DELETE /api/account/sessions/:id`、`POST /api/account/sessions/revoke-others` |
| 购物数据 | `/api/account/favourites`、`/api/account/cart` |
| 后台管理 | `/api/admin/products`、`/api/admin/variants/:id`、`/api/admin/skus/:id`、`/api/admin/orders` |
| 监控 | `POST /api/errors/report` |

`GET /api/products` 支持 `q`、`category`、`sale`、`inStock`、`minPrice`、`maxPrice`、`page` 和 `limit` 参数。

## 安全设计

- 生产流量强制跳转 HTTPS
- 会话标识为不透明值，存储在 `Secure`、`HttpOnly`、`SameSite=Strict` Cookie 中
- PostgreSQL 仅存储会话令牌的 SHA-256 哈希
- 会话七天后过期，记录最近使用时间，并支持立即撤销单会话或全部会话
- 状态变更请求会拒绝来源不一致的请求
- 认证及已登录写操作使用基于客户端 IP 哈希的数据库限流
- 密码加盐哈希存储，绝不存储明文密码与会话令牌
- 邮箱验证令牌为一次性哈希，24 小时过期
- 密码重置令牌仅以一次性哈希存储，一小时后过期，重置成功后会撤销该账户所有会话
- 前后端错误上报会截断诊断信息，并仅存储客户端 IP 的哈希

## 测试与部署

`Test and deploy` GitHub Actions 工作流在拉取请求，以及推送到 `main` 和 `codex/complete-blue-orchid-store` 分支时触发。校验任务包括：

1. 安装依赖
2. 前端与后端测试
3. Prettier 格式化校验
4. Drizzle schema 校验
5. 生产构建

符合条件的推送会下载已校验的构建产物，执行 PostgreSQL 迁移与非破坏性种子数据，并部署到 `blue-orchid-web-platform` Cloudflare Pages 项目。

GitHub `production` 环境需要提供 `DATABASE_URL`、`CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`；Cloudflare 也需要配置 Pages Functions 使用的运行时密钥与变量。

## 当前限制

- 结算为模拟流程，不收集或验证支付信息
- 退款、退货管理、优惠券、税费计算、物流跟踪与履约商集成尚未实现
- 客服联系方式与营业时间为演示内容
- 商品图片托管在远程地址，需要网络访问
- Express 开发环境认证 fallback 使用本地 JSON 文件，而 Cloudflare 生产环境使用 PostgreSQL，两套账户数据不同步
- 错误事件已存入 PostgreSQL，但尚未接入外部告警看板或通知渠道

## 后续方向

- 接入支付服务商，使用服务端 payment intent 与 webhook 校验
- 增加交易类订单与发货邮件
- 增加退款、退货、优惠券、税费与履约流程
- 增加数据库备份校验与恢复演练
- 扩展浏览器级端到端测试，覆盖用户与管理员关键路径
- 将错误监控接入告警与事件管理服务
