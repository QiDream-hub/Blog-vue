# Vue Blog 与 lmjweb 集成指南

## 架构说明

```
┌─────────────┐
│   用户请求   │
└──────┬──────┘
       ▼
┌─────────────┐
│    Nginx    │─── /img/{ptr} ──────→ 图片文件内容
│             │
│             │─── /article/{ptr} ──→ 文章 Markdown 内容
└──────┬──────┘
       │
       └─── 反向代理 ────→ Vue Blog
                               │
                               └─── API 读取 ────→ lmjweb 元数据
```

## lmjweb 数据结构

### 博客信息对象（固定指针）
```
ptr: 01blog... (配置在 src/config/blog.js)
members:
  - title: "我的博客"
  - posts: 02posts... (set 指针 - 所有文章)
  - tags: 02tags... (set 指针 - 所有标签对象)
```

### 标签对象
```
ptr: 01tag...
members:
  - name: "技术"
  - posts: 02tagposts... (set 指针 - 该标签下的文章)
```

### 文章对象
```
ptr: 01art...
members:
  - title: "文章标题"
  - slug: "article-slug"
  - cover: 01img... (封面图片指针)
  - tags: 02arttags... (set 指针 - 该文章的标签名集合)
```

### 图片对象
```
ptr: 01img...
members:
  - filename: "original.jpg"
```

## 部署步骤

### 1. 配置 lmjweb 连接

编辑 `src/config/blog.js`：

```javascript
export const BLOG_CONFIG = {
  LMJWEB_API: 'http://localhost:8080',  // lmjweb 服务地址
  BLOG_INFO_PTR: '01abc123...',         // 博客信息对象指针
  IMAGE_BASE: '/img/',
  ARTICLE_BASE: '/article/'
}
```

### 2. 在 lmjweb 中创建数据结构

```bash
# 1. 创建博客信息对象
curl -X POST http://localhost:8080/obj
# 返回：{"ptr": "01blog123..."}

# 2. 设置博客标题
curl -X PUT http://localhost:8080/obj/01blog123.../title \
  -H "Content-Type: application/json" \
  -d '{"value": "我的博客"}'

# 3. 创建文章集合
curl -X POST http://localhost:8080/set
# 返回：{"ptr": "02posts456..."}

# 4. 设置博客的文章集合指针
curl -X PUT http://localhost:8080/obj/01blog123.../posts \
  -H "Content-Type: application/json" \
  -d '{"value": "02posts456..."}'

# 5. 创建标签集合
curl -X POST http://localhost:8080/set
# 返回：{"ptr": "02tags789..."}

# 6. 设置博客的标签集合指针
curl -X PUT http://localhost:8080/obj/01blog123.../tags \
  -H "Content-Type: application/json" \
  -d '{"value": "02tags789..."}'
```

### 3. 创建文章标签

```bash
# 1. 创建标签对象
curl -X POST http://localhost:8080/obj
# 返回：{"ptr": "01tag001..."}

# 2. 设置标签名
curl -X PUT http://localhost:8080/obj/01tag001.../name \
  -H "Content-Type: application/json" \
  -d '{"value": "技术"}'

# 3. 创建标签文章集合
curl -X POST http://localhost:8080/set
# 返回：{"ptr": "02tagposts001..."}

# 4. 设置标签的文章集合指针
curl -X PUT http://localhost:8080/obj/01tag001.../posts \
  -H "Content-Type: application/json" \
  -d '{"value": "02tagposts001..."}'

# 5. 将标签添加到博客标签集合
curl -X POST http://localhost:8080/set/02tags789.../elements \
  -H "Content-Type: application/json" \
  -d '{"value": "01tag001..."}'
```

### 4. 创建文章

```bash
# 1. 创建文章对象
curl -X POST http://localhost:8080/obj
# 返回：{"ptr": "01art001..."}

# 2. 设置文章元数据
curl -X PUT http://localhost:8080/obj/01art001.../title \
  -H "Content-Type: application/json" \
  -d '{"value": "文章标题"}'

curl -X PUT http://localhost:8080/obj/01art001.../slug \
  -H "Content-Type: application/json" \
  -d '{"value": "my-first-post"}'

curl -X PUT http://localhost:8080/obj/01art001.../cover \
  -H "Content-Type: application/json" \
  -d '{"value": "01img001..."}'

# 3. 创建文章标签集合
curl -X POST http://localhost:8080/set
# 返回：{"ptr": "02arttags001..."}

# 4. 添加标签名到文章
curl -X POST http://localhost:8080/set/02arttags001.../elements \
  -H "Content-Type: application/json" \
  -d '{"value": "技术"}'

# 5. 设置文章标签集合
curl -X PUT http://localhost:8080/obj/01art001.../tags \
  -H "Content-Type: application/json" \
  -d '{"value": "02arttags001..."}'

# 6. 将文章添加到博客文章集合
curl -X POST http://localhost:8080/set/02posts456.../elements \
  -H "Content-Type: application/json" \
  -d '{"value": "01art001..."}'

# 7. 将文章添加到标签文章集合
curl -X POST http://localhost:8080/set/02tagposts001.../elements \
  -H "Content-Type: application/json" \
  -d '{"value": "01art001..."}'
```

### 5. 上传文章内容和图片

```bash
# 文章内容 (无扩展名)
echo "# 文章内容" > /path/to/articles/01art001...

# 图片文件
cp image.jpg /path/to/images/01img001...
```

## Nginx 配置示例

```nginx
server {
    listen 80;
    server_name blog.example.com;

    # Vue 项目
    location / {
        root /path/to/vue-blog/dist;
        try_files $uri $uri/ /index.html;
    }

    # 图片代理
    location /img/ {
        alias /path/to/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 文章内容代理
    location /article/ {
        alias /path/to/articles/;
        default_type text/markdown;
    }

    # lmjweb API 反向代理
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 文件结构

```
src/
├── api/
│   └── lmjweb.js          # lmjweb API 封装
├── config/
│   └── blog.js            # 博客配置文件
├── views/
│   ├── Home.vue           # 首页（文章列表）
│   └── Blog.vue           # 文章详情页
└── components/
    ├── BlogCard.vue       # 文章卡片
    └── TagCard.vue        # 标签卡片
```

## API 说明

### 配置项

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `LMJWEB_API` | lmjweb 服务地址 | `http://localhost:8080` |
| `BLOG_INFO_PTR` | 博客信息对象指针 | `01abc123...` |
| `IMAGE_BASE` | 图片访问基础路径 | `/img/` |
| `ARTICLE_BASE` | 文章内容访问基础路径 | `/article/` |

### 辅助函数

```javascript
import { getImageUrl, getArticleUrl } from '@/config/blog'

// 生成图片 URL
const imgUrl = getImageUrl('01img123...')  // → '/img/01img123...'

// 生成文章内容 URL
const articleUrl = getArticleUrl('01art123...')  // → '/article/01art123...'
```

## 注意事项

1. **指针格式**：
   - 对象指针：`01` + 32 位十六进制
   - 集合指针：`02` + 32 位十六进制

2. **文件命名**：
   - 图片文件：使用图片对象指针作为文件名
   - 文章文件：使用文章对象指针作为文件名（无扩展名）

3. **配置更新**：
   - 修改 `BLOG_INFO_PTR` 后需要重新构建或刷新页面

4. **错误处理**：
   - 所有 API 调用都包含错误处理
   - 加载失败时显示重试按钮
