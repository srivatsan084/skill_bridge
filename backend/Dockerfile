FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for Docker caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose backend port
EXPOSE 5000

# Run idempotent dataset import followed by Express server
CMD ["sh", "-c", "node scripts/importIndustryData.js && node server.js"]
