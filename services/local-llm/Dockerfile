FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY services/local-llm ./services/local-llm
RUN npm install
RUN npm run build:core && npm run build --workspace @har/local-llm

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 4003
CMD ["npm", "--workspace", "@har/local-llm", "run", "start"]
