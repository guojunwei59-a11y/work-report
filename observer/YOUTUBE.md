# YouTube 接入：等待 API 密钥

入口：https://ai-zoo-observer.workers-bridge.workers.dev/#youtube

接口：https://ai-zoo-observer.workers-bridge.workers.dev/api/youtube

代码和服务端路由已完成。没有密钥时返回 `not_configured`，不声称已收集真实 YouTube 视频。初次实际采集需要用户完成下述 Google Cloud 授权。

## 一次性配置

1. 登录 [Google Cloud](https://console.cloud.google.com/apis/library/youtube.googleapis.com)，新建或选择专用于 AI Zoo 的项目，启用 **YouTube Data API v3**。使用默认配额即可，不开通额外付费服务。
2. 在 [API 凭据](https://console.cloud.google.com/apis/credentials) 创建 API Key。API restrictions 选择 Restrict key，仅允许 **YouTube Data API v3**。服务端请求不能用网站 HTTP referrer 限制，也不能用 GitHub Pages 域名限制；Cloudflare Free 无固定出口 IP。本项目只在 Worker Secret 中保存密钥。不要把密钥发到聊天或提交代码。
3. 打开 [Cloudflare Worker 设置](https://dash.cloudflare.com/e7390eec0a8f17305f31ec0d540e6df1/workers/services/view/ai-zoo-observer/production/settings)，在 Variables and Secrets 新增 **Secret**，名称为 `YOUTUBE_API_KEY`，值为刚创建的密钥，保存并部署。必须是 Secret，不能使用公开前端环境变量。
4. 刷新观察入口的 YouTube 区域。首次请求会尝试获取真实榜单；若刚修正过错误密钥，失败重试有最长 10 分钟冷却。告知助手“密钥已配置”，以便验证真实采集和定时器。

## 范围、配额与存储

- 官方 `videos.list`，`part=snippet`、`chart=mostPopular`、`regionCode=US`、最多 30 条，仅取标题、频道名和视频 ID。每次请求约 1 个配额单位。列表顺序来自 API，不另行计算热度或跨平台总榜。
- 当前 mostPopular 包含音乐、电影、游戏等榜单内容，不等同于已下线的旧 Trending 页面，也不是全球热搜。默认美国区，修改地区须重新核实对应榜单可用性。
- 计划北京时间 00:30、06:30、12:30、18:30 刷新。首次打开可触发初始化；其余普通请求读取最长 6 小时的服务端缓存。D1 全局租约抑制并发重复调用；错误冷却 10 分钟。正常运行约每天 4 次 API 调用；默认配额通常充足，实际以 Google Cloud 控制台为准。
- 不自动购买配额或启用计费，超出配额显示不可用。密钥通过 `X-Goog-Api-Key` 请求头发往固定的官方 API，不出现在 URL、前端、响应或日志中。原观察统计不会因此计入测试访问。
- 只在 D1 中保存当前快照，后续覆盖；过期记录定时清理，不写入 GitHub、90 天历史或公共存储备份。超过 6 小时且刷新失败时不展示陈旧视频。清理阈值为 29 天，兼顾 YouTube 对 API 数据 30 天内刷新或删除的要求。
- 观察入口把当前缓存服务端渲染到 HTML，爬虫无需执行 JavaScript；原 Pages 地址通过无密钥的公开接口展示同一榜单。未配置密钥时，两处如实显示待配置。
- 仅链接回原视频，不嵌入播放器、不缓存视频文件或缩略图。YouTube 数据与本站其他关键词和访问统计分区展示，来源与采集时间清楚标记。

## 验证

`node --test observer/youtube-tests.mjs` 使用隔离的合成样本检查缓存、字段校验、输出转义和密钥不泄露。合成样本没有上传到生产数据库或网页，不能替代真实 API 接通验收。

## 官方资料

- [videos.list](https://developers.google.com/youtube/data/reference/rest/v3/videos/list)
- [启用 API 和配额](https://developers.google.com/youtube/data/getting-started)
- [mostPopular 范围变更](https://developers.google.com/youtube/data/revision_history)
- [API 数据刷新与保存要求](https://developers.google.com/youtube/terms/developer-policies)
