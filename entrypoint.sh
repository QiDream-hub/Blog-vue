#!/bin/sh
set -e

missing=""
[ -d /blog/articles ] || missing="$missing\n  - /blog/articles  (文章目录)"
[ -d /blog/images ]   || missing="$missing\n  - /blog/images    (图片目录)"
[ -n "$META_SERVICE_URL" ] || missing="$missing\n  - 未设置环境变量 META_SERVICE_URL"
[ -n "$BLOG_INFO_PTR" ] || missing="$missing\n  - 未设置环境变量 BLOG_INFO_PTR"

if [ -n "$missing" ]; then
    echo "========================================"
    echo "启动失败：以下挂载目录或环境变量缺失"
    printf "%b\n\n" "$missing"
    echo "========================================"
    exit 1
fi

# 将 index.html 中 blog-config 节点里的 BLOG_INFO_PTR 替换为环境变量值
# 使用 | 作为分隔符，避免值中含有 / 时出错
INDEX_FILE=/blog/dist/index.html

if [ ! -f "$INDEX_FILE" ]; then
    echo "========================================"
    echo "启动失败：找不到 $INDEX_FILE"
    echo "========================================"
    exit 1
fi

# 值中的 sed 特殊字符（\ & |）需要转义，防止破坏替换
ESCAPED_PTR=$(printf '%s' "$BLOG_INFO_PTR" | sed 's/[\\&|]/\\&/g')

sed -i "/<script id=\"blog-config\"/,/<\/script>/ s|\(\"BLOG_INFO_PTR\"[[:space:]]*:[[:space:]]*\"\)[^\"]*\"|\1${ESCAPED_PTR}\"|" "$INDEX_FILE"

exec /docker-entrypoint.sh "$@"