# =============================================================================
# MF-Investments Multi-Stage Dockerfile
# =============================================================================
# Builds a production-ready container with:
# - Node.js backend serving API on port 4000
# - Pre-built React frontend served as static files
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build Frontend
# -----------------------------------------------------------------------------
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Install client dependencies first (better layer caching)
COPY client/package*.json ./
RUN npm ci

# Copy client source and build
COPY client/ ./
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Install Backend Dependencies
# -----------------------------------------------------------------------------
FROM node:18-alpine AS deps

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 3: Production Runtime
# -----------------------------------------------------------------------------
FROM node:18-alpine AS runtime

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mfapp -u 1001 -G nodejs

WORKDIR /app

# Copy production dependencies
COPY --from=deps --chown=mfapp:nodejs /app/node_modules ./node_modules

# Copy backend source
COPY --chown=mfapp:nodejs package*.json ./
COPY --chown=mfapp:nodejs src/ ./src/
COPY --chown=mfapp:nodejs scripts/ ./scripts/

# Create logs directory with correct permissions
# Create logs directory and ensure ownership of /app
RUN mkdir -p logs && chown -R mfapp:nodejs /app

# Copy built frontend to serve as static files
COPY --from=frontend-builder --chown=mfapp:nodejs /app/client/dist ./client/dist

# Environment defaults (override via docker-compose or runtime)
ENV NODE_ENV=production
ENV PORT=4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Switch to non-root user
USER mfapp

# Expose API port
EXPOSE 4000

# Start the server
CMD ["node", "src/server.js"]
