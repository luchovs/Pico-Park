FROM node:22-alpine
WORKDIR /app

# Primero solo las dependencias, para aprovechar la caché de capas
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["node", "src/index.js"]
