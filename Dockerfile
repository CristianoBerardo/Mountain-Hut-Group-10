FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build-only

FROM node:24-alpine AS backend-build
RUN apk add --no-cache nginx

WORKDIR /app/backend
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ ./

COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 80

CMD ["sh", "-c", "node /app/backend/index.js & nginx -g 'daemon off;'"]