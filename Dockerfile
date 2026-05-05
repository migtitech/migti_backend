FROM node:20-bookworm
WORKDIR /app

# Shared libraries for Puppeteer's bundled Chrome (headless PDF export)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libnspr4 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    libdbus-1-3 \
    libatspi2.0-0 \
    libxshmfence1 \
    fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

# MongoDB Database Tools (mongodump) for scheduled backups
ARG MONGO_TOOLS_VERSION=100.10.0
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && arch="$(dpkg --print-architecture)" \
  && case "$arch" in \
       amd64) mongo_os=debian12; mongo_arch=x86_64 ;; \
       arm64) mongo_os=ubuntu2204; mongo_arch=arm64 ;; \
       *) echo "unsupported arch: $arch"; exit 1 ;; \
     esac \
  && curl -fsSL "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-${mongo_os}-${mongo_arch}-${MONGO_TOOLS_VERSION}.tgz" \
    | tar -xz -C /tmp \
  && mv "/tmp/mongodb-database-tools-${mongo_os}-${mongo_arch}-${MONGO_TOOLS_VERSION}/bin/"* /usr/local/bin/ \
  && rm -rf "/tmp/mongodb-database-tools-${mongo_os}-${mongo_arch}-${MONGO_TOOLS_VERSION}" \
  && apt-get purge -y curl \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 7200
CMD ["node", "src/index.js"]