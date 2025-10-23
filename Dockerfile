# # Use Node.js LTS as base
# FROM node:18

# # Create app directory
# WORKDIR /app

# # Copy package.json and install deps
# COPY package*.json ./
# RUN npm install

# # Copy the rest of the app
# COPY . .

# # Expose server port
# EXPOSE 5000

# # Start backend
# CMD ["npm", "start"]

# FROM node:18-alpine
# WORKDIR /app

# # Debug: See what files are in the build context
# RUN ls -la

# # Copy package.json from backend folder
# COPY backend/package.json ./
# COPY backend/package-lock.json* ./ 2>/dev/null || true

# # Debug: Check if package.json was copied
# RUN ls -la

# RUN npm install

# # Copy all backend files
# COPY backend/ ./

# # Debug: Check final structure
# RUN ls -la

# EXPOSE 5000
# CMD ["node", "server.js"]

FROM node:18-alpine
WORKDIR /app

# Copy package.json (it's in backend folder in build context)
COPY ./package.json ./

RUN npm install

# Copy server.js and other files
COPY ./server.js ./
COPY ./ ./

EXPOSE 5000
CMD ["node", "server.js"]