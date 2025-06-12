# 多阶段构建 Dockerfile for AetherLink
# 阶段1: 构建阶段
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置npm镜像源（可选，提高国内下载速度）
RUN npm config set registry https://registry.npmmirror.com

# 复制package文件
COPY package*.json ./
COPY yarn.lock ./

# 安装依赖（使用npm ci获得更快、更可靠的构建）
RUN npm ci --only=production=false --silent

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 阶段2: 生产阶段
FROM nginx:alpine AS production

# 安装必要的工具
RUN apk add --no-cache curl

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建nginx运行所需的目录
RUN mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/cache/nginx/proxy_temp \
    && mkdir -p /var/cache/nginx/fastcgi_temp \
    && mkdir -p /var/cache/nginx/uwsgi_temp \
    && mkdir -p /var/cache/nginx/scgi_temp

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d

# 切换到非root用户
USER nginx

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
