# 大陆备用入口与搜索引擎发现

核查日期：2026-10-20。本文记录官方公开规则与待办，不代表已完成新托管部署或大陆网络验证。

## 现阶段采用的入口

主站：https://ai-zoo-observer.workers-bridge.workers.dev/

现有 GitHub Pages 备用：https://guojunwei59-a11y.github.io/work-report/ai-zoo/

**备用入口状态：待大陆实测。** 没有当前大陆多运营商实测证据，不能称为“大陆稳定可用”。不要把临时预览链接作为长期入口。

本轮备用页面目标：国内关键词、13 种动物图鉴及标明采样时间的观察快照不依赖请求 `workers.dev` 即可渲染。快照不等于实时观察，必须同时保留快照时间。具体部署与验收状态以最终部署报告为准。YouTube 国际视频数据不写入永久 Git 历史。

## 免费托管比较

| 方案 | 已核实条件 | 结论 |
| --- | --- | --- |
| GitHub Pages | 公共仓库可免费托管；支持现有 Actions。发布站点上限 1 GB，带宽软限 100 GB/月；可保留现有 github.io 地址。 | 复用现有备用入口；官方未保证大陆连通性，待大陆实测。 |
| Gitee Pages | 官方反馈称 Pages 已下线，暂无再次上线计划。 | 不采用旧教程中的 Pages 部署方式。 |
| EdgeOne Pages / Makers | 当前免费版有 500 次构建/月，可关联 Git 自动部署。大陆访问平台默认域名需使用有效期 3 小时的预览链接。自有域名选择境外加速区无需 ICP 备案；含大陆节点需备案，相关账户需实名。 | 默认子域名不能作为大陆长期入口。已有自有域名时可另行评估，实际连通仍待测。 |
| Netlify | 当前新账户免费版 300 credits/月，正式生产部署 15 credits/次，请求和流量另计；免费版硬限，无自动充值。 | 每天四次约 120 次/月，仅部署约 1800 credits，不满足本项目免费自动更新目标；无大陆稳定保证。 |

上述候选中，未找到可保证“中国大陆长期稳定访问、永久免费、无需自有域名/备案”的新入口。平台当前免费额度也可能调整，不承诺永久不变。

官方依据：

- [GitHub Pages 限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [Gitee 官方反馈：Pages 下线](https://gitee.com/oschina/git-osc/issues/I9QF16)
- [EdgeOne 域名及大陆预览限制](https://pages.edgeone.ai/document/domain-overview)
- [EdgeOne 免费额度](https://pages.edgeone.ai/document/limits-and-quotas)
- [EdgeOne Git 自动部署](https://edgeone.ai/document/173005644317011968)
- [EdgeOne 身份验证与备案条件](https://edgeone.ai/document/54208)
- [Netlify 当前免费计划与 credits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)
- [Netlify 生产域名](https://docs.netlify.com/manage/domains/domains-fundamentals/understand-domains/)

## Google Search Console

Search Console 免费。对主站添加完整 HTTPS 地址的 **URL 前缀**属性；不要选需要控制 workers.dev DNS 的网域属性。

最少用户步骤：

1. 使用自己的 Google 账户打开 [Search Console](https://search.google.com/search-console/)。
2. 添加 URL 前缀 `https://ai-zoo-observer.workers-bridge.workers.dev/`。
3. 下载 Google 提供的 HTML 验证文件，或复制提供的 `google-site-verification` 标签，交给维护者部署。不要发送账户密码。
4. 验证文件或标签上线后，点击“验证”，再提交主站的 `sitemap.xml`。

所有权标识必须由用户账户实际生成，不能自行虚构。文件需按 Google 指定的文件名、正文和 URL 公开放置，不应要求登录或依赖重定向；验证成功后继续保留。

官方：[免费服务介绍](https://support.google.com/webmasters/answer/9128668?hl=en)、[所有权验证要求](https://support.google.com/webmasters/answer/9008080?hl=en)。

## Bing Webmaster Tools

最少步骤：登录自己的 [Bing Webmaster Tools](https://www.bing.com/webmasters/)，导入已验证的 Search Console 属性；或手动添加主站，并提供账户生成的 `BingSiteAuth.xml` / meta 标签供部署，然后验证、提交 sitemap。导入 Google 属性会要求授权，用户自行确认。没有用户验证材料时不能宣布已验证。

官方：[添加与验证站点](https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b)、[Sitemaps](https://www2.bing.com/webmasters/help/sitemaps-3b5cf6ed)。

## IndexNow

IndexNow 与 Google Search Console 是不同机制，不能代替 Google 所有权验证或表示 Google 已接收提交。它通过站点公开托管的 UTF-8 Key 文件确认权限，无需购买付费 API。

部署要求：

- Key 文件仅包含实际生成的 Key，须公网可读。
- 根目录 `{key}.txt` 可覆盖该主机路径；子目录文件需在请求中提供绝对 `keyLocation`，且只覆盖该目录及以下 URL。
- 仅在页面真实新增、更新、删除且部署完成后通知；无变化不重复推送全站。
- 批量请求提供 `host`、`key`、`keyLocation`、`urlList`。主站与备用主机分别验证，不能跨主机混用权限。
- 接口接受提交不保证搜索引擎收录、排名或 AI 访问。

官方：[IndexNow 协议](https://www.indexnow.org/documentation)、[FAQ](https://www.indexnow.org/faq)。

## 若未来启用 EdgeOne

只在用户已有自有域名且同意配置时操作：登录 EdgeOne → 授权指定 GitHub 仓库 → 确认当前免费套餐及额度 → 选择境外加速区 → 设置 AI Zoo 独立输出目录 → 按控制台要求绑定域名。含大陆节点另需实名和 ICP 备案。

当前不要求新账户、购买域名、付费升级或改 DNS；也不把 EdgeOne 的 3 小时预览 URL 当作正式备用域名。
