# 博客管理后台 - 快速启动指南

## 项目结构

```
tools/
├── cli/           # 现有 CLI 工具（保持不变）
│   ├── publisher.js
│   └── cli.js
└── admin/         # 新增管理后台
    ├── src/
    │   ├── api/
    │   │   ├── lmjweb.js       # lmjweb API 封装（读写操作）
    │   │   └── publisher.js    # 发布逻辑（浏览器版）
    │   ├── components/
    │   │   └── LoadingSpinner.vue
    │   ├── config/
    │   │   └── blog.js         # 配置加载
    │   ├── router/
    │   │   └── index.js        # 路由配置
    │   ├── views/
    │   │   ├── Dashboard.vue   # 仪表盘
    │   │   ├── Articles.vue    # 文章列表
    │   │   ├── ArticleForm.vue # 文章表单
    │   │   ├── Images.vue      # 图片管理
    │   │   ├── Tags.vue        # 标签管理
    │   │   └── Export.vue      # 导出打包
    │   ├── App.vue
    │   └── main.js
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── README.md
```

## 启动步骤

### 1. 配置 lmjweb 服务

确保 lmjweb 服务允许跨域写请求。如果还没有配置，在 lmjweb 服务中添加 CORS 头：

```javascript
// 或者在 Nginx 中添加
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
add_header Access-Control-Allow-Headers 'Content-Type';
```

### 2. 配置 Nginx

```nginx
# 管理后台前端
location /admin/ {
    alias /home/data/Code/project/vue-blog/blog/tools/admin/dist/;
    try_files $uri $uri/ /index.html;
    
    # CORS（开发时可加）
    add_header Access-Control-Allow-Origin *;
}

# API 写请求（需要允许 POST/PUT/DELETE）
location /api/ {
    # 允许所有 HTTP 方法
    limit_except GET POST PUT DELETE { deny all; }
    
    proxy_pass http://localhost:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # CORS
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
    add_header Access-Control-Allow-Headers 'Content-Type';
}
```

### 3. 更新配置

编辑 `tools/admin/index.html`：

```html
<script id="blog-config">
  {
    "LMJWEB_API": "/api",  // 或 "http://localhost:8080"
    "BLOG_INFO_PTR": "01blog0000000000000000000000000000",  // 你的博客指针
    "IMAGE_BASE": "/img/",
    "ARTICLE_BASE": "/article/"
  }
</script>
```

### 4. 安装依赖

```bash
cd tools/admin
npm install
```

### 5. 开发模式

```bash
npm run dev
```

访问 `http://localhost:5174/admin`（需要配置路由）或直接 `http://localhost:5174`

### 6. 生产构建

```bash
npm run build
```

构建产物输出到 `tools/admin/dist/`

## 使用流程

### 场景 1：新建文章

1. **创建元数据**
   - 访问 **文章管理** → **新建文章**
   - 填写标题、选择标签、设置封面
   - 点击保存，获得文章指针 `01art...`

2. **复制文件**
   - 将 Markdown 文件复制到 Nginx 文章目录
   - 文件名使用指针：`/path/to/articles/01art...`
   - 无扩展名

3. **验证**
   - 访问博客前端查看文章列表
   - 点击文章查看内容

### 场景 2：注册图片

1. **创建元数据**
   - 访问 **图片管理** → **注册图片**
   - 输入原始文件名（如 `cover.jpg`）
   - 点击 **生成指针**，获得 `01img...`

2. **复制文件**
   - 将图片文件复制到 Nginx 图片目录
   - 文件名使用指针：`/path/to/images/01img...`
   - 无扩展名

3. **使用**
   - 在文章编辑时选择此图片作为封面

### 场景 3：批量备份

1. **导出元数据**
   - 访问 **导出文件**
   - 点击 **导出元数据清单**
   - 下载 ZIP 文件

2. **备份文件**
   - 根据 ZIP 中的 `README.md` 提示
   - 手动从 Nginx 目录复制实际文件
   - 保存到备份位置

## 常见问题

### Q: 为什么文件不自动上传？

A: 管理后台只处理元数据，文件操作由用户手动完成。这样可以：
- 避免浏览器上传大文件的限制
- 支持服务器直接操作（SCP、rsync 等）
- 保持架构清晰（前端只读，管理端元数据）

### Q: 如何初始化博客？

A: 如果是新博客，需要先创建博客信息对象。可以用 CLI：

```bash
cd tools/cli
npm run pub init --title "我的博客"
```

然后在管理后台的 `index.html` 中更新 `BLOG_INFO_PTR`。

### Q: 删除操作会删除文件吗？

A: 不会。管理后台的删除操作仅删除 lmjweb 中的元数据，文件需要手动删除。

### Q: 如何迁移现有博客？

A: 
1. 使用 CLI 工具查询现有元数据
2. 在管理后台导出清单
3. 对比文件目录和元数据
4. 手动补充缺失的元数据

## 下一步

- [ ] 添加批量操作功能
- [ ] 支持文件拖拽上传（小文件）
- [ ] 添加用户鉴权
- [ ] 操作日志记录
