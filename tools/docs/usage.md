# 使用指南

## CLI 使用

### 安装

工具复用主项目的依赖，确保已安装 `commander`：

```bash
cd /path/to/vue-blog/blog
npm install
```

### 配置

创建配置文件：

```bash
cp config.example.json config.json
```

编辑 `config.json`：

```json
{
  "lmjwebApi": "http://localhost:8080",
  "blogInfoPtr": "01blog0000000000000000000000000000",
  "imagesDir": "/var/www/images",
  "articlesDir": "/var/www/articles"
}
```

### 命令

```bash
# 从主项目目录运行
npm run pub <command>

# 或直接从 tools 目录运行
node tools/cli.js <command>
```

#### 健康检查

```bash
npm run pub health
```

#### 初始化博客

```bash
npm run pub init --title "我的博客"
```

#### 注册文件

```bash
# 注册图片
npm run pub register image --file "./cover.jpg" --filename "article-cover.jpg"

# 注册文章
npm run pub register article --file "./article.md" --title "文章标题"
```

#### 创建关联

```bash
# 关联封面
npm run pub link cover --article "01art..." --image "01img..."

# 关联单个标签
npm run pub link tag --article "01art..." --name "技术"

# 关联多个标签
npm run pub link tags --article "01art..." --names "技术，随笔，Vue"

# 注册到博客
npm run pub link blog --article "01art..."
```

#### 标签管理

```bash
npm run pub tag create --name "技术"
```

#### 文件管理

```bash
npm run pub file copy --ptr "01art..." --dest "/backup/" --type article
```

#### 查询信息

```bash
npm run pub info article --ptr "01art..."
npm run pub info image --ptr "01img..."
npm run pub info blog
```

### 使用自定义配置

```bash
npm run pub --config ./my-config.json health
```

---

## API 使用

### 基本用法

```javascript
import { Publisher } from './tools/publisher.js'

const publisher = new Publisher({
  lmjwebApi: 'http://localhost:8080',
  blogInfoPtr: '01abc123...',
  imagesDir: '/var/www/images',
  articlesDir: '/var/www/articles'
})

// 健康检查
const healthy = await publisher.health()

// 初始化博客
const { blogPtr, postsPtr, tagsPtr } = await publisher.initBlog('我的博客')
```

### 注册操作

```javascript
// 注册图片
const cover = await publisher.registerImage('./cover.jpg', 'article-cover.jpg')
console.log(cover)
// {
//   ptr: '01img123...',
//   path: '/var/www/images/01img123...',
//   filename: 'article-cover.jpg'
// }

// 注册文章
const article = await publisher.registerArticle({
  filePath: './article.md',
  title: '文章标题'
})
console.log(article)
// {
//   ptr: '01art456...',
//   path: '/var/www/articles/01art456...',
//   title: '文章标题'
// }
```

### 关联操作

```javascript
// 关联封面
await publisher.linkCover(article.ptr, cover.ptr)

// 关联标签
await publisher.linkTag(article.ptr, '技术')

// 关联多个标签
await publisher.linkTags(article.ptr, ['技术', '随笔'])

// 注册到博客
await publisher.linkToBlog(article.ptr)
```

### 查询操作

```javascript
// 获取文章信息
const articleInfo = await publisher.getArticle(article.ptr)

// 获取图片信息
const imageInfo = await publisher.getImage(cover.ptr)

// 获取博客信息
const blogInfo = await publisher.getBlogInfo()
```

### 文件操作

```javascript
// 复制文件到其他目录
const destPath = publisher.copyFile(article.ptr, '/backup/', 'article')

// 删除文件
publisher.deleteFile(article.ptr, 'article')
```

---

## 完整示例

### 发布单篇文章

```javascript
import { Publisher } from './tools/publisher.js'

async function publishArticle() {
  const publisher = new Publisher(config)

  // 1. 注册文章
  const article = await publisher.registerArticle({
    filePath: './drafts/post.md',
    title: '我的文章'
  })
  console.log('文章指针:', article.ptr)

  // 2. 注册封面
  const cover = await publisher.registerImage('./images/cover.jpg')
  console.log('封面指针:', cover.ptr)

  // 3. 创建关联
  await publisher.linkCover(article.ptr, cover.ptr)
  await publisher.linkTags(article.ptr, ['技术', '随笔'])
  await publisher.linkToBlog(article.ptr)

  console.log('发布完成!')
  return article
}

publishArticle().catch(console.error)
```

### 批量导入

```javascript
import { Publisher } from './tools/publisher.js'
import { readdir, readFile } from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

async function batchImport() {
  const publisher = new Publisher(config)
  const draftsDir = './drafts'
  
  const files = await readdir(draftsDir)
  const mdFiles = files.filter(f => f.endsWith('.md'))
  
  for (const file of mdFiles) {
    const filePath = path.join(draftsDir, file)
    const content = await readFile(filePath, 'utf-8')
    
    // 解析 Frontmatter
    const { data } = matter(content)
    const { title, tags, cover } = data

    // 写入临时文件（去除 frontmatter）
    const tempPath = `./temp/${file}`
    await writeFile(tempPath, content)

    // 注册文章
    const article = await publisher.registerArticle({
      filePath: tempPath,
      title
    })
    
    // 注册封面
    if (cover) {
      const coverImage = await publisher.registerImage(cover)
      await publisher.linkCover(article.ptr, coverImage.ptr)
    }
    
    // 关联标签
    if (tags) {
      await publisher.linkTags(article.ptr, tags)
    }
    
    // 注册到博客
    await publisher.linkToBlog(article.ptr)
    
    console.log(`✓ 发布完成：${title}`)
  }
}
```

### 在脚本中使用

```bash
#!/bin/bash
# publish.sh

ARTICLE_FILE="$1"
TITLE="$2"
COVER_FILE="$3"

# 注册文章
ARTICLE_RESULT=$(npm run pub --silent register article \
  --file "$ARTICLE_FILE" \
  --title "$TITLE")

ARTICLE_PTR=$(echo "$ARTICLE_RESULT" | grep "文章指针" | awk '{print $2}')

# 注册封面
if [ -n "$COVER_FILE" ]; then
  COVER_RESULT=$(npm run pub --silent register image --file "$COVER_FILE")
  COVER_PTR=$(echo "$COVER_RESULT" | grep "图片指针" | awk '{print $2}')
  
  # 关联封面
  npm run pub --silent link cover --article "$ARTICLE_PTR" --image "$COVER_PTR"
fi

echo "发布完成！文章指针：$ARTICLE_PTR"
```

---

## 故障排除

### 常见问题

**Q: 配置文件不存在**
```
错误：配置文件不存在 - /path/to/config.json
```
解决：运行 `cp config.example.json config.json` 并编辑配置。

**Q: 无法连接 lmjweb**
```
✗ 无法连接 lmjweb 服务：fetch failed
```
解决：检查 lmjweb 服务是否运行，配置地址是否正确。

**Q: 文件不存在**
```
错误：文件不存在：./cover.jpg
```
解决：检查文件路径是否正确，使用绝对路径更可靠。

**Q: 博客未初始化**
```
错误：博客标签集合不存在
```
解决：先运行 `npm run pub init --title "博客名称"`。

### 调试模式

设置环境变量查看详细日志：

```bash
DEBUG=blog-pub npm run pub health
```
