FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY services/intent-service ./services/intent-service
RUN npm install
RUN npm run build:core && npm run build --workspace @har/intent-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 4002
CMD ["npm", "--workspace", "@har/intent-service", "run", "start"]
