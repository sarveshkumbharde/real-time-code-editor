FROM node:18
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy backend source
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]
