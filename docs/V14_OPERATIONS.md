# AI动物园 V1.2–V1.4 运维记录

## 入口与自动化

- 主站：https://ai-zoo-observer.workers-bridge.workers.dev/
- 独立静态备用：https://guojunwei59-a11y.github.io/work-report/ai-zoo/ （待中国大陆实测）
- 原工具：https://guojunwei59-a11y.github.io/work-report/ ，文件和路径保留。
- 同一 Actions 一次采集国内六个平台，保留失败来源上一次内容，生成主站上游与备用静态 HTML，不重复采集。
- 北京时间 00:30、06:30、12:30、18:30；定时任务可能延迟。Actions → AI Zoo · 自动投喂 → Run workflow 可恢复/检查；公开仓库长期不活跃时 GitHub 可能停用定时任务，重新启用即可，不制造保活提交。
- 备用页不调用 Worker。热搜、13 位居民、日期档案直接在 HTML 中；观察快照注明时间，只有聚合记录。同步失败保留原快照。YouTube 不写 Git 永久历史，只在主站服务端展示。

## 索引

- 主站 robots 允许公开抓取，声明主站 Sitemap。允许训练不等于搜索收录的前提。
- 主站 `index,follow`；备用 HTML `noindex,follow`、canonical 指向主站，避免重复收录。两者共享源文件，Worker 在响应时替换索引策略。
- 每个真实 HTML 内容摘要变化才改变 Sitemap `lastmod`；不生成空关键词页或重复趋势页。
- IndexNow 复用现有 UTC `17 */6 * * *` Worker 定时器，读取已发布 Sitemap，校验公开 Key，HEAD 确认页面 200，再提交未通知过的实际版本。无变化不重复提交，失败下个周期重试；并发使用数据库租约。
- 公开状态：`/api/discovery`。200/202 是接收状态，不是搜索收录证明；不属于 Google 接口。
- Search Console/Bing 需要用户账号实际生成的验证材料，步骤见 [大陆与索引说明](MAINLAND_AND_INDEXING.md)。推荐 Google HTML 标签法；Worker 支持 `GOOGLE_SITE_VERIFICATION` 变量（仅标签 content），Bing XML 支持 `BING_SITE_VERIFICATION`（仅 user 标识）。部署时必须保留已配置变量与 YouTube secret；不要填伪造 token。

## 真实观察与升级

- 13 位居民采用 `shared/residents.mjs`。新增 5 位中只有 Kimi 找到并接入可靠官方验证；其余保留图鉴，不虚构 UA/IP。Claude 也新增官方 IP 验证。
- 13 类可验证类型：OpenAI 3、Perplexity 2、Googlebot、bingbot、Claude 3、Kimi 3。清单每 6 小时刷新；过期 48 小时停止验证。Bingbot/Googlebot 单列搜索引擎，不等于 Copilot/Gemini。
- A 用户主动请求、B 搜索、C 训练、D 自报但未验证、E 未知候选。普通浏览器访问不记录。B/C 触发原因仍未知，不证明主动发现或 SEO 因果。
- D1 保存聚合，不保存 IP/完整 UA/查询参数。原先多次请求只有最近时间，无法恢复首次时间；仅原计数为 1 的记录可确证首次。新记录保存首次，保留 90 天。
- 部署前记录实际累计基线，展示之后已记录增量，不作效果归因。
- 新数据库用 `observer/schema.sql`；已有旧数据库在部署新 Worker 前执行一次 `observer/migrations/001-v14.sql`，不要重复 ALTER。备份旧表架构再操作。
- Worker 本身没有 AI 拒绝规则，响应允许抓取；账号无自有 zone，`workers.dev` 平台层 bot 策略不能从本项目 zone 设置完整审计。未关闭其他安全防护。
- 沿用现有 Workers Free、D1 与公共 GitHub Pages；没有新付费资源或新账号，不自动升级，超额可能服务受限。平台免费政策未来可能变化。

## 验证

`node --test observer/tests.mjs observer/youtube-tests.mjs scripts/ai-zoo/tests.mjs`

测试合成数据仅用于内存/系统临时目录，不发模拟爬虫到生产。Worker 代码需独立部署；现有 GitHub Actions 只部署静态站，不存 Cloudflare 授权令牌。
