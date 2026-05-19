/**
 * 局域网内容发布工具配置
 */

export const CONFIG = {
  // lmjweb 服务地址
  LMJWEB_API: 'http://192.168.100.5:30000',

  // 博客信息对象指针（固定指针）
  BLOG_INFO_PTR: '01b77b0f6cfd894d738585edef83a8b824',

  // 图片文件存储目录（Nginx alias 路径）
  IMAGES_DIR: './images',

  // 文章内容存储目录（Nginx alias 路径）
  ARTICLES_DIR: './articles'
}

export default CONFIG
