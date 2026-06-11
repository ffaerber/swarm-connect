# Dev image for the example/ playground served by Vite.
FROM node:22-alpine

WORKDIR /app

# Install dependencies first so the layer is cached unless the manifests change.
COPY package.json package-lock.json ./
RUN npm ci

# App source (kept in sync at runtime by `docker compose watch`).
COPY . .

# Vite dev server.
EXPOSE 5173

# Bind to 0.0.0.0 so the server is reachable from outside the container, and
# poll for changes since inotify events don't cross the compose-watch sync.
ENV VITE_USE_POLLING=true
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
