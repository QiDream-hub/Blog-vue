# 配置说明

## 配置文件

创建 `config.json`：

```json
{
  "lmjwebApi": "http://localhost:8080",
  "blogInfoPtr": "01blog0000000000000000000000000000",
  "imagesDir": "/var/www/images",
  "articlesDir": "/var/www/articles"
}
```

## 配置项

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `lmjwebApi` | string | ✓ | lmjweb 服务地址 | `http://localhost:8080` |
| `blogInfoPtr` | string | ✓ | 博客信息对象指针 | `01abc123...` |
| `imagesDir` | string | ✓ | 图片文件存放目录 | `/var/www/images` |
| `articlesDir` | string | ✓ | 文章内容存放目录 | `/var/www/articles` |

## 环境变量

支持通过环境变量覆盖配置（用于 CI/CD 或不同环境）：

```bash
export LMJWEB_API=http://prod-server:8080
export BLOG_INFO_PTR=01abc123...
export IMAGES_DIR=/mnt/images
export ARTICLES_DIR=/mnt/articles
```

## 配置示例

### 开发环境

```json
{
  "lmjwebApi": "http://localhost:8080",
  "blogInfoPtr": "01blog0000000000000000000000000000",
  "imagesDir": "/home/user/dev/blog/images",
  "articlesDir": "/home/user/dev/blog/articles"
}
```

### 生产环境

```json
{
  "lmjwebApi": "http://192.168.1.100:8080",
  "blogInfoPtr": "01abc123def456789012345678901234",
  "imagesDir": "/var/www/blog/images",
  "articlesDir": "/var/www/blog/articles"
}
```

### 多环境配置

```bash
# 开发环境
cp config.example.json config.dev.json

# 生产环境
cp config.example.json config.prod.json

# 使用指定配置
npm run pub --config ./config.prod.json health
```

## Schema

配置文件遵循 JSON Schema：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "lmjwebApi": {
      "type": "string",
      "format": "uri",
      "description": "lmjweb 服务地址"
    },
    "blogInfoPtr": {
      "type": "string",
      "pattern": "^01[a-f0-9]{32}$",
      "description": "博客信息对象指针"
    },
    "imagesDir": {
      "type": "string",
      "description": "图片文件存放目录"
    },
    "articlesDir": {
      "type": "string",
      "description": "文章内容存放目录"
    }
  },
  "required": ["lmjwebApi", "blogInfoPtr", "imagesDir", "articlesDir"]
}
```
