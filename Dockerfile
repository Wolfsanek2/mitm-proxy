FROM node:latest

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

EXPOSE 8080
EXPOSE 8000

# RUN ./cmd/get_ca.sh
# RUN ./cmd/get_cert.sh mail.ru 1000

CMD [ "node", "./index.js" ]
