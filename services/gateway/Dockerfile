FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY services/gateway ./services/gateway
RUN npm install
RUN npm run build:core && npm run build --workspace @har/gateway

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 4000
CMD ["npm", "--workspace", "@har/gateway", "run", "start"]
