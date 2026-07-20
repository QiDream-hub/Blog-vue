#!/usr/bin/env node

/**
 * Blog Publisher CLI
 * 
 * 博客发布命令行工具
 * 
 * @example
 * ```bash
 * # 健康检查
 * npx blog-pub health
 * 
 * # 初始化博客
 * npx blog-pub init --title "我的博客"
 * 
 * # 注册图片
 * npx blog-pub register image --file "./cover.jpg" --filename "article-cover.jpg"
 * 
 * # 注册文章
 * npx blog-pub register article --file "./article.md" --title "标题" --slug "my-article"
 * 
 * # 创建关联
 * npx blog-pub link cover --article "01art..." --image "01img..."
 * npx blog-pub link tag --article "01art..." --name "技术"
 * npx blog-pub link tags --article "01art..." --names "技术，随笔"
 * npx blog-pub link blog --article "01art..."
 * 
 * # 创建标签
 * npx blog-pub tag create --name "技术"
 * 
 * # 文件管理
 * npx blog-pub file copy --ptr "01art..." --dest "/backup/" --type article
 * ```
 */

import { program } from 'commander'
import { readFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import path from 'path'
import Publisher from './publisher.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

/**
 * 加载配置
 * @param {string} configPath 配置文件路径
 * @returns {object}
 */
function loadConfig(configPath) {
  const resolvedPath = configPath ? resolve(configPath) : join(__dirname, 'config.json')
  
  if (!existsSync(resolvedPath)) {
    console.error(`错误：配置文件不存在 - ${resolvedPath}`)
    console.error('\n请创建配置文件或指定正确的路径')
    console.error('示例配置：')
    console.error(JSON.stringify({
      lmjwebApi: 'http://localhost:8080',
      blogInfoPtr: '01blog0000000000000000000000000000',
      imagesDir: '/path/to/images',
      articlesDir: '/path/to/articles'
    }, null, 2))
    process.exit(1)
  }
  
  const content = readFileSync(resolvedPath, 'utf-8')
  return JSON.parse(content)
}

/**
 * 创建 Publisher 实例
 * @param {string} configPath 配置文件路径
 * @returns {Publisher}
 */
function createPublisher(configPath) {
  const config = loadConfig(configPath)
  return new Publisher(config)
}

// 命令行配置
program
  .name('blog-pub')
  .description('博客发布工具 - 在 lmjweb 中注册元数据并管理文件')
  .version('1.0.0')
  .option('-c, --config <path>', '配置文件路径', 'config.json')

// health 命令
program
  .command('health')
  .description('检查 lmjweb 服务健康状态')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.opts().config)
    
    try {
      const healthy = await publisher.health()
      if (healthy) {
        console.log('✓ lmjweb 服务正常')
        process.exit(0)
      } else {
        console.error('✗ lmjweb 服务异常')
        process.exit(1)
      }
    } catch (err) {
      console.error('✗ 无法连接 lmjweb 服务:', err.message)
      process.exit(1)
    }
  })

// init 命令
program
  .command('init')
  .description('初始化博客')
  .requiredOption('--title <string>', '博客名称')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.opts().config)
    
    try {
      // 检查是否已存在
      if (await publisher.exists(publisher.config.blogInfoPtr)) {
        const blogInfo = await publisher.getBlogInfo()
        const title = blogInfo.members.find(m => m.name === 'title')?.value
        console.log(`✓ 博客已存在：${title}`)
        console.log(`  指针：${publisher.config.blogInfoPtr}`)
        return
      }

      const result = await publisher.initBlog(options.title)
      console.log('✓ 博客初始化完成')
      console.log(`  博客指针：${result.blogPtr}`)
      console.log(`  文章集合：${result.postsPtr}`)
      console.log(`  标签集合：${result.tagsPtr}`)
      console.log('\n提示：请更新配置文件中的 blogInfoPtr')
    } catch (err) {
      console.error('✗ 初始化失败:', err.message)
      process.exit(1)
    }
  })

// register 命令组
const registerCmd = program
  .command('register')
  .description('注册文件（创建元数据并移动文件）')

// register image
registerCmd
  .command('image')
  .description('注册图片')
  .requiredOption('--file <path>', '图片文件路径')
  .option('--filename <string>', '原始文件名（用于元数据记录）')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      // 解析文件路径：相对于当前工作目录
      const filePath = path.resolve(process.cwd(), options.file)
      const result = await publisher.registerImage(filePath, options.filename)
      console.log('✓ 图片注册完成')
      console.log(`  图片指针：${result.ptr}`)
      console.log(`  存储路径：${result.path}`)
      console.log(`  原始文件名：${result.filename}`)
    } catch (err) {
      console.error('✗ 注册失败:', err.message)
      process.exit(1)
    }
  })

