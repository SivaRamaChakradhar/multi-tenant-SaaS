FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application source
COPY src ./src

# Copy seeds directory
COPY seeds ./seeds

# Install wget for healthcheck
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

EXPOSE 5000

CMD ["npm", "start"]
