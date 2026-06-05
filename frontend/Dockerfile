FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
COPY package*.json ./
RUN npm ci
# The lockfile was generated on Windows so lightningcss-linux-x64-musl is not
# resolved in it. Install it explicitly so Tailwind CSS v4 / PostCSS can load
# the native addon inside the Alpine (musl) container.
RUN node -e "require('lightningcss')" 2>/dev/null \
    || npm install --no-save \
         lightningcss-linux-x64-musl@$(node -e "console.log(require('./node_modules/lightningcss/package.json').version)")
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
