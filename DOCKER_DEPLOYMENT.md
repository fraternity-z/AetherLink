# AetherLink Docker 部署指南

## 🚀 快速开始

### 前置要求
- Docker 20.10+
- Docker Compose 2.0+

### 方式一：使用 Docker Compose（推荐）

```bash
# 启动应用
npm run docker:up

# 访问应用
open http://localhost

# 停止应用
npm run docker:down
```

### 方式二：直接使用 Docker

```bash
# 构建镜像
npm run docker:build

# 运行容器
docker run -d --name aetherlink -p 80:80 --restart unless-stopped aetherlink

# 停止容器
docker stop aetherlink && docker rm aetherlink
```

## 📋 常用命令

```bash
# 查看日志
npm run docker:logs

# 重新构建
docker-compose up --build

# 查看运行状态
docker-compose ps

# 进入容器
docker exec -it aetherlink sh
```

## 🔧 配置说明

- **端口**: 80 (HTTP)
- **容器名**: aetherlink
- **重启策略**: unless-stopped

## 配置说明

### 环境变量

主要环境变量配置：

- `NODE_ENV`: 运行环境 (development/production)
- `PORT`: 服务端口 (默认: 80)
- `HOST`: 绑定地址 (默认: 0.0.0.0)

### 端口映射

- **开发环境**: 5173:5173
- **生产环境**: 80:80

### 数据持久化

如果需要数据持久化，可以添加卷映射：

```yaml
volumes:
  - ./data:/app/data
  - ./logs:/var/log/nginx
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :80
   
   # 修改端口映射
   docker-compose up -p 8080:80
   ```

2. **内存不足**
   ```bash
   # 检查 Docker 资源使用
   docker stats
   
   # 清理未使用的资源
   npm run docker:clean
   ```

3. **构建失败**
   ```bash
   # 清理 Docker 缓存
   docker builder prune
   
   # 重新构建
   docker-compose build --no-cache
   ```

### 日志查看

```bash
# 查看应用日志
npm run docker:logs

# 查看特定服务日志
docker-compose logs -f aetherlink-prod

# 查看 Nginx 日志
docker exec -it aetherlink-production tail -f /var/log/nginx/access.log
```

### 性能监控

```bash
# 查看容器资源使用
docker stats aetherlink-production

# 查看容器详细信息
docker inspect aetherlink-production
```

## 生产环境优化

### 1. 反向代理配置

如果需要 HTTPS 或负载均衡，建议在前面加一层反向代理：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. 资源限制

在生产环境中建议设置资源限制：

```yaml
services:
  aetherlink:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### 3. 健康检查

应用已配置健康检查，可以通过以下方式验证：

```bash
# 检查健康状态
curl http://localhost/health

# 查看健康检查日志
docker inspect aetherlink-production | grep Health -A 10
```

## 更新部署

### 滚动更新

```bash
# 拉取最新代码
git pull

# 重新构建并部署
docker-compose -f docker-compose.prod.yml up -d --build

# 验证部署
curl http://localhost/health
```

### 回滚

```bash
# 查看镜像历史
docker images aetherlink

# 回滚到指定版本
docker tag aetherlink:backup aetherlink:latest
docker-compose -f docker-compose.prod.yml up -d
```

## 安全建议

1. **定期更新基础镜像**
2. **使用非 root 用户运行**（已配置）
3. **限制容器权限**
4. **定期备份数据**
5. **监控安全漏洞**

## 支持

如果遇到问题，请：

1. 查看日志文件
2. 检查 Docker 和系统资源
3. 参考故障排除部分
4. 提交 Issue 或联系维护团队
