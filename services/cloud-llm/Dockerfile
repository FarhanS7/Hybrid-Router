FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY services/cloud-llm ./services/cloud-llm
RUN npm install
RUN npm run build:core && npm run build --workspace @har/cloud-llm

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 4004
CMD ["npm", "--workspace", "@har/cloud-llm", "run", "start"]
