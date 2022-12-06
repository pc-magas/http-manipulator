#/usr/bin/env bash

CERT_KEY=/etc/http_manipulator/ssl/default.pem
CERT_PATH=/etc/http_manipulator/ssl/default.crt

test ! -f ${CERT_KEY} && test ! -f ${CERT_PATH} && openssl req -newkey rsa:4096 -config /etc/http_manipulator/cert.conf -x509  -sha512  -days 365 -nodes -out ${CERT_KEY} -keyout ${CERT_PATH}

exec "$@"