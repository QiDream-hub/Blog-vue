# Blog Publisher

博客内容发布工具 - 在 lmjweb 中注册元数据并管理文件。

## 快速开始

```bash
# 安装依赖
npm install

# 配置
cp config.example.json config.json
# 编辑 config.json 填入你的配置

# 运行
npm run pub health
```

## 文档

- [使用指南](./docs/usage.md) - CLI 和 API 使用说明
- [设计文档](./docs/design.md) - 架构设计和实现细节
- [配置说明](./docs/config.md) - 配置文件和环境变量

## 核心命令

```bash
# 注册文件
npm run pub register image --file "./cover.jpg"
npm run pub register article --file "./post.md" --title "标题"

# 创建关联
npm run pub link cover --article "01art..." --image "01img..."
npm run pub link tags --article "01art..." --names "技术，随笔"
npm run pub link blog --article "01art..."
```

## 项目结构

```
tools/
├── package.json        # 依赖配置（复用主项目）
├── config.json         # 工具配置
├── publisher.js        # 核心 API
├── cli.js              # CLI 工具
└── docs/
    ├── usage.md        # 使用指南
    ├── design.md       # 设计文档
    └── config.md       # 配置说明
```

## 作为子项目使用

本工具可独立于 Vue Blog 前端使用：

```bash
# 在其他项目中使用
cd /path/to/other-project
npm link /path/to/vue-blog/blog/tools

# 或使用 API
import { Publisher } from '/path/to/vue-blog/blog/tools/publisher.js'
```