// register article
registerCmd
  .command('article')
  .description('注册文章')
  .requiredOption('--file <path>', '文章文件路径')
  .requiredOption('--title <string>', '文章标题')
  .option('--filename <string>', '原始文件名（用于元数据记录）')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      // 解析文件路径：相对于当前工作目录
      const filePath = path.resolve(process.cwd(), options.file)
      const result = await publisher.registerArticle({
        filePath,
        title: options.title,
        filename: options.filename
      })
      console.log('✓ 文章注册完成')
      console.log(`  文章指针：${result.ptr}`)
      console.log(`  存储路径：${result.path}`)
      console.log(`  标题：${result.title}`)
    } catch (err) {
      console.error('✗ 注册失败:', err.message)
      process.exit(1)
    }
  })

// link 命令组
const linkCmd = program
  .command('link')
  .description('创建关联')

// link cover
linkCmd
  .command('cover')
  .description('关联封面图片到文章')
  .requiredOption('--article <ptr>', '文章指针')
  .requiredOption('--image <ptr>', '图片指针')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)
    
    try {
      await publisher.linkCover(options.article, options.image)
      console.log('✓ 封面关联完成')
      console.log(`  文章：${options.article}`)
      console.log(`  封面：${options.image}`)
    } catch (err) {
      console.error('✗ 关联失败:', err.message)
      process.exit(1)
    }
  })

// link tag
linkCmd
  .command('tag')
  .description('关联标签到文章')
  .requiredOption('--article <ptr>', '文章指针')
  .requiredOption('--name <string>', '标签名称')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)
    
    try {
      const result = await publisher.linkTag(options.article, options.name)
      console.log('✓ 标签关联完成')
      console.log(`  文章：${options.article}`)
      console.log(`  标签：${options.name}`)
      console.log(`  标签指针：${result.ptr}`)
      console.log(`  ${result.created ? '新建标签' : '使用现有标签'}`)
    } catch (err) {
      console.error('✗ 关联失败:', err.message)
      process.exit(1)
    }
  })

// link tags
linkCmd
  .command('tags')
  .description('关联多个标签到文章')
  .requiredOption('--article <ptr>', '文章指针')
  .requiredOption('--names <string>', '标签名称列表（逗号分隔）')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)
    
    try {
      const tagNames = options.names.split(',').map(t => t.trim()).filter(Boolean)
      const results = await publisher.linkTags(options.article, tagNames)
      
      console.log('✓ 标签关联完成')
      console.log(`  文章：${options.article}`)
      console.log('  标签:')
      results.forEach(r => {
        console.log(`    - ${r.name}: ${r.ptr}${r.created ? ' (新建)' : ''}`)
      })
    } catch (err) {
      console.error('✗ 关联失败:', err.message)
      process.exit(1)
    }
  })

// link blog
linkCmd
  .command('blog')
  .description('将文章注册到博客')
  .requiredOption('--article <ptr>', '文章指针')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)
    
    try {
      await publisher.linkToBlog(options.article)
      console.log('✓ 文章已注册到博客')
      console.log(`  文章：${options.article}`)
    } catch (err) {
      console.error('✗ 注册失败:', err.message)
      process.exit(1)
    }
  })

// tag 命令组
const tagCmd = program
  .command('tag')
  .description('标签管理')

tagCmd
  .command('create')
  .description('创建标签')
  .requiredOption('--name <string>', '标签名称')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)
    
    try {
      const result = await publisher.createTag(options.name)
      console.log('✓ 标签创建完成')
      console.log(`  标签名称：${options.name}`)
      console.log(`  标签指针：${result.ptr}`)
      console.log(`  文章集合：${result.postsPtr}`)
    } catch (err) {
      console.error('✗ 创建失败:', err.message)
      process.exit(1)
    }
  })

// file 命令组
const fileCmd = program
  .command('file')
  .description('文件管理')

fileCmd
  .command('copy')
  .description('复制已注册的文件到其他目录')
  .requiredOption('--ptr <ptr>', '文件指针')
  .requiredOption('--dest <path>', '目标目录')
  .requiredOption('--type <type>', '文件类型 (image|article)')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)
    
    try {
      const destPath = publisher.copyFile(options.ptr, options.dest, options.type)
      console.log('✓ 文件复制完成')
      console.log(`  指针：${options.ptr}`)
      console.log(`  目标：${destPath}`)
    } catch (err) {
      console.error('✗ 复制失败:', err.message)
      process.exit(1)
    }
  })

