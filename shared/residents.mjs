// 趣味动物形象，不是各品牌的官方吉祥物。身份验证由服务端负责。
export const residents = [
  { id: 'deepseek', emoji: '🐳', name: '深度求索 DeepSeek', brand: 'DeepSeek', company: 'DeepSeek / 深度求索', habitat: '鲸湾', note: '尚无可靠的独立 DeepSeek 爬虫验证；第三方搜索服务来访不代表 DeepSeek 来访。', verification: '暂无可靠验证' },
  { id: 'openai', emoji: '🦊', name: 'OpenAI / ChatGPT', brand: 'OpenAI / ChatGPT', company: 'OpenAI', habitat: '狐狸林', note: '保留 GPTBot 训练、OAI-SearchBot 搜索和 ChatGPT-User 用户主动请求等真实类型；UA 与对应官方 IP 清单联合验证。', verification: '官方 IP 清单与对应 UA 联合验证' },
  { id: 'anthropic', emoji: '🦌', name: '克劳德 Claude', brand: 'Claude', company: 'Anthropic', habitat: '鹿鸣林', note: 'ClaudeBot 为模型训练采集，Claude-SearchBot 为搜索索引，Claude-User 为用户主动请求；三种类型分别记录。', verification: 'Anthropic 官方 bots.json 与真实 UA 联合验证' },
  { id: 'google', emoji: '🦉', name: '谷歌 Google / Gemini', brand: 'Google / Gemini', company: 'Google', habitat: '猫头鹰树屋', note: 'Googlebot 仅代表 Google 搜索爬虫，不证明 Gemini 来访；Google-Extended 是内容用途控制标识，不是独立 HTTP 爬虫 UA。', verification: '仅验证实际 Google 爬虫类型，不将 Googlebot 计作 Gemini' },
  { id: 'perplexity', emoji: '🦝', name: '智能搜索 Perplexity', brand: 'Perplexity', company: 'Perplexity AI', habitat: '浣熊溪', note: '保留 PerplexityBot 与 Perplexity-User 等真实类型，分别核对对应官方 IP 清单。', verification: '官方 IP 清单与对应 UA 联合验证' },
  { id: 'xai', emoji: '🐺', name: '格罗克 Grok', brand: 'Grok', company: 'xAI', habitat: '月影狼谷', note: '仅有公司关联或自报 UA 不足以确认 Grok；未具备可靠验证时不累计已验证来访。', verification: '暂无可靠验证' },
  { id: 'meta', emoji: '🐙', name: '智能助手 Meta AI', brand: 'Meta AI', company: 'Meta', habitat: '章鱼礁', note: '仅有 Meta 公司相关请求不代表 Meta AI 产品来访；具体类型与身份均须有可靠证据。', verification: '暂无可靠验证' },
  { id: 'unknown', emoji: '🐛', name: '未知爬虫 Unknown', brand: 'Unknown', company: '未知运营方', habitat: '观察草丛', note: '疑似爬虫与身份未验证请求单独展示，不计入已验证 AI 来访。', verification: '未知或未验证' },
  { id: 'doubao', emoji: '🐱', name: '豆包 Doubao', brand: 'Doubao', company: 'ByteDance / 字节跳动', habitat: '猫咪花园', note: 'Bytespider 与头条搜索的公司关联不能证明豆包产品来访；尚未确认可靠的豆包专属验证。', verification: '暂无可靠验证' },
  { id: 'kimi', emoji: '🐰', name: '月之暗面 Kimi', brand: 'Kimi', company: 'Moonshot AI / 月之暗面', habitat: '月光兔园', note: 'KimiBot 为训练采集，Kimi-SearchBot 为搜索索引，Kimi-User 为用户主动请求；三种真实类型分别记录并使用各自官方 IP 清单验证。', verification: '对应官方 IP JSON 与 KimiBot / Kimi-SearchBot / Kimi-User 联合验证' },
  { id: 'qwen', emoji: '🐼', name: '通义千问 Qwen', brand: 'Qwen', company: 'Alibaba / 阿里巴巴', habitat: '熊猫竹园', note: '尚未找到可靠的 Qwen 官方爬虫身份验证；阿里系其他搜索爬虫不能直接计作 Qwen。', verification: '暂无可靠验证' },
  { id: 'glm', emoji: '🦜', name: '智谱 GLM', brand: 'GLM', company: 'Zhipu AI / 智谱 AI', habitat: '鹦鹉雨林', note: '尚未找到可靠的官方爬虫身份验证；第三方目录中的 ChatGLM-Spider 名称不构成官方身份或产品归属证据。', verification: '暂无可靠验证' },
  { id: 'xiaomi', emoji: '🐿️', name: '小米 AI', brand: 'Xiaomi AI', company: 'Xiaomi / 小米', habitat: '松鼠松林', note: '尚未找到小米相关 AI 服务的可靠官方爬虫身份验证，不根据名称或公司网络归属推断 AI 来访。', verification: '暂无可靠验证' },
];
