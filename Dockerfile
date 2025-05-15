FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY ./src ./src
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --production
RUN npm cache clean --force
CMD ["node", "./dist/main.js"]
