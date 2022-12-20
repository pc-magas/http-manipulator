FROM node:lts

EXPOSE 3000 \
       80 \
       443

COPY . /usr/src/app/

RUN rm -rf /usr/src/app/utils &&\
    mv /usr/src/app/config /etc/http_manipulator &&\
    mkdir -p "/etc/http_manipulator/ssl" &&\
    chmod 644 "/etc/http_manipulator" &&\
    chown -R node:node "/etc/http_manipulator" &&\
    mv /usr/src/app/entrypoint.sh /usr/bin/entrypoint &&\
    chown root:root /usr/bin/entrypoint &&\
    chmod 555 /usr/bin/entrypoint

VOLUME "/etc/http_manipulator"
WORKDIR /usr/src/app
RUN npm ci --omit=dev

USER node

ENTRYPOINT ["/usr/bin/entrypoint"]
CMD [ "node", "src/index.js" ]