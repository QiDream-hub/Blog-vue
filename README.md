# Vue Blog

Vue 3 + Vite 构建的博客前端项目，配合 lmjweb 元数据服务和 Nginx 反向代理。

## 项目结构

```
.
├── src/                    # Vue 前端源码
├── docs/                   # 项目文档
│   ├── architecture.md     # 架构文档
│   └── lmjweb-integration.md
├── tools/                  # 博客发布工具（子项目）
│   ├── README.md           # 工具文档
│   ├── publisher.js        # 核心 API
│   ├── cli.js              # CLI 工具
│   └── docs/               # 工具文档
└── memory/                 # 项目记忆
```

## 快速开始

### 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 发布工具

发布工具是一个独立的子项目，位于 `tools/` 目录。

```bash
cd tools

# 安装依赖（复用主项目）
npm install commander

# 配置
cp config.example.json config.json
# 编辑 config.json

# 运行
node cli.js health
```

详细文档见 [tools/README.md](tools/README.md)。

## 架构

```
┌─────────────┐
│   用户请求   │
└──────┬──────┘
       ▼
┌─────────────┐
│    Nginx    │─── /img/{ptr} ──────→ 图片文件
│             │─── /article/{ptr} ──→ 文章内容
└──────┬──────┘
       │
       └─── 反向代理 ────→ Vue Blog (前端)
                               │
                               └─── API 读取 ────→ lmjweb (元数据)
```

## 文档

- [架构文档](docs/architecture.md) - 系统架构和设计
- [lmjweb 集成](docs/lmjweb-integration.md) - 与 lmjweb 服务的集成指南
- [发布工具](tools/README.md) - 内容发布工具使用指南

## 相关项目

- [lmjweb](https://github.com/your-repo/lmjweb) - 元数据服务
- [lmjcore_web](docs/lmjcore_web/) - lmjweb Web API 文档
