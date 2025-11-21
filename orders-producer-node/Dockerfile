# orders-producer-node/Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

# Copiamos el código fuente
COPY src ./src

EXPOSE 3002 4000

CMD ["npm", "run", "dev"]
