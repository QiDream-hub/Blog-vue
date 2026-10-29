# ---------- 阶段 1：编译 ----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json .
RUN npm ci

COPY index.html ./
COPY src ./src
COPY public ./public
COPY vite.config.js ./
COPY jsconfig.json ./
RUN npm run build

# ---------- 阶段 2：运行 ----------
FROM nginx:alpine
COPY --from=builder /app/dist /blog/dist
COPY blog.conf.template /etc/nginx/templates/
COPY entrypoint.sh /blog/entrypoint.sh
RUN chmod +x /blog/entrypoint.sh
ENTRYPOINT ["/blog/entrypoint.sh"]

EXPOSE 80