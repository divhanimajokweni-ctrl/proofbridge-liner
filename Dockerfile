FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts/ ./scripts/

RUN npm install --omit=dev --ignore-scripts

COPY . .

ENV NODE_ENV=production
ENV DASHBOARD_PORT=8080
ENV DASHBOARD_HOST=0.0.0.0

EXPOSE 8080

CMD ["node", "dashboard/server.js"]
