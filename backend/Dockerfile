FROM node:18-alpine
WORKDIR /app

# Copy from backend folder (add "backend/" prefix)
COPY backend/package*.json ./

RUN npm install

# Copy all backend files
COPY backend/ ./

EXPOSE 5000
CMD ["node", "server.js"]