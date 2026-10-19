# AI动物园 · AI Zoo 🐾

> 当前状态：热搜 GitHub Actions 已启用，Cloudflare 服务端观察入口已部署。观察地址：https://ai-zoo-observer.workers-bridge.workers.dev/ 。原 Pages 网址继续有效，但直接访问 Pages 的请求不可观察。`setup/ai-zoo.yml.txt` 是初始安装参考，当前运行文件为 `.github/workflows/ai-zoo.yml`。

公开的趣味观察实验。每天抓取公开热搜，把真实关键词放在可读取的静态页面里，等待爬虫主动发现。

- 访问：https://guojunwei59-a11y.github.io/work-report/ai-zoo/
- 原工具：https://guojunwei59-a11y.github.io/work-report/ （原 index.html、logo1.png 不修改）
- Actions：https://github.com/guojunwei59-a11y/work-report/actions/workflows/ai-zoo.yml
- 数据：`data/latest.json`、`data/YYYY-MM-DD.json`；档案：`history/YYYY-MM-DD/`。

## 自动投喂

北京时间每日 **00:30、06:30、12:30、18:30**。对应 UTC **16:30、22:30、04:30、10:30**；cron 为 `30 4,10,16,22 * * *`。GitHub 可能延迟或丢弃排队任务，不能保证准点。

每个平台每次一个请求，20 秒超时，不使用登录 Cookie、不破解签名、不绕过验证码。每平台最多 30 条，同平台关键词 NFKC 归一化去重，跨平台保留来源。排名是来源榜单的顺序或公开排名，不计算虚构热度。原链接可能是平台搜索链接。首次本机实测百度/B站/知乎/快手成功，微博 403、抖音空响应；云端网络环境可能不同，网页会显示实际状态。

失败时保留该平台最后成功的数据和原采集时间，不将旧数据计为今日采集；当日档案只包含当日真实采集的数据。相同榜单和状态不重复更新时间、不产生无意义提交。日期切换会形成新的真实快照。没有成功采集的日期不创建档案。

保留最近 90 个自然日的 JSON 和 HTML，最多约 180 条/日。历史页面只是每日最后一份有变化的榜单，不是全天新闻全集。Git 旧版本仍会累计，90 天清理不会删除 Git 提交历史；不自动强推或重写历史。以每天最多四次小提交控制增量，仓库变大时由维护者审核后归档。

## 运行、恢复与部署

Node.js 22，无 npm 运行依赖：

```sh
node --test scripts/ai-zoo/tests.mjs
node scripts/ai-zoo/update.mjs
```

测试使用临时目录中的合成样本，绝不写入公开热搜或来访记录。

工作流保留现有 `main` + `/` 的 Pages 来源；不改 DNS、不迁移原工具。仅暂存 `ai-zoo/`。同一 concurrency 组串行运行，push 非快进会失败，防止覆盖人工提交；下一次运行会从最新 main 重试。GITHUB_TOKEN 的自动提交不会自然触发 Pages，所以显式调用 `POST /repos/{owner}/{repo}/pages/builds` 并确认对应 SHA 的构建成功。工作流只需内置令牌的 contents:write、pages:write 权限，无需用户创建密钥。若仓库策略限制令牌写入，在 Settings → Actions → General 检查 Workflow permissions。拒绝修改已变化的 Pages 发布来源。

检查 Actions 中“AI Zoo · 自动投喂”最近运行与 Pages 构建。失败后可点 Run workflow；若 GitHub 因公开仓库 60 天无活动停用 schedule，在该工作流页面点击 Enable workflow，再手动运行一次。不要制造空提交维持活跃。采集全部失败时会输出 warning，已发布旧内容仍可访问。

## SEO 与 robots.txt 的边界

首页、档案和导航均为预生成 HTML；提供 title、description、canonical、sitemap.xml。没有隐藏词、虚假新闻或重复堆词。

`ai-zoo/robots.txt` 是自动生成的说明副本。**robots 协议只读取主机根路径** `https://guojunwei59-a11y.github.io/robots.txt`，不读取项目子目录的 robots.txt；在本仓库增加根 robots.txt 也只会成为 `/work-report/robots.txt`，仍然无效。本项目没有擅自改其他仓库或域名；没有主机根 robots 时通常默认允许抓取。可直接向站长工具提交 `/work-report/ai-zoo/sitemap.xml`。如果以后获得用户主页仓库的明确授权，可在真正的根 robots.txt 添加 Sitemap。无法保证搜索收录或 AI 引用。

## 真实爬虫观察：已启用

独立 Worker 记录真实请求并联合官方 IP 清单验证，D1 只保存聚合结果。原 Pages 页面读取统计接口；直接访问 Pages 不会被观察。没有已验证记录时保持“尚未发现”，不添加示例来访。

当前实现与限制见 [观察系统说明](../observer/README.md)，初始方案研究见 [设计记录](OBSERVATION.md)。没有密钥暴露在前端。

## 许可与参考

本项目按公开接口自行实现轻量采集器，没有复制整个项目。

- [TrendRadar](https://github.com/sansan0/TrendRadar)：检查时为 GPL-3.0；只研究架构，没有引入其代码或依赖。
- [NewsNow](https://github.com/newsnext/newsnow)：MIT，原 ourongxing/newsnow 已重定向。参考 `server/sources` 的公开端点与嵌入式 JSON 结构，保留 MIT 声明于 THIRD_PARTY_NOTICES.md。未采用其微博固定 Cookie 或抖音登录页 Cookie 方案。
- 关键词和链接的权利属于原内容发布者；本站不复制正文或图片。

## 费用

当前使用公开仓库的 GitHub Actions 标准 Ubuntu runner 和 GitHub Pages，无付费 API、数据库或订阅。运行不依赖电脑开机。服务免费额度、可用性和政策可能变化；本项目不会自动升级收费套餐。
