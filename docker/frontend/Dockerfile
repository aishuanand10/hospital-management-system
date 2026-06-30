FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

EXPOSE 3000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
