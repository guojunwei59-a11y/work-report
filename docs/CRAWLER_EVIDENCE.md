# 爬虫身份与产品归属证据

核查日期：2026-10-20。只有可信服务端来源 IP 与官方身份规则共同匹配，才允许计入已验证来访。UA 可以伪造；模拟请求、公司 ASN、第三方爬虫目录、产品同名均不能单独证明身份。训练、搜索索引与用户主动请求分开统计；用户触发读取不等于自主发现。

| 居民 | 已确认官方标识与验证 | 产品归属和限制 |
| --- | --- | --- |
| Kimi | [官方说明](https://www.kimi.ai/policies/kimi-crawlers)：`KimiBot`、`Kimi-SearchBot`、`Kimi-User`，各有官方 IP JSON | 官方分别确认训练、搜索索引、用户主动读取，可分别计入 Kimi 类型 |
| Claude | [官方说明](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)：`ClaudeBot`、`Claude-SearchBot`、`Claude-User`；[统一 IP 清单](https://claude.com/crawling/bots.json) | 分别为训练、搜索与用户主动读取；相同清单验证来源，UA 决定类型 |
| 字节 / 豆包 | 找到[头条站长候选文档](https://zhanzhang.toutiao.com/docs/intro/26899)，本次无法直接读取；尚无本次确认的豆包专属官方验证 | 不将 Bytespider / 头条搜索等公司关联访问计作豆包 |
| 阿里 / Qwen | 本次定向核查未发现可靠官方爬虫 UA、IP 或 DNS 验证规则 | 不发明 QwenBot / TongyiBot 规则；不将其他阿里系爬虫计作 Qwen |
| 智谱 / GLM | 本次未找到可靠官方身份验证规则 | 第三方 `ChatGLM-Spider` 名称不足以确认智谱运营或 GLM 产品关联 |
| 小米 AI | 本次未找到可靠官方身份验证规则 | 不编造 UA；仅展示图鉴与“暂无可靠验证” |

## Kimi 清单结构

- `KimiBot`：[https://www.kimi.ai/policies/kimibot.json](https://www.kimi.ai/policies/kimibot.json)
- `Kimi-SearchBot`：[https://www.kimi.ai/policies/kimi-searchbot.json](https://www.kimi.ai/policies/kimi-searchbot.json)
- `Kimi-User`：[https://www.kimi.ai/policies/kimi-user.json](https://www.kimi.ai/policies/kimi-user.json)

三份接口均实测可读取。格式为 `{ "creationTime": "…", "prefixes": [{ "ipv4Prefix": "…/32" }] }`，解析时兼容 `ipv6Prefix`。官方说明 IP 动态变化，应定期刷新缓存；清单获取失败不可放宽为仅 UA 验证。2026-10-20 读到 KimiBot 清单日期为 2026-05-18，包含四个 IPv4 `/32`，不应永久写死地址。

Claude 的 `bots.json` 使用同样的 `creationTime` 与 `prefixes[].ipv4Prefix` 结构，本次版本日期为 2026-10-07。该清单为 Anthropic 统一来源范围，不能根据 IP 区分三种类型，必须联合对应 UA。

## Google 的必要区分

[Google 官方爬虫概览](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers)与[验证说明](https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot)：Googlebot 属于 Google 搜索；[Google-Extended](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-extended)是 robots.txt 内容用途控制标识，不是独立 HTTP UA。不能把 Googlebot 请求宣布为 Gemini 来访。

“暂无可靠验证”只说明当前证据不足，并不断言该公司没有爬虫。今后只有增加可核实的官方证据后，才启用对应已验证计数。
