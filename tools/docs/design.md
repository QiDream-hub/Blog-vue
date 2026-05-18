# 设计文档

## 概述

Blog Publisher 是一个独立的博客内容发布工具，负责在 lmjweb 元数据服务中注册博客内容并管理相关文件。

## 核心理念

```
┌─────────────────────────────────────────────────────────────┐
│                    发布工具 (Publisher)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  输入                    处理                    输出        │
│  ──→  [文件 + 元数据]  ──→  [注册 + 关联]  ──→  [指针]  ──→ │
│                                                             │
│  • 文章 Markdown         • 在 lmjweb 创建对象     • 文章指针   │
│  • 图片文件              • 移动文件到 Nginx 目录    • 图片指针   │
│  • 元数据信息            • 创建对象间关联                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 设计原则

1. **元数据与文件分离**：lmjweb 存储元数据，Nginx 存储文件
2. **指针即文件名**：使用 lmjweb 指针作为文件名，简化访问逻辑
3. **原子化操作**：每个操作独立、可组合、可重试
4. **双接口设计**：同时提供可编程 API 和 CLI 工具

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户层                               │
│                  (开发者 / 发布脚本 / CI/CD)                 │
└─────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │   CLI 工具         │           │   Publisher API   │
        │   (cli.js)        │           │   (publisher.js)  │
        └─────────┬─────────┘           └─────────┬─────────┘
                  │                               │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │      Publisher 核心类        │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │   lmjweb 服务    │ │   imagesDir     │ │  articlesDir    │
    │  (元数据)        │ │  (图片文件)      │ │  (文章文件)     │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 核心操作

### 1. 注册文件 (Register)

在 lmjweb 中创建对象，同时将文件移动到 Nginx 目录（使用指针命名）。

```javascript
// 注册图片
const cover = await publisher.registerImage('./cover.jpg', 'article-cover.jpg')
// → { ptr: '01img...', path: '/var/www/images/01img...', filename: 'article-cover.jpg' }

// 注册文章
const article = await publisher.registerArticle({
  filePath: './article.md',
  title: '文章标题',
  slug: 'my-article'
})
// → { ptr: '01art...', path: '/var/www/articles/01art...', title, slug }
```

### 2. 创建关联 (Link)

通过指针建立对象间的关系。

```javascript
// 关联封面
await publisher.linkCover(articlePtr, imagePtr)

// 关联标签（自动创建不存在的标签）
await publisher.linkTag(articlePtr, '技术')

// 注册到博客
await publisher.linkToBlog(articlePtr)
```

## 数据结构

```
博客信息 (blogInfoPtr)
├─ title: "博客名称"
├─ posts: 02posts... (set - 所有文章指针)
└─ tags: 02tags... (set - 所有标签对象指针)

文章对象 (01art...)
├─ title: "文章标题"
├─ slug: "url-slug"
├─ cover: 01img... (封面图片指针，可选)
└─ tags: 02arttags... (set - 标签名集合)

标签对象 (01tag...)
├─ name: "标签名"
└─ posts: 02tagposts... (set - 该标签下的文章指针)

图片对象 (01img...)
└─ filename: "original.jpg"
```

## 文件存储

### 命名规则

| 文件类型 | 目录 | 文件名 | 示例 |
|---------|------|--------|------|
| 图片 | `imagesDir` | 图片指针 | `/var/www/images/01img123...` |
| 文章 | `articlesDir` | 文章指针 | `/var/www/articles/01art456...` |

### Nginx 访问

```nginx
location /img/ {
    alias /var/www/images/;
}

location /article/ {
    alias /var/www/articles/;
}
```

```
图片：https://blog.example.com/img/01img123...
文章：https://blog.example.com/article/01art456...
```

## 发布流程

```bash
# 1. 注册文章
npm run pub register article --file "./post.md" --title "标题" --slug "my-article"

# 2. 注册封面
npm run pub register image --file "./cover.jpg"

# 3. 创建关联
npm run pub link cover --article "01art..." --image "01img..."
npm run pub link tags --article "01art..." --names "技术，随笔"
npm run pub link blog --article "01art..."
```

## 扩展性

- **批量操作**：支持并发注册多篇文章
- **插件化**：未来可支持图片优化、SEO 元数据等插件
- **CI/CD 集成**：可通过 API 集成到自动化流程
