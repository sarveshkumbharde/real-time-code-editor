FROM node:18-alpine
WORKDIR /app

# Copy package files - no backend/ prefix needed
COPY package.json ./
COPY package-lock.json* ./ 2>/dev/null || true

RUN npm install

# Copy all files - no backend/ prefix
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]
