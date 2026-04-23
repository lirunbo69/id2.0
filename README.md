# 千寻寄售平台复刻版

基于 `Next.js + Supabase` 的虚拟商品自动发货 SaaS 平台骨架。

## 当前进度

- 已初始化 Next.js App Router 项目
- 已搭建首页、店铺页、订单查询、商户后台、平台后台骨架
- 已接入 Supabase 浏览器端、服务端、管理员端和 middleware 基础结构

## 技术栈

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth / Database / Storage / Edge Functions

## 启动

```bash
npm install
npm run dev
```

## Supabase 接入步骤

### 1. 创建 Supabase 项目

进入 Supabase 控制台创建新项目。

### 2. 获取项目配置

在项目后台找到：
- Project URL
- anon public key
- service_role key

### 3. 配置本地环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=你的 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
SUPABASE_SERVICE_ROLE_KEY=你的 service_role key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. 启动项目

```bash
npm run dev
```

然后访问：

- `/supabase-status` 查看是否已成功读取环境变量

## 当前 Supabase 文件

- `src/lib/supabase/client.ts` 浏览器端客户端
- `src/lib/supabase/server.ts` 服务端客户端
- `src/lib/supabase/admin.ts` 管理员客户端
- `src/lib/supabase.ts` 聚合导出和环境检查
- `middleware.ts` 登录态刷新基础中间件

## 下一步开发建议

1. 建立数据库表结构 SQL
2. 接入 Supabase Auth 登录注册
3. 实现商户资料表与店铺表
4. 实现商品、库存、订单读写
5. 接入支付回调和自动发货
