FROM node:20-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

RUN apk add --no-cache ca-certificates && \
    mkdir -p /usr/local/share/ca-certificates && \
    chmod 755 /usr/local/share/ca-certificates

COPY ca.crt /usr/local/share/ca-certificates/mitm-ca.crt
RUN chmod 644 /usr/local/share/ca-certificates/mitm-ca.crt && \
    update-ca-certificates

EXPOSE 8080
EXPOSE 8000

CMD [ "node", "./index.js" ]
