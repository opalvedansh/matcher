FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Expose API port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
