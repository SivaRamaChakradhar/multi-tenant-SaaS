FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application source
COPY src ./src

# ✅ COPY MIGRATIONS FROM src
COPY src/migrations ./migrations

EXPOSE 5000

CMD ["npm", "start"]
