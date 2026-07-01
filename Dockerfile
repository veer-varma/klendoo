# Copyright (c) 2026 Veer Varma. All rights reserved.
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Build (placeholder for now)
RUN npm run build 2>/dev/null || true

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "run", "dev"]
