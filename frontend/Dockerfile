FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
COPY package*.json ./
# The lockfile was generated on Windows and misses lightningcss-linux-x64-musl
# (npm bug #4828). Delete it so npm resolves the correct platform binaries.
RUN rm -f package-lock.json && npm install
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
