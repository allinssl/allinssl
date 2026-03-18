# Frontend build stage
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY frontend/package.json frontend/pnpm-lock.yaml* frontend/pnpm-workspace.yaml frontend/turbo.json ./
COPY frontend/apps/allin-ssl/package.json ./apps/allin-ssl/
COPY frontend/packages/ ./packages/
COPY frontend/plugins/ ./plugins/

# Install dependencies
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN pnpm run build

# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache git make gcc musl-dev

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy frontend build artifacts from frontend-builder
COPY --from=frontend-builder /frontend/static/build ./static/build

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o allinssl ./cmd/main.go

# Final stage
FROM frolvlad/alpine-glibc

WORKDIR /www/allinssl/

# Install runtime dependencies
RUN apk add --no-cache tzdata

# Copy binary and script from builder
COPY --from=builder /build/allinssl /www/allinssl/allinssl
COPY --from=builder /build/script/allinssl.sh /www/allinssl/allinssl.sh

RUN chmod +x /www/allinssl/allinssl.sh

ENV TZ=Asia/Shanghai
RUN cat > /entrypoint.sh <<'EOF'
#!/bin/sh
if [ ! -f /www/allinssl/data/.initialized ]; then
    echo ${ALLINSSL_USER:-allinssl} | /www/allinssl/allinssl 5
    echo ${ALLINSSL_URL:-/} | /www/allinssl/allinssl 4
    echo ${ALLINSSL_PWD:-allinssldocker} | /www/allinssl/allinssl 6
    echo 8888 | /www/allinssl/allinssl 7
    touch /www/allinssl/data/.initialized
fi
/www/allinssl/allinssl 2
exec /www/allinssl/allinssl start
EOF
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 8888
