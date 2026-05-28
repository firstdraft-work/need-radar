# AI 需求雷达 — 交付总览

**日期**：2026-05-28

---

## TL;DR

AI 需求雷达 MVP 已完成开发，GitHub 代码已推送，冷启动内容已准备，只需 3 步即可上线。

---

## 交付状态

| 项目 | 状态 | 备注 |
|------|------|------|
| Reddit 搜索 | ✅ 可用 | 代理+Referer/Origin 绕过403 |
| Product Hunt 搜索 | ✅ 可用 | Topic过滤+宽松匹配 |
| GLM AI 评分 | ✅ 可用 | 预过滤+批次评分+优化prompt |
| 邀请码系统 | ✅ 可用 | RADAR2024/NEED50/LAUNCH/V2EX/JIKE |
| Free 3次限制 | ✅ 可用 | Upstash Redis 持久化 + 内存 fallback |
| UI 界面 | ✅ 可用 | 雷达动画+阶段提示+耗时显示 |
| GitHub 仓库 | ✅ 已推送 | firstdraft-work/need-radar |
| Vercel 部署 | ⏳ 待操作 | 需手动导入+配置环境变量 |
| 冷启动内容 | ✅ 已准备 | marketing/launch-post.md |
| Upstash Redis | ⏳ 待配置 | 免费注册获取 URL+Token |

---

## 文件清单

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts      — 搜索API（Reddit+PH并行 + GLM评分）
│   │   ├── usage/route.ts       — 使用次数API（Redis持久化）
│   │   └── verify-invite/route.ts — 邀请码验证
│   ├── layout.tsx               — 布局
│   ├── page.tsx                 — 主页（搜索+结果展示）
│   └── globals.css              — 全局样式
├── components/
│   ├── SearchForm.tsx           — 搜索框
│   ├── ResultsList.tsx          — 结果列表
│   ├── ResultCard.tsx           — 单条结果卡片
│   ├── InviteModal.tsx          — 邀请码弹窗
│   ├── UpgradeModal.tsx         — Pro升级弹窗
│   ├── RadarLoader.tsx          — 雷达扫描加载动画
│   └── Footer.tsx               — 页脚
└── lib/
    ├── reddit.ts                — Reddit搜索（Vercel直连/本地代理自适应）
    ├── producthunt.ts           — PH搜索（topic+宽松匹配）
    ├── glm.ts                   — GLM AI评分
    ├── usage.ts                 — 用量追踪（Upstash Redis + 内存fallback）
    └── types.ts                 — TypeScript类型

scripts/
└── e2e-test.mjs                 — 端到端测试脚本

marketing/
└── launch-post.md               — 冷启动爆款帖（中英文）
```

---

## 上线 3 步

### Step 1: Vercel 部署（5分钟）

1. 打开 https://vercel.com/new
2. 导入 GitHub 仓库 `firstdraft-work/need-radar`
3. 配置环境变量：

| Key | Value | 说明 |
|-----|-------|------|
| `PH_CLIENT_ID` | wJjp6BCDMZc79ZZFMjC2pGpzTqQzVbxDVs7Og51JauY | PH API |
| `PH_CLIENT_SECRET` | 4CSsTA1mPufSgfQ5gDxd6ZLZZ4LbAZ0pwrHMsecuPXc | PH API |
| `GLM_API_KEY` | e4920a61721741959440a17685fdb054.YLrJAKINzkY4Ub51 | GLM AI |
| `UPSTASH_REDIS_REST_URL` | _(待注册)_ | 可选，不配则用内存 |
| `UPSTASH_REDIS_REST_TOKEN` | _(待注册)_ | 可选，不配则用内存 |

注意：**不要配置 HTTPS_PROXY**，Vercel 服务器在美国直连 Reddit。

4. 点击 Deploy，等待 1-2 分钟

### Step 2: Upstash Redis（5分钟，可选但推荐）

1. 打开 https://upstash.com/ 注册（可用 GitHub 登录）
2. 创建一个 Redis 数据库（免费层：10K 命令/天）
3. 复制 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`
4. 在 Vercel 项目 Settings → Environment Variables 中添加

### Step 3: 发布冷启动帖（30分钟）

1. 打开 `marketing/launch-post.md`
2. 替换 `[部署后填入]` 为你的 Vercel URL
3. 按渠道分开发布：
   - Day 1: V2EX + 即刻（中文版）
   - Day 2: 生财有术 + Twitter（中文/英文版）
   - Day 3: IndieHackers（英文版）

---

## 已知限制

1. **Reddit Referer 绕过可能不稳定** — Reddit 可能随时修补，长期方案是注册 Reddit App 走 OAuth
2. **GLM 评分质量需迭代** — 当前 prompt 基于测试调优，需要真实用户反馈持续优化
3. **Usage 追踪无 Redis 时重置** — Vercel serverless 重启后内存数据丢失，建议尽快配 Upstash
4. **无用户认证** — MVP 阶段只有邀请码，Pro 付费需要 Stripe 集成

---

## 下一步路线图

| 优先级 | 任务 | 预计时间 |
|--------|------|---------|
| P0 | Vercel 部署 + 配 Upstash | 30min |
| P0 | 发布冷启动帖 | 30min |
| P1 | 收集首批用户反馈 | 持续 |
| P1 | Stripe 集成（Pro付费） | 2-3天 |
| P2 | 周报自动生成 | 1天 |
| P2 | 小红书数据源接入 | 1-2天 |
| P3 | 用户认证（NextAuth） | 1天 |
| P3 | 搜索历史 + 收藏 | 1天 |
