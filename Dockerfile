# 多阶段构建 Dockerfile for AetherLink
# 阶段1: 构建阶段
FROM node:22-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV VITE_CJS_IGNORE_WARNING=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV TSC_COMPILE_ON_ERROR=true
ENV CI=false

# 设置npm镜像源（可选，提高国内下载速度）
RUN npm config set registry https://registry.npmmirror.com

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖，构建时需要）
RUN npm ci --legacy-peer-deps --ignore-scripts || npm install --legacy-peer-deps --ignore-scripts

# 复制源代码和配置文件
COPY . .

# 构建应用（带详细日志）
RUN echo "开始构建..." && \
    npm run build --verbose || \
    (echo "构建失败，尝试清理缓存..." && \
     rm -rf node_modules/.vite && \
     npm run build --verbose)

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
