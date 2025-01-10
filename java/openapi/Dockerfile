# This image pulls the internet swagger-ui that is based on alpine, then copies
# the original files out of it into our ubi/nginx image
#
ARG FROM_IMAGE
ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME
FROM ${FROM_IMAGE} as base
FROM $DOCKER_REGISTRY/$PROJECT_NAME/nginx:$DOCKER_IMAGE_TAG

ENV API_KEY="**NONE**"
ENV SWAGGER_JSON="/"
ENV PORT=8080
ENV BASE_URL="/swagger"
ENV CONFIG_URL="swagger-config.json"
ENV NGINX_ENTRYPOINT_WORKER_PROCESSES_AUTOTUNE=1

USER 0

# copy files out of the base swagger image
COPY --from=base /docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=base /docker-entrypoint.d/ /docker-entrypoint.d/
COPY --from=base /etc/nginx /etc/nginx
COPY --from=base /usr/share/nginx/ /usr/share/nginx/

RUN set -ex && \
    # install node
    dnf -y module enable nodejs:18 && \
    dnf -y install nodejs && \
    # modify nginx.conf
    sed -i '/gzip_types/a \ \ map $remote_addr $log_ip {\"127.0.0.1" 0;\ default 1;}' /etc/nginx/nginx.conf && \
    sed -i '/index/a \ \ \ \ access_log /var/log/nginx/access.log combined if=$log_ip;' /etc/nginx/nginx.conf && \
    sed -i '/index/a \ \ \ \ absolute_redirect off;' /etc/nginx/nginx.conf && \
    chown -R nginx:nginx /etc/nginx /usr/share/nginx && \
    # clean up
    dnf clean all && \
    rm -rf /var/cache/dnf

# copy gms items
COPY --chown=nginx:nginx src/50-configure-spec-files.sh /docker-entrypoint.d/50-configure-spec-files.sh
COPY --chown=nginx:nginx src/spec /usr/share/nginx/html/spec

# nginx uid
USER 1002

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
