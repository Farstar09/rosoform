# ROSOIDEAE Platform - Docker Virtualization
# Multi-stage build for optimal container size

FROM node:20-alpine AS visual-builder
WORKDIR /build-visual
COPY visual/ ./visual/
COPY logic/ ./logic/
WORKDIR /build-visual/visual
RUN npm install && npm run build

FROM node:20-alpine AS connectivity-builder
WORKDIR /build-connectivity
COPY connectivity/ ./connectivity/
COPY logic/ ./logic/
WORKDIR /build-connectivity/connectivity
RUN npm install && npm run build

FROM postgres:15-alpine AS storage-foundation
COPY storage/blueprints/*.sql /docker-entrypoint-initdb.d/

FROM node:20-alpine AS runtime-environment
WORKDIR /rosoideae

# Copy compiled artifacts
COPY --from=visual-builder /build-visual/visual/dist ./visual-dist
COPY --from=connectivity-builder /build-connectivity/connectivity/dist ./connectivity-dist

# Install production dependencies only
COPY connectivity/package*.json ./
RUN npm install --production

# Environment configuration
ENV NODE_ENV=production
ENV PORT=8080
ENV WS_PORT=8081

# Expose ports
EXPOSE 8080 8081

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Launch application
CMD ["node", "connectivity-dist/server-bootstrap.js"]
