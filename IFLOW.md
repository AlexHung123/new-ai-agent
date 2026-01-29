# iFlow 上下文文档

## 项目概述

**aiagent** 是一个隐私优先的 AI 搜索引擎，完全运行在用户自己的硬件上。它结合了来自互联网的广泛知识，支持本地 LLM（通过 Ollama）和云提供商（OpenAI、Claude、Groq 等），提供带有引用来源的准确答案，同时保持搜索完全私密。

### 核心技术栈

- **前端框架**: Next.js 15.2.6 (React 18)
- **语言**: TypeScript 5.9.3
- **样式**: Tailwind CSS 3.3.0
- **AI 框架**: LangChain 1.0.1
- **数据库**:
  - SQLite (Drizzle ORM) - 用于应用数据存储
  - PostgreSQL (Prisma ORM) - 用于 LimeSurvey 数据集成
- **搜索引擎**: SearXNG（通过 JSON API）
- **支持的主要 AI 提供商**: OpenAI、Anthropic Claude、Google Gemini、Groq、Ollama（本地）

### 项目架构

aiagent 采用现代化的全栈架构，主要组件包括：

1. **用户界面**: 基于 Next.js 的 Web 界面，支持聊天、搜索、发现等功能
2. **Agent/Chains**: 基于 LangChain 的智能代理系统，负责预测下一步动作、理解用户查询、决定是否需要网络搜索
3. **搜索引擎**: 使用 SearXNG 进行网络搜索获取元数据和来源
4. **大语言模型 (LLMs)**: 用于理解内容、编写响应和引用来源
5. **嵌入模型**: 使用余弦相似度和点积距离等算法重新排序搜索结果，提高准确性

### 主要功能

- 🤖 支持所有主要 AI 提供商（本地和云端）
- ⚡ 三种智能搜索模式：平衡模式、快速模式、质量模式
- 🎯 六种专业化焦点模式：学术论文、YouTube 视频、Reddit 讨论、Wolfram Alpha 计算、写作辅助、通用网络搜索
- 🔍 基于 SearXNG 的隐私保护网络搜索
- 📷 图像和视频搜索
- 📄 文件上传（PDF、文本文件、图片）
- 🌐 特定域名搜索
- 💡 智能搜索建议
- 📚 发现功能（浏览有趣文章和趋势内容）
- 🕒 搜索历史（本地保存）
- 📊 LimeSurvey 调查数据分析（使用 AI 进行语义聚类）

## 构建和运行

### 开发环境设置

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 生产构建

```bash
# 构建应用
npm run build

# 启动生产服务器
npm run start
```

### Docker 部署（推荐）

```bash
# 完整版本（包含 SearXNG）
docker run -d -p 3000:3000 -v aiagent-data:/home/aiagent/data -v aiagent-uploads:/home/aiagent/uploads --name aiagent itzcrazykns1337/aiagent:latest

# 精简版本（使用自己的 SearXNG 实例）
docker run -d -p 3000:3000 -e SEARXNG_API_URL=http://your-searxng-url:8080 -v aiagent-data:/home/aiagent/data -v aiagent-uploads:/home/aiagent/uploads --name aiagent itzcrazykns1337/aiagent:slim-latest
```

### 代码质量检查

```bash
# 运行 ESLint
npm run lint

# 格式化代码
npm run format:write
```

### 数据库迁移

项目使用 Drizzle ORM 管理 SQLite 数据库：

