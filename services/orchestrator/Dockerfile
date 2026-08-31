FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY services/orchestrator ./services/orchestrator
RUN npm install
RUN npm run build:core && npm run build --workspace @har/orchestrator

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 4001
CMD ["npm", "--workspace", "@har/orchestrator", "run", "start"]
