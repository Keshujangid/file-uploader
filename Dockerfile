# Sample Dockerfile for NodeJS Apps

# Use a specific, stable Node version
FROM node:22

# Set environment variables
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Run Prisma generate to create the client
RUN npx prisma generate

RUN npx prisma generate --schema=./prisma/schema.prisma
# Copy all other files
COPY . .

# Expose port 8080
EXPOSE 8080

# Run the app
CMD ["node", "app.js"]