```bash
# 生成迁移文件
npx drizzle-kit generate

# 应用迁移
npx drizzle-kit migrate

# 推送 schema 更改
npx drizzle-kit push
```

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面和 API 路由
│   ├── agents/            # 代理页面
│   ├── api/               # API 端点
│   │   ├── chat/          # 聊天交互
│   │   ├── search/        # 搜索 API
│   │   ├── config/        # 配置管理
│   │   ├── providers/     # 模型提供商
│   │   └── uploads/       # 文件上传
│   ├── c/[chatId]/        # 聊天页面
│   └── library/           # 库页面
├── components/            # React 组件
│   ├── Chat.tsx          # 聊天组件
│   ├── ChatWindow.tsx    # 聊天窗口
│   ├── MessageBox.tsx    # 消息框
│   ├── MessageInput.tsx  # 消息输入
│   ├── Sidebar.tsx       # 侧边栏
│   ├── Settings/         # 设置相关组件
│   └── ui/               # UI 基础组件
├── lib/                   # 核心业务逻辑
│   ├── actions.ts        # 服务端动作
│   ├── agents.tsx        # 代理定义
│   ├── config/           # 配置管理
│   │   └── index.ts      # ConfigManager 类
│   ├── db/               # 数据库相关
│   │   └── schema.ts     # Drizzle schema 定义
│   ├── hooks/            # React Hooks
│   ├── models/           # 模型相关
│   ├── postgres/         # PostgreSQL 相关（LimeSurvey）
│   │   └── limeSurvery.ts # LimeSurvey 数据获取
│   ├── prompts/          # 提示词模板
│   ├── search/           # 搜索代理和逻辑
│   │   ├── metaSearchAgent.ts  # 元搜索代理（主要搜索逻辑）
│   │   └── surveyAgent.ts      # 调查数据分析代理
│   └── utils/            # 工具函数
├── types/                # TypeScript 类型定义
└── instrumentation.ts    # 应用监控和追踪
```

### 关键配置文件

- `next.config.mjs`: Next.js 配置（设置 basePath 为 `/itms/ai`，启用独立输出）
- `tsconfig.json`: TypeScript 配置（使用路径别名 `@/*` 映射到 `./src/*`）
- `drizzle.config.ts`: Drizzle ORM 配置（SQLite 数据库）
- `tailwind.config.ts`: Tailwind CSS 配置
- `package.json`: 项目依赖和脚本

### 配置管理

项目使用 `ConfigManager` 类（位于 `src/lib/config/index.ts`）管理配置：

- 配置文件位置: `data/config.json`
- 支持环境变量覆盖（特别是 AI 提供商配置）
- 配置包括：
  - 用户偏好（主题、测量单位、自动媒体搜索）
  - 个性化设置（系统指令）
  - 模型提供商配置（OpenAI、Claude、Groq、Ollama 等）
  - 搜索设置（SearXNG URL）

## 开发约定

### 代码风格

1. **TypeScript**: 所有代码使用 TypeScript 编写，严格模式已启用
2. **格式化**: 使用 Prettier 进行代码格式化
3. **Linting**: 使用 ESLint 进行代码检查（Next.js 配置）
4. **组件结构**: React 组件采用函数式组件，使用 Hooks

### 编码实践

1. **提交前检查**:
   - 确保代码功能正确，经过充分测试
   - 运行 `npm run format:write` 格式化代码
   - 运行 `npm run lint` 检查代码质量

2. **文件命名**:
   - React 组件使用 PascalCase（如 `ChatWindow.tsx`）
   - 工具函数和模块使用 camelCase（如 `serverUtils.ts`）
   - 常量和配置使用 camelCase

3. **导入顺序**:
   - 外部库导入
   - 内部模块导入（使用 `@/` 别名）
   - 相对路径导入

4. **错误处理**:
   - 使用 try-catch 块处理异步错误
   - 提供有意义的错误消息
   - 在适当的地方使用事件发射器（eventEmitter）进行异步通信

### 数据库操作

- **SQLite**: 使用 Drizzle ORM 进行应用数据存储（聊天记录、配置等）
- **PostgreSQL**: 使用 Prisma ORM 访问 LimeSurvey 数据
- Schema 定义位于 `src/lib/db/schema.ts`（Drizzle）和 `prisma/schema.prisma`（Prisma）

### AI/LLM 集成

- 使用 LangChain 框架进行 LLM 集成
- 支持结构化输出（使用 Zod schemas）
- 使用 RunnableSequence 构建复杂链
- 支持流式响应和事件追踪

### 特殊功能实现

#### LimeSurvey 调查数据分析

`src/lib/search/surveyAgent.ts` 实现了调查数据的语义聚类功能：

1. 从 PostgreSQL 获取 LimeSurvey 数据（通过 `getLimeSurveySummaryBySid`）
2. 使用 LLM 进行语义聚类（第一轮）
3. 验证覆盖范围（确保不遗漏、不重复）
4. 对未分类项目进行重新分配（第二轮）
5. 生成 Markdown 格式的聚类结果

#### 元搜索代理

`src/lib/search/metaSearchAgent.ts` 实现了核心搜索功能：

1. 创建回答链（基于 LLM 和嵌入模型）
2. 重新排序文档（使用余弦相似度）
3. 处理文件上传（PDF、文本等）
4. 流式响应处理
5. 支持不同的优化模式（speed、balanced、quality）

## API 端点

主要 API 路由位于 `src/app/api/`：

- `/api/chat`: 聊天交互
- `/api/search`: 直接搜索访问
- `/api/config`: 配置管理
- `/api/providers`: 模型提供商管理
- `/api/uploads`: 文件上传

详细的 API 文档请参考 `docs/API/SEARCH.md`。

## 环境变量

项目支持通过环境变量配置：

- `DATA_DIR`: 数据目录路径（默认为当前工作目录）
- `SEARXNG_API_URL`: SearXNG 实例 URL
- 各 AI 提供商的 API 密钥和配置（通过 ConfigManager 自动加载）

## 常见问题

### Ollama 连接问题

- **Windows/Mac**: 使用 `http://host.docker.internal:11434`
- **Linux**: 使用 `http://<private_ip_of_host>:11434`
- 确保 Ollama 在 `0.0.0.0` 上监听，而不是 `127.0.0.1`

### Lemonade 连接问题

- **Windows/Mac**: 使用 `http://host.docker.internal:8000`
- **Linux**: 使用 `http://<private_ip_of_host>:8000`
- 确保 Lemonade 服务器正在运行并接受来自所有接口的连接

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改（确保代码已格式化和 lint）
4. 推送到分支
5. 创建 Pull Request

详细的贡献指南请参考 `CONTRIBUTING.md`。

## 许可证

MIT License

## 联系方式

- GitHub Issues: 报告 bug 和功能请求
- Discord: 加入社区讨论和支持

---

**注意**: 此文档由 iFlow 自动生成，用于为未来的交互提供上下文。如有任何疑问或需要更新，请随时联系项目维护者。