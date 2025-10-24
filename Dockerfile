FROM node:18-alpine
WORKDIR /app

# Copy package.json first
COPY backend/package.json ./

# Copy package-lock.json if it exists, otherwise continue
COPY backend/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy all backend source code
COPY backend/ ./

EXPOSE 5000
CMD ["node", "server.js"]
