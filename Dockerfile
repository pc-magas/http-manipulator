FROM node:lts


WORKDIR /usr/src/app
COPY . /usr/src/app/
RUN npm ci --only=production

EXPOSE 3000
EXPOSE 80
EXPOSE 443

CMD [ "node", "src/index.js" ]