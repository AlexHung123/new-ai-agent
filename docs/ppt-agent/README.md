# Agent PPT

Date: 2026-09-03  
Status: **In progress** (discover → outline → plan → theme HTML 预览 → 可编辑 pptx 已接通；可选模型写 HTML/SVG、截图保底未做)

内网 Web Agent 上的 PPT 流水线。环境不能出外网，资料靠用户上传（Word/PDF 等经 anydoc 转 Markdown）。

一句话定位：

**元宝的壳**（Web 对话、上传、流式、下载）+ **顾问公司的骨**（调研 / 便利贴 / 策划 / Bento）+ **本仓库已有的手**（anydoc + pi-agent-core tools）+ **Flash 的脑**（只填结构和文案，不填坐标和色值）。

不要把 ppt-master / DeepPresenter 整仓塞进来。导出脚本和页类型约束可以借鉴，流水线以四段式为准。

版式线框目录（浏览器打开）：[layouts.html](./layouts.html)  
代码规范：`src/lib/ppt/layouts.ts`

---

## 1. 目标

用户用一句话 + 可选上传件，经过可停顿的阶段，得到：

1. 可拖拽的便利贴大纲
2. 每页锁死的策划 JSON（卡片数量、位置、文案）
3. 主题换皮后的网页预览
4. **可在 Office / WPS 里改字、改色、拖卡片的 `.pptx`**

质量上限来自：调研是否真、大纲是否能改、策划是否锁结构、主题是否专业。不把上限押在模型审美或自由画 SVG 上。

### 1.1 非目标

| 不做 | 原因 |
|------|------|
| 外网检索（Tavily / Grok / 国内搜索） | 项目不能联网；事实只来自上传 MD + 用户确认的 brief |
| CubeSandbox / E2B | 工具已在后端 in-process；沙箱是后话 |
| 一进对话就出花活设计 | 内容没立住禁止进入 design |
| 模型自由写 HTML/SVG 当主路径 | Flash 无视觉自检，会乱坐标、增删卡、填 hex |
| `mixed` 自由网格 | 最容易畸形 |
| 独立 KPI / 结尾 layout | KPI = `three_col` + `role: stat`；结尾复用 `cover` |
| 截图嵌入 pptx | 几乎不能改字；生产镜像没有 Playwright / 中文字体 |
| 模型从零写导出器 | `export_pptx` 是写死的 PptxGenJS 脚本 |

### 1.2 和元宝 / WorkBuddy 的关系

| | 本项目 | WorkBuddy 内置 pptx skill | 腾讯元宝 |
|--|--------|---------------------------|----------|
| 交付 | 真 pptx（形状 + 文本框） | 真 pptx（PptxGenJS） | 真 pptx + 腾讯文档 |
| 谁写坐标 | 固定脚本，模型只填 JSON | 固定页面类型 + 主题 | 未公开，偏模板/文档引擎 |
| 预览 | 网页 HTML，同一份 plan | 工作台 / 本地文件 | 对话预览，在线点选编辑弱 |
| 产品流程 | 顾问 → 便利贴 → 策划 → 换皮 | 看所装 skill | 更接近一键生成 + 对话改页 |

WorkBuddy **默认办公 pptx 技能**（PptxGenJS + 写死版式 + 真形状）和本仓库导出理念最像。元宝像的是交互壳，不是这套 Bento 导出管线。两边都没有把「模型自由写 HTML/SVG」当成官方默认。

---

## 2. 产品流程

```
用户一句话 + 可选上传
    ↓
① discover  顾问轮：读上传 MD，最多 3～5 个问题（为谁 / 目的 / 页数 / 风格）
    ↓ 用户确认，或说「按你判断」填默认
② outline   便利贴大纲：[PPT_OUTLINE] JSON，前端可拖拽 / 撕掉 / 加页
    ↓ 用户确认
③ plan      逐页策划：只定 layout 枚举 + 卡片文案，黑白线框
    ↓ 可选：用户改字
④ design    同一结构套 theme_id，网页预览
    ↓
⑤ export    同一份 plan → 可编辑 pptx / HTML / JSON
```

原则：不要一进对话就出花活。**内容没立住之前，禁止进入第④步。**

点某张便利贴 = 只重做该 `page_id` 的策划，设计先别动。

---

## 3. 阶段门控

```ts
type Stage = "discover" | "outline" | "plan" | "design" | "export";
```

存在 Postgres `ppt_decks`（按 `chatId`），不靠模型「记得该策划了」。每个 tool 检查 stage，写错直接拒绝。

| tool | 允许的 stage |
|------|----------------|
| `ask_user` / `commit_brief` | discover |
| `commit_outline` | outline |
| `patch_outline` | outline, plan, design |
| `commit_page_plan` | plan |
| `get_page_plan` | plan, design, export |
| `get_deck` | 全部 |
| `set_theme` | design, export |
| `advance_stage` | 除 export 外；只能前进一步 |
| `export_deck` | design, export |

前进条件：

- → outline：已有 brief
- → plan：已有 outline
- → design：大纲里每一页都有 plan
- → export：已到 design（主题有默认 `navy-bento`）

---

## 4. 数据模型

会话态（服务端为真相；SSE `ppt` 事件广播给前端）：

```ts
{
  stage, brief, questions,
  outline,                    // [PPT_OUTLINE]
  pages: Record<page_id, PagePlan>,
  themeId, selectedPageId
}
```

页级策划：

```json
{
  "page_id": "p-04",
  "title": "竞争格局",
  "intent": "并列对比三家",
  "layout": "three_col",
  "kind": "content",
  "cards": [
    { "id": "c1", "role": "hero|body|stat|quote|step|meta", "title": "", "body": "", "span": "1/3" }
  ],
  "notes": "演讲者备注"
}
```

约束：

- `layout` 只允许下列 10 个枚举，Flash 不得发明网格
- 标题 ≤ 40 字、正文 ≤ 80 字（硬截断）
- 设计阶段不重写结构，只加 `themeId`
- 封面 / 目录 / 章节 / 结尾在 `commit_outline` 时自动生成结构页 plan；内容页在 plan 阶段逐页提交

---

## 5. 十套锁定版式

画布 **1280×720**，边距 48，间距 24，圆角 16。内容页先占 56px 标题栏。

| `layout` | 中文 | 卡片（锁死） | 何时 |
|----------|------|--------------|------|
| `cover` | 封面 | 1 × hero full | 大纲封面；结尾复用 |
| `toc` | 目录 | 4 × step（随 parts，3～5） | 一章一行，不写正文 |
| `section` | 章节页 | 1 × hero full | 每个 part 第一页 |
| `hero` | 单焦点 | 1 × hero full | 一句结论 / 金句 |
| `two_sym` | 对称双栏 | 2 × body 1/2 | A vs B，两卡必须对等 |
| `two_asym` | 主次双栏 | hero 2/3 + stat 1/3 | 正文 + 数字/引用 |
| `three_col` | 三列 | 3 × body 1/3 | 三点论述；三张 stat = KPI |
| `quad` | 四宫格 | 4 × body 1/2 | 四项能力、SWOT |
| `hero_plus_row` | 上主下辅 | 1 hero + 3 body | 结论 + 三条证据 |
| `timeline` | 时间线 | 4 × step 1/4（3～5） | 路线图；并列不要用 |

主题写死三套 CSS / 导出 hex：`navy-bento`、`slate-paper`、`forest-board`。模型不填 hex。

---

## 6. 运行时怎么切

| 角色 | 放哪 | 干什么 |
|------|------|--------|
| 对话 / 状态机 | Web + pi-agent-core | 阶段门控、流式、问问题、写 JSON |
| 模型 | 已配置的 chat 模型 | 调研摘要、大纲、策划 |
| 检索 | 无外网；`fs_*` 读用户资料库 | 给大纲和策划喂事实 |
| 执行 | 后端 in-process | 校验 schema、渲 HTML、PptxGenJS 导出 |
| 浏览器 | 便利贴墙 + 线框 / 主题预览 | 拖拽 `patch_outline`，改字写回 plan |

不要把整个 Pi CLI 塞进 VM。Agent 留在后端。

- 新 `focusMode`：`agentPpt`（权限暂与 Writing 相同：`chatGuideAgent:execute`）
- 上传复用 Writing 用户库（anydoc → MD → `fs_ls/read/grep/find`）
- deck 按 **chat** 存，不是扫整个用户库
- Agent id：`ppt-chat-agent-${chatId}`
- 提示词按 stage 注入 turn prefix，避免 1M 窗口堆全文
- 顾问轮：先读附件再问，问题不超过 5 个；用户说「按你判断」则 `commit_brief` + `defaultsApplied`

---

## 7. 设计与导出（双轨，同一份 plan）

```
page_plan JSON + theme_id
        ↙                    ↘
  前端 HTML 预览           exportPptxBuffer()
  （改页快）               → 可编辑 .pptx
```

### 7.1 网页预览

确定性渲染：`layout` 枚举 → CSS Grid，卡片一一对应。第④步是换皮，不是模型画画。

以后若要「模型写 HTML」只能当可选轨，且必须：卡片 id 与 plan 一一对应、theme token 白名单、无 `<script>`、校验失败回退确定性渲染。主路径仍是代码渲。裸 SVG 进 Office 更后。

### 7.2 pptx（已实现）

`src/lib/ppt/exportPptx.ts`：PptxGenJS 把每张卡映射成 **圆角矩形 + 文本框**。

- 16:9 = 10" × 5.625"，与 1280×720 对齐（1px = 10/1280 英寸）
- 颜色来自主题 token，6 位 hex、**禁止 `#`**（否则 PptxGenJS 会坏文件）
- 中文字体：`Microsoft YaHei`
- 演讲者备注写入 `notes`
- 打开后可改字、改色、拖卡片；不是整页图
- 不是幻灯片母版占位符，也不是公司 `.potx`

截图保底、整页 SVG 插入：等形状轨不够用（复杂图）再考虑，且只对单页，避免整份变成不可改。

---

## 8. 前端

三块，不要做成巨大 PPT 编辑器：

1. **对话栏**：流式 + 工具状态（正在读资料 / 正在写第 6 页策划）
2. **便利贴墙**：读 outline，拖拽同步 `patch_outline`
3. **双预览**：左策划线框（plan JSON 画灰卡片，plan 阶段可改字），右主题稿

没有设计也能下载 JSON。内容没立住时禁用设计 / 导出 pptx。

SSE：`type: "ppt"` 推送 `{ deck }`，便利贴和预览订阅它，不要解析聊天里的 JSON。

---

## 9. 落地状态

| 切片 | 状态 |
|------|------|
| Week 1 能聊能贴：discover + outline + 便利贴 + JSON | 已接通 |
| Week 2 策划线框：page_plan → 灰卡片，点便利贴重做该页 | 已接通 |
| Week 3 主题渲染 + 导出：1 套主题 × 10 layout；pptx / HTML / JSON | 已接通（pptx 几何与 zip 结构已用脚本冒烟，未在 Office 里点开验收） |
| 可选：模型写 HTML 失败回退 | 未做 |
| 截图保底 / SVG 进 Office | 未做 |
| CubeSandbox | 不做，除非导出需要 LibreOffice 且不能进主镜像 |

重启服务以应用 `drizzle/pg/0004_ppt_decks.sql`。

---

## 10. 代码地图

| 路径 | 职责 |
|------|------|
| `src/lib/agents.tsx` | `agentPpt` 卡片、`usesWritingLibrary` |
| `src/lib/search/pptAgent.ts` | 回合：读 deck、绑 fs + ppt tools、prompt |
| `src/lib/search/shared/prompts/pptAgentSystemPrompt.ts` | 短 system |
| `src/lib/search/shared/prompts/pptTurnPrefix.ts` | 按 stage 注入状态 + 附件 INDEX |
| `src/lib/ppt/types.ts` | Stage、brief、outline、plan |
| `src/lib/ppt/layouts.ts` | 10 套枚举与 CSS Grid |
| `src/lib/ppt/stage.ts` | tool 阶段门、前进条件 |
| `src/lib/ppt/outline.ts` / `plan.ts` | 解析、赋 id、结构页 plan |
| `src/lib/ppt/store.ts` | `ppt_decks` CRUD |
| `src/lib/ppt/tools.ts` | 阶段门控 AgentTool |
| `src/lib/ppt/themes.ts` / `render.ts` | 主题变量、HTML |
| `src/lib/ppt/exportLayout.ts` / `exportPptx.ts` | 网格→英寸、PptxGenJS |
| `src/app/api/ppt/deck/route.ts` | GET/PUT deck |
| `src/app/api/ppt/export/route.ts` | `format=json\|html\|pptx` |
| `src/components/ppt/*` | 阶段条、问询表、便利贴、幻灯预览 |
| `drizzle/pg/0004_ppt_decks.sql` | 表 |

测试：`src/lib/ppt/*.test.ts`。本环境 Vitest 可能因 rolldown 绑定起不来；可用 `npx tsx` 对导出做 zip 冒烟。
