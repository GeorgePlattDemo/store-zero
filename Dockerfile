# Store Zero service. No dependencies to install and nothing fetched at start: the code built is the code that answers.
FROM node:22.23.2-slim

WORKDIR /opt/store-zero
COPY package.json ./
COPY src ./src
COPY data ./data

ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
EXPOSE 8080
USER node

CMD ["node", "src/service/server.mjs"]
