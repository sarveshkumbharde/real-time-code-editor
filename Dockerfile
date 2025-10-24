FROM node:18-alpine
WORKDIR /app

# Copy package files from backend
COPY backend/package.json ./
COPY backend/package-lock.json* ./ 2>/dev/null || true

# Install dependencies
RUN npm install

# Copy all backend source code
COPY backend/ ./

EXPOSE 5000
CMD ["node", "server.js"]
