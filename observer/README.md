# AI Zoo 服务端观察系统

已启用的独立入口：https://ai-zoo-observer.workers-bridge.workers.dev/

公开聚合统计：https://ai-zoo-observer.workers-bridge.workers.dev/api/observation

原 GitHub Pages 地址继续有效，独立显示标有时间的统计快照，但直接访问 Pages 的 HTTP 请求不会经过 Worker，因此无法被观察。原小工具和 DNS 未修改。Worker 固定代理原动物园路径，不转发访客 IP、Cookie、认证头或查询参数。

## 验证和隐私

- 真实服务端请求来自 Cloudflare 入口。候选 UA 必须同时匹配各爬虫自己的官方 IPv4/IPv6 CIDR 清单，才记为已验证。
- 已接入官方清单：GPTBot、OAI-SearchBot、ChatGPT-User、PerplexityBot、Perplexity-User、Googlebot。每 6 小时刷新，超过 48 小时即停止把对应类型认定为已验证。允许的重定向仅限各公司的固定官方 HTTPS 域名。
- ChatGPT-User / Perplexity-User 是用户主动检索，不算自主爬虫；Googlebot 是 Google 搜索抓取，不证明 Gemini 来访。V1.4 新增 Claude 三类、Kimi 三类与 bingbot 官方 IP 验证，具体证据见 docs/CRAWLER_EVIDENCE.md。Bingbot 不等于 Copilot。
- D1 仅保存日期、真实/自称类型、公司（未验证统一 unknown）、分类、验证方式、白名单页面路径、计数和最近时间；不保存 IP、完整 UA、Cookie、查询参数或普通浏览记录。
- 只统计成功 GET 的首页、真实日期档案、档案目录、robots 和 sitemap，不统计资源、404、统计 API 和普通访客。请求数不是独立访客数。
- 💳 无新订阅：账户已由 Cloudflare 确认为 Free；未升级、未绑卡。Workers 和 D1 使用免费额度；达到额度会影响服务，不会由本项目自动升级套餐。候选爬虫每类每个边缘位置最多约 30 次/分钟，计数为已记录请求的下限。
- 90 天数据清理与官方清单刷新共用 UTC `17 */6 * * *` 定时器。关闭 Worker 持久请求日志，没有应用层 IP 日志。Cloudflare 基础平台自身仍处理网络请求。
- 动物状态：最近 7 天有已验证的搜索或训练请求为“最近出没”；搜索或训练爬虫在最近 7 天至少 3 个日期出现为“常驻居民”。用户主动检索不参与状态判定。累计数明确为保留期内已记录的请求数。

## 文件与维护

- `worker.mjs`：代理、聚合 API、统计和定时刷新。
- `identity.mjs`：爬虫分类、官方地址、IPv4/IPv6 CIDR 验证。
- `schema.sql`：D1 表结构；`tests.mjs`：隔离的合成验证测试。
- Worker 名称：`ai-zoo-observer`；D1：`ai-zoo-observations`。
- 数据库 ID 和账号 ID 是配置标识，不是密钥；授权令牌只使用本机已有 Wrangler OAuth 配置，没有提交到仓库或前端。
- 修改 Worker 代码后须单独部署到 Cloudflare；现有 GitHub Actions 继续只负责热搜，不需要添加 Cloudflare 密钥。
- `node --test observer/tests.mjs scripts/ai-zoo/tests.mjs` 可运行隔离测试。模拟请求只在内存测试中使用，不会写入生产统计。生产验收使用普通 HTTP 客户端，不伪装 AI。

首次部署时的临时初始化密钥已删除；`/internal/refresh` 未配置密钥时恒返回 404。观察系统不会承诺一定有 AI 来访或被引用。

V1.4 部署、迁移、IndexNow、快照及免费限制详见 [运维记录](../docs/V14_OPERATIONS.md)。