// info 命令组
const infoCmd = program
  .command('info')
  .description('查询信息')

infoCmd
  .command('article')
  .description('获取文章信息')
  .requiredOption('--ptr <ptr>', '文章指针')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)
    
    try {
      const article = await publisher.getArticle(options.ptr)
      console.log(JSON.stringify(article, null, 2))
    } catch (err) {
      console.error('✗ 获取失败:', err.message)
      process.exit(1)
    }
  })

infoCmd
  .command('image')
  .description('获取图片信息')
  .requiredOption('--ptr <ptr>', '图片指针')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)
    
    try {
      const image = await publisher.getImage(options.ptr)
      console.log(JSON.stringify(image, null, 2))
    } catch (err) {
      console.error('✗ 获取失败:', err.message)
      process.exit(1)
    }
  })

infoCmd
  .command('blog')
  .description('获取博客信息')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const blogInfo = await publisher.getBlogInfo()
      console.log(JSON.stringify(blogInfo, null, 2))
    } catch (err) {
      console.error('✗ 获取失败:', err.message)
      process.exit(1)
    }
  })

// info list - 列出所有已注册内容
infoCmd
  .command('list')
  .description('列出所有已注册内容')
  .requiredOption('--type <type>', '类型 (articles|images)')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      let items
      let typeName

      switch (options.type) {
        case 'articles':
          items = await publisher.getAllArticles()
          typeName = '文章'
          break
        case 'images':
          items = await publisher.getAllImages()
          typeName = '图片'
          break
        default:
          console.error('错误：请指定 --type articles|images')
          process.exit(1)
      }

      console.log(`已注册的${typeName}: ${items.length} 个`)
      if (items.length === 0) {
        console.log('  (空)')
      } else {
        items.forEach(ptr => console.log(`  - ${ptr}`))
      }
    } catch (err) {
      console.error('✗ 查询失败:', err.message)
      process.exit(1)
    }
  })

// delete 命令组
const deleteCmd = program
  .command('delete')
  .description('删除内容')

// delete article
deleteCmd
  .command('article')
  .description('删除文章')
  .requiredOption('--ptr <ptr>', '文章指针')
  .option('--keep-file', '保留文件（不删除物理文件）')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const result = await publisher.deleteArticle(options.ptr, !options.keepFile)
      console.log('✓ 文章删除完成')
      console.log(`  文章：${options.ptr}`)
      console.log(`  从博客移除：${result.removedFromBlog ? '是' : '否'}`)
      console.log(`  更新标签：${result.tagsUpdated.length > 0 ? result.tagsUpdated.join(', ') : '无'}`)
      console.log(`  文件处理：${options.keepFile ? '保留' : '已删除'}`)
    } catch (err) {
      console.error('✗ 删除失败:', err.message)
      process.exit(1)
    }
  })

// delete image
deleteCmd
  .command('image')
  .description('删除图片')
  .requiredOption('--ptr <ptr>', '图片指针')
  .option('--keep-file', '保留文件（不删除物理文件）')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const result = await publisher.deleteImage(options.ptr, !options.keepFile)
      console.log('✓ 图片删除完成')
      console.log(`  图片：${options.ptr}`)
      console.log(`  从全局集合移除：${result.removedFromImages ? '是' : '否'}`)
      console.log(`  解除封面关联：${result.unlinkedFromArticles.length > 0 ? result.unlinkedFromArticles.join(', ') : '无'}`)
      console.log(`  文件处理：${options.keepFile ? '保留' : '已删除'}`)
    } catch (err) {
      console.error('✗ 删除失败:', err.message)
      process.exit(1)
    }
  })

// delete tag
deleteCmd
  .command('tag')
  .description('删除标签')
  .requiredOption('--name <string>', '标签名称')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const result = await publisher.deleteTag(options.name)
      console.log('✓ 标签删除完成')
      console.log(`  标签：${options.name}`)
      console.log(`  从博客移除：${result.removedFromBlog ? '是' : '否'}`)
      console.log(`  更新文章数：${result.articlesUpdated}`)
    } catch (err) {
      console.error('✗ 删除失败:', err.message)
      process.exit(1)
    }
  })

// update 命令组
const updateCmd = program
  .command('update')
  .description('更新内容')

// update article-title
updateCmd
  .command('article-title')
  .description('更新文章标题')
  .requiredOption('--ptr <ptr>', '文章指针')
  .requiredOption('--title <string>', '新标题')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const result = await publisher.updateArticleTitle(options.ptr, options.title)
      console.log('✓ 标题更新完成')
      console.log(`  文章：${options.ptr}`)
      console.log(`  原标题：${result.oldTitle}`)
      console.log(`  新标题：${result.newTitle}`)
    } catch (err) {
      console.error('✗ 更新失败:', err.message)
      process.exit(1)
    }
  })

