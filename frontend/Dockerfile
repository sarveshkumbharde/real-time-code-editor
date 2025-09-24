# Use Node.js for building
FROM node:18 AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build the React app
RUN npm run build

# Serve using a lightweight webserver
# Serve using a lightweight webserver
FROM nginx:alpine

# Vite outputs to /app/dist, not /app/build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]

# Serve using a lightweight webserver
FROM nginx:alpine

# Vite outputs to /app/dist, not /app/build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]

