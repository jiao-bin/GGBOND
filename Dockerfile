# 多阶段构建：高效率生产镜像
FROM node:20-alpine AS builder

WORKDIR /app

# 依赖安装
COPY package.json package-lock.json* ./
RUN npm install

# 源码复制并构建前端与后端产物
COPY . .
RUN npm run build

# 生产运行阶段
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# 复制生产依赖与构建产物
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