// update article-cover
updateCmd
  .command('article-cover')
  .description('更新文章封面')
  .requiredOption('--ptr <ptr>', '文章指针')
  .requiredOption('--image <ptr>', '新封面图片指针')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const result = await publisher.updateArticleCover(options.ptr, options.image)
      console.log('✓ 封面更新完成')
      console.log(`  文章：${options.ptr}`)
      console.log(`  原封面：${result.oldCover || '无'}`)
      console.log(`  新封面：${result.newCover}`)
    } catch (err) {
      console.error('✗ 更新失败:', err.message)
      process.exit(1)
    }
  })

// remove article-cover
updateCmd
  .command('remove-cover')
  .description('移除文章封面')
  .requiredOption('--ptr <ptr>', '文章指针')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const result = await publisher.removeArticleCover(options.ptr)
      console.log('✓ 封面移除完成')
      console.log(`  文章：${options.ptr}`)
      console.log(`  移除封面：${result.removedCover || '无'}`)
    } catch (err) {
      console.error('✗ 移除失败:', err.message)
      process.exit(1)
    }
  })

// update article-tags
updateCmd
  .command('article-tags')
  .description('更新文章标签（替换所有标签）')
  .requiredOption('--ptr <ptr>', '文章指针')
  .requiredOption('--tags <string>', '新标签列表（逗号分隔）')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const tagNames = options.tags.split(',').map(t => t.trim()).filter(Boolean)
      const result = await publisher.updateArticleTags(options.ptr, tagNames)
      
      console.log('✓ 标签更新完成')
      console.log(`  文章：${options.ptr}`)
      if (result.removedTags.length > 0) {
        console.log(`  移除标签：${result.removedTags.join(', ')}`)
      }
      if (result.addedTags.length > 0) {
        console.log(`  添加标签：${result.addedTags.join(', ')}`)
      }
      if (result.removedTags.length === 0 && result.addedTags.length === 0) {
        console.log('  标签无变化')
      }
    } catch (err) {
      console.error('✗ 更新失败:', err.message)
      process.exit(1)
    }
  })

// update add-tag
updateCmd
  .command('add-tag')
  .description('添加单个标签到文章')
  .requiredOption('--ptr <ptr>', '文章指针')
  .requiredOption('--name <string>', '标签名称')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const result = await publisher.addTagToArticle(options.ptr, options.name)
      console.log('✓ 标签添加完成')
      console.log(`  文章：${options.ptr}`)
      console.log(`  标签：${options.name}`)
      console.log(`  ${result.created ? '新建标签' : '使用现有标签'}`)
    } catch (err) {
      console.error('✗ 添加失败:', err.message)
      process.exit(1)
    }
  })

// update remove-tag
updateCmd
  .command('remove-tag')
  .description('从文章移除单个标签')
  .requiredOption('--ptr <ptr>', '文章指针')
  .requiredOption('--name <string>', '标签名称')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const result = await publisher.removeTagFromArticle(options.ptr, options.name)
      console.log('✓ 标签移除完成')
      console.log(`  文章：${options.ptr}`)
      console.log(`  移除标签：${result.tagName}`)
    } catch (err) {
      console.error('✗ 移除失败:', err.message)
      process.exit(1)
    }
  })

// update article-file
updateCmd
  .command('article-file')
  .description('更新文章文件内容')
  .requiredOption('--ptr <ptr>', '文章指针')
  .requiredOption('--file <path>', '新文件路径')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const filePath = path.resolve(process.cwd(), options.file)
      const result = await publisher.updateArticleFile(options.ptr, filePath)
      console.log('✓ 文件内容更新完成')
      console.log(`  文章：${options.ptr}`)
      console.log(`  新路径：${result.newPath}`)
    } catch (err) {
      console.error('✗ 更新失败:', err.message)
      process.exit(1)
    }
  })

// update image-filename
updateCmd
  .command('image-filename')
  .description('更新图片文件名元数据')
  .requiredOption('--ptr <ptr>', '图片指针')
  .requiredOption('--filename <string>', '新文件名')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      const result = await publisher.updateImageFilename(options.ptr, options.filename)
      console.log('✓ 文件名更新完成')
      console.log(`  图片：${options.ptr}`)
      console.log(`  原文件名：${result.oldFilename}`)
      console.log(`  新文件名：${result.newFilename}`)
    } catch (err) {
      console.error('✗ 更新失败:', err.message)
      process.exit(1)
    }
  })

// 解析命令行
program.parse()
