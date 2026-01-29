# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy ALL files first (simpler and more reliable)
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile --network-timeout 300000

# Build the application
ENV APP_CONFIG=config/poc-dicom.js
ENV NODE_ENV=production
RUN yarn run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/platform/app/dist ./platform/app/dist
COPY --from=builder /app/platform/app/public/dicomweb ./platform/app/public/dicomweb
COPY --from=builder /app/server.mjs ./server.mjs

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.mjs"]
