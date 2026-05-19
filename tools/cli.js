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
  .requiredOption('--slug <string>', '文章 slug')
  .option('--filename <string>', '原始文件名（用于元数据记录）')
  .action(async (options, cmd) => {
    const publisher = createPublisher(cmd.parent.parent.opts().config)

    try {
      // 解析文件路径：相对于当前工作目录
      const filePath = path.resolve(process.cwd(), options.file)
      const result = await publisher.registerArticle({
        filePath,
        title: options.title,
        slug: options.slug,
        filename: options.filename
      })
      console.log('✓ 文章注册完成')
      console.log(`  文章指针：${result.ptr}`)
      console.log(`  存储路径：${result.path}`)
      console.log(`  标题：${result.title}`)
      console.log(`  Slug: ${result.slug}`)
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

// 解析命令行
program.parse()
