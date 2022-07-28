FROM node:12-alpine AS build

ENV TZ=Asia/Seoul
WORKDIR /app

COPY package*.json /app
RUN npm update && npm install

COPY . /app
RUN npm run build -- --prod --aot

FROM nginx:1.21.1-alpine
COPY --from=build /app/build/ /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/
