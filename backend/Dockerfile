# ------------ BUILD STAGE ------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# ------------ RUNTIME STAGE ------------
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app /app

RUN apk add --no-cache sqlite

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
