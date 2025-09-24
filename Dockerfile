# Use Node.js LTS as base
FROM node:18

# Create app directory
WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose server port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]