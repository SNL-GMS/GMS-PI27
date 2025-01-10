#! /bin/bash
set -eu
cat /etc/nginx/nginx-ian.nginx | envsubst '$URL_PATH $NGINX_WORKER_PROCESSES $NODE_ENV' > /etc/nginx/nginx.conf

export GMS_KEYCLOAK_REALM=${GMS_KEYCLOAK_REALM}
export GMS_KEYCLOAK_URL=${GMS_KEYCLOAK_URL}
export GMS_KEYCLOAK_CLIENT_ID=${GMS_KEYCLOAK_CLIENT_ID}
export GMS_DISABLE_KEYCLOAK_AUTH=${GMS_DISABLE_KEYCLOAK_AUTH}
cat /opt/interactive-analysis-ui/${NODE_ENV}/env-inject-template.js | envsubst '$GMS_KEYCLOAK_REALM $GMS_KEYCLOAK_URL $GMS_KEYCLOAK_CLIENT_ID $GMS_DISABLE_KEYCLOAK_AUTH'  > /opt/interactive-analysis-ui/${NODE_ENV}/env-inject.js

exec nginx -g 'daemon off;'
