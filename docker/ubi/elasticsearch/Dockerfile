# build bitnami elasticsearch on ubi
ARG ES_IMAGE
ARG ES_TAG
ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME
FROM ${ES_IMAGE}:${ES_TAG} as es
FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/ubi:${DOCKER_IMAGE_TAG}

ENV PATH="/opt/bitnami/common/bin:/opt/bitnami/java/bin:/opt/bitnami/elasticsearch/bin:$PATH"
ENV BITNAMI_APP_NAME="elasticsearch"
ENV ES_JAVA_HOME="/opt/bitnami/java"
ENV JAVA_HOME="/opt/bitnami/java"
ENV LD_LIBRARY_PATH="/opt/bitnami/elasticsearch/jdk/lib:/opt/bitnami/elasticsearch/jdk/lib/server:$LD_LIBRARY_PATH"

USER 0

# copy files out of bitnami image into our ubi image
COPY --from=es --chown=gms:gms /opt/bitnami /opt/bitnami
COPY --from=es --chown=gms:gms /bitnami /bitnami

RUN set -ex && \
    dnf -y install nc shadow-utils zip findutils unzip procps-ng freetype fontconfig dejavu-sans-fonts hostname && \
    /opt/bitnami/scripts/elasticsearch/postunpack.sh && \
    mkdir -p /docker-entrypoint-initdb.d && \
    chown gms:0 /docker-entrypoint-initdb.d && \
    # clean up
    dnf clean all && \
    rm -rf /var/cache/dnf

EXPOSE 9200 9300
WORKDIR /opt/bitnami/elasticsearch

# gms uid
USER 1001

ENTRYPOINT [ "/opt/bitnami/scripts/elasticsearch/entrypoint.sh" ]
CMD [ "/opt/bitnami/scripts/elasticsearch/run.sh" ]