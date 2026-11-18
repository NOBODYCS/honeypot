FROM node:22-alpine

ENV NODE_ENV=production
ENV HONEYPOT_DB_PATH=/data/honeypot.db
ENV PORT=8080

WORKDIR /app

COPY package.json ./
COPY src ./src
COPY public ./public

RUN mkdir -p /data
VOLUME /data

EXPOSE 8080

CMD ["node", "src/server.js"]
