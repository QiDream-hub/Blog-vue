# 博客管理后台

Vue Blog 项目的元数据管理工具，用于在 lmjweb 中注册和管理博客内容。

## 功能特性

- 📊 **仪表盘** - 查看博客统计信息和系统状态
- 📝 **文章管理** - 创建、编辑、删除文章元数据
- 🖼️ **图片管理** - 注册图片元数据，管理图片列表
- 🏷️ **标签管理** - 创建和管理标签
- 📦 **导出文件** - 生成文件清单和 ZIP 包

## 架构说明

### 与现有 CLI 工具的关系

本管理后台和 CLI 工具 (`tools/cli/publisher.js`) 都实现了博客发布功能，但针对不同的使用场景：

| 特性 | CLI 工具 | 管理后台 |
|------|----------|----------|
| **运行环境** | Node.js | 浏览器 |
| **文件操作** | 自动复制到 Nginx 目录（需要服务器访问权限） | ZIP 打包下载，用户手动放置到 Nginx 目录 |
| **API 封装** | `tools/cli/publisher.js` (Node) | `tools/admin/src/api/publisher.js` (浏览器) |
| **使用方式** | 命令行交互 | Web 界面可视化操作 |
| **适用场景** | 服务器本地批量操作、自动化脚本 | 远程管理、可视化编辑、单篇文章发布 |

**选择建议**：
- 如果你在**服务器本地**工作且需要批量处理 → 使用 CLI 工具
- 如果你需要**远程管理**或可视化编辑 → 使用管理后台
- 如果你需要**自动化/脚本化**操作 → 使用 CLI 工具
- 如果你需要**编辑现有文章**（修改标题、封面、标签） → 使用管理后台

### 文件流转

#### 管理后台流程
```
1. 用户在管理后台选择文件
   ↓
2. 系统自动生成指针并注册元数据到 lmjweb
   ↓
3. 系统打包文件（自动重命名为指针格式）
   ↓
4. 用户下载 ZIP 包并解压到 Nginx 目录
   ↓
5. 博客前端通过 Nginx 读取文件内容
```

#### CLI 工具流程
```
1. 用户执行 CLI 命令指定文件路径
   ↓
2. CLI 自动生成指针并注册元数据到 lmjweb
   ↓
3. CLI 自动复制文件到 Nginx 目录（重命名为指针格式）
   ↓
4. 完成（无需手动操作）
```

## 安装和使用

### 1. 安装依赖

```bash
cd tools/admin
npm install
```

### 2. 配置

编辑 `index.html` 中的配置：

```html
<script id="blog-config">
  {
    "LMJWEB_API": "http://localhost:8080",
    "BLOG_INFO_PTR": "01blog0000000000000000000000000000",
    "IMAGE_BASE": "/img/",
    "ARTICLE_BASE": "/article/"
  }
</script>
```

### 3. 开发模式

```bash
npm run dev
```

访问 `http://localhost:5174`

### 4. 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录

## Nginx 配置

确保 Nginx 允许写请求到 lmjweb：

```nginx
# 管理后台（允许写操作）
location /admin/ {
    # 托管 Vue 构建产物
    alias /path/to/admin/dist/;
    try_files $uri $uri/ /index.html;
}

# API 写请求（仅内网/管理端）
location /api/ {
    # 允许所有 HTTP 方法（包括 POST/PUT/DELETE）
    proxy_pass http://localhost:8080/;
    proxy_set_header Host $host;
    
    # 可选：添加 IP 限制
    # allow 127.0.0.1;
    # deny all;
}
```

## 使用流程

### 新建文章

1. 进入 **文章管理** → **新建文章**
2. 选择 Markdown 文件（自动生成指针）
3. 填写标题、选择标签、设置封面
4. 点击 **生成指针并打包**，下载 ZIP 包
5. 解压 ZIP 包，将 `articles/` 目录中的文件（已是指针格式）复制到 Nginx 文章目录
6. 访问博客前端查看文章

**注意**：下载的文件已自动重命名为指针格式（例如 `01art123...`），无需手动重命名。

### 注册图片

1. 进入 **图片管理** → **注册图片**
2. 选择图片文件（自动生成指针）
3. 点击 **生成指针并打包**，下载 ZIP 包
4. 解压 ZIP 包，将 `images/` 目录中的文件（已是指针格式）复制到 Nginx 图片目录
5. 在文章编辑时选择此图片作为封面

**注意**：下载的文件已自动重命名为指针格式（例如 `01img456...`），无需手动重命名。

### 导出文件

1. 进入 **导出文件** 页面
2. 点击 **导出元数据清单**
3. 下载 ZIP 文件，包含：
   - `articles/` - 文章占位文件（含元数据）
   - `images/` - 图片占位文件（含元数据）
   - `README.md` - 导出说明和文件清单
   - `manifest.json` - 完整元数据 JSON

## API 参考

### Publisher API

位于 `src/api/publisher.js`，提供以下方法：

#### 注册操作
- `registerImage(filename)` - 注册图片元数据
- `registerArticle({ title })` - 注册文章元数据

#### 关联操作
- `linkCover(articlePtr, imagePtr)` - 关联封面
- `linkTag(articlePtr, tagName)` - 关联标签
- `linkTags(articlePtr, tagNames)` - 关联多个标签
- `linkToBlog(articlePtr)` - 注册到博客

#### 查询操作
- `getAllArticles()` - 获取所有文章指针
- `getAllImages()` - 获取所有图片指针
- `getAllTags()` - 获取所有标签指针
- `getArticleDetail(articlePtr)` - 获取文章详情
- `getImageDetail(imagePtr)` - 获取图片详情
- `getTagDetail(tagPtr)` - 获取标签详情

#### 删除操作
- `deleteArticle(articlePtr)` - 删除文章元数据
- `deleteImage(imagePtr)` - 删除图片元数据
- `deleteTag(tagName)` - 删除标签

#### 更新操作
- `updateArticleTitle(articlePtr, newTitle)` - 更新标题
- `updateArticleCover(articlePtr, imagePtr)` - 更新封面
- `updateArticleTags(articlePtr, tagNames)` - 更新标签

## 与 CLI 工具对比

| 操作 | CLI 命令 | 管理后台 |
|------|----------|----------|
| 注册图片 | `npm run pub register image --file ./a.jpg` | 图片管理 → 注册图片 |
| 注册文章 | `npm run pub register article --file ./a.md --title "标题"` | 文章管理 → 新建文章 |
| 关联封面 | `npm run pub link cover --article 01art... --image 01img...` | 文章编辑表单 |
| 关联标签 | `npm run pub link tag --article 01art... --name "技术"` | 文章编辑表单 |
| 删除文章 | `npm run pub delete article --ptr 01art...` | 文章列表 → 删除 |

## 注意事项

1. **文件操作**：管理后台只处理元数据，文件需要手动复制到 Nginx 目录
2. **指针命名**：文件名必须使用指针格式，无扩展名
3. **API 权限**：确保 lmjweb 服务允许跨域写请求
4. **浏览器兼容**：需要现代浏览器支持（Chrome 80+, Firefox 75+, Safari 13+）

## 开发计划

- [ ] 批量上传/注册
- [ ] 文章预览功能
- [ ] 草稿箱支持
- [ ] 操作历史记录
- [ ] 用户鉴权

## License

MIT
