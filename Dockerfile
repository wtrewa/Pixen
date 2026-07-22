FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && ls dist/main.js

RUN npm prune --production && npm cache clean --force
RUN mkdir -p logs && chmod -R 777 logs

EXPOSE 8080
CMD ["node", "--dns-result-order=ipv4first", "dist/main.js"]
