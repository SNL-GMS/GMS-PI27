# build bitnami kibana on ubi
ARG KIBANA_IMAGE
ARG KIBANA_TAG
ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME
FROM ${KIBANA_IMAGE}:${KIBANA_TAG} as base
FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/ubi:${DOCKER_IMAGE_TAG}

ENV PATH="/opt/bitnami/common/bin:/opt/bitnami/kibana/bin:$PATH"
ENV BITNAMI_APP_NAME="kibana"

USER 0

# copy files out of bitnami image into our ubi image
COPY --from=base --chown=gms:gms /opt/bitnami /opt/bitnami
COPY --from=base --chown=gms:gms /bitnami /bitnami

RUN set -ex && \
    dnf -y install shadow-utils freetype fontconfig nss && \
    /opt/bitnami/scripts/kibana/postunpack.sh && \
    mkdir -p /docker-entrypoint-initdb.d && \
    chown gms:0 /docker-entrypoint-initdb.d && \
    # clean up
    dnf clean all && \
    rm -rf /var/cache/dnf

EXPOSE 6501
WORKDIR /opt/bitnami/kibana

# gms uid
USER 1001

ENTRYPOINT [ "/opt/bitnami/scripts/kibana/entrypoint.sh" ]
CMD [ "/opt/bitnami/scripts/kibana/run.sh" ]