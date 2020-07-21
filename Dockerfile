FROM node:12-buster-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json .
RUN npm install

COPY ./ .

CMD ["npm","start"]