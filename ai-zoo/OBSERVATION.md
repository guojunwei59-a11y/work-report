# 真实 AI 爬虫观察：待授权启用

现阶段没有请求日志，不声称任何 AI 已来访。本文件提供部署路线，不表示后端已经实现或通过验证。

## 选择：Cloudflare Workers Free + D1 Free

让 **新增的动物园观察入口** 经 Worker 读取现有 Pages 的 `/work-report/ai-zoo/` 内容，在服务端检查真实请求的来源 IP；只将聚合结果写入 D1。这样不用迁移原工具、不用修改 DNS，可先使用 `*.workers.dev` 地址。但仅经过 Worker 的请求能被观察，直接访问 GitHub Pages 的请求仍不可见。Worker 不能神奇读取 Pages 过去的日志。

官方 Workers Free 文档列出每天 100,000 次请求、每次 10ms CPU；D1 Free 每天 500 万行读取、10 万行写入，总存储 5GB。小规模实验可以免费运行；留在 Free 套餐，达到额度时服务可能失败，不承诺无限免费流量。用 SQL 原子递增，避免 KV 读改写丢失计数。为保护额度，只对候选爬虫的有效 HTML/robots/sitemap 请求做验证和计数，普通浏览和静态资源不入库。

Cloudflare Workers Logs 免费方案有保留期、额度和采样限制，适合排障，不能当永久完整统计。Workers Logpush 属于付费计划，不采用。Bot Management 的部分高级字段有套餐门槛，不能假定免费 Worker 的 `request.cf.botManagement` 一定存在，也不能从一个 verifiedBot 布尔值推断是哪家公司。其他免费函数平台也需要额外账户、请求入口和存储，本实验无明显更简单的选择。

## 启用步骤（需要用户提供 Cloudflare 账户授权后实施）

1. 创建或登录 Cloudflare Free 账户，开通 Workers 和 D1，不购买套餐。创建仅用于 AI Zoo 的 D1 数据库。
2. 新建独立 Worker，以 `workers.dev` 为观察入口；仅代理动物园允许路径，固定上游到本项目 Pages，禁止用户传入任意上游 URL，禁止将 Cookie、认证头、来源 IP 转发到上游。原 `/work-report/` 不代理、不迁移。
3. 使用平台赋值的真实来源 IP 验证候选类型，不能信任用户提供的 X-Forwarded-For。IP 只用于内存验证，不落库。不要将含查询参数、完整 UA、普通访客 IP 写入日志。
4. 对有官方 IP 清单的爬虫，匹配真实 UA 类型 **并且** 对官方 CIDR 做 IPv4/IPv6 校验。由定时任务缓存官方清单，校验 HTTPS、结构和有效期；清单过期或下载失败时必须降级为“疑似/无法验证”，不得继续宣称已验证。只允许固定官方域名清单，禁止任意远程配置地址。
5. 已验证例：OpenAI `GPTBot`、`OAI-SearchBot`、`ChatGPT-User` 使用各自官方 IP JSON；PerplexityBot 与 Perplexity-User 使用官方分别公布的清单。用户主动检索型请求单列，不算自主发现爬虫。Googlebot 通过官方 IP 清单或正反向 DNS双重验证后，只标记“Googlebot / Google 搜索”，不能将它当成 Gemini 的确定使用证据。Google-Extended 是 robots 控制 token，不是单独 HTTP UA。
6. Anthropic/DeepSeek/xAI/Meta 等在实施当天重新核实官方验证资料；没有可靠清单或适用验证链路时只列为疑似，不把第三方搜索服务归给 DeepSeek。自称任意爬虫的 UA 都不足以证明身份。
7. D1 聚合表建议：`(北京时间日期, 真实爬虫类型, 验证方式, 规范化页面路径, 分类)` 为主键，字段仅 `request_count`、`last_seen_at`。无 IP、Cookie、完整请求头或用户标识。已验证与疑似分开；仅保存白名单页面路径，丢弃查询参数，保留 90 天，定时删除旧行。累计次数明确标记为“自观察启用后的保留期内已验证请求次数”，不是独立访客人数。不要通过相同 IP 推算人数。
8. 公开只读统计 API 返回当天已验证类型数量、各类型请求数、最近时间、最受关注路径；按动物聚合时仍能展开真实类型。前端读取失败时展示“统计暂不可用”，不能显示成 0。后台配置密钥仅放 Worker Secret 或 D1 binding。
9. 接通页面数据后，状态规则建议：无已验证记录 → 💤；最近 7 天有已验证记录 → 🐾；最近 7 天至少 3 个不同日期有已验证自主爬虫请求 → 🏠。用户触发抓取、普通访问和疑似请求不参与常驻判定。最近/常驻是站内定义，不代表官方关系。
10. 在临时测试数据库验证 CIDR 边界、IPv6、伪造 UA、失效清单、并发计数和隐私。测试标记明确，销毁测试库，模拟请求不能出现在公开统计。再发布观察入口，提供真实验证链路结果，启用该入口的 sitemap/robots/canonical。若之后希望用自有域名，另取得 DNS 修改许可。

## 官方资料（2026-10-20 核实）

- [Workers 免费额度与 Logpush](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 价格和额度](https://developers.cloudflare.com/d1/platform/pricing/)
- [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- [Bot Management 字段](https://developers.cloudflare.com/bots/reference/bot-management-variables/)
- [OpenAI 爬虫和官方 IP 清单](https://developers.openai.com/api/docs/bots)
- [Perplexity 爬虫](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)
- [Google 请求验证](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests)
- [GitHub schedule 的延迟及 60 天停用规则](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
