# build bitnami kafka on ubi
ARG KAFKA_IMAGE
ARG KAFKA_TAG
ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME
FROM ${KAFKA_IMAGE}:${KAFKA_TAG} as kafka
FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/ubi:${DOCKER_IMAGE_TAG}

ARG BITNAMI_HOME=/opt/bitnami
ARG BITNAMI_VOLUME_DIR=/bitnami
ENV BITNAMI_APP_NAME="kafka" \
    JAVA_HOME="${BITNAMI_HOME}/java" \
    PATH="${BITNAMI_HOME}/common/bin:${BITNAMI_HOME}/java/bin:${BITNAMI_HOME}/kafka/bin:$PATH"

USER 0

# copy files out of kafka image into our ubi image
COPY --from=kafka ${BITNAMI_HOME} ${BITNAMI_HOME}
COPY --from=kafka ${BITNAMI_VOLUME_DIR} ${BITNAMI_VOLUME_DIR}

RUN set -ex && \
    dnf -y install procps && \
    chown -R gms:gms ${BITNAMI_HOME} ${BITNAMI_VOLUME_DIR} && \
    ln -s ${BITNAMI_HOME}/scripts/kafka/entrypoint.sh /entrypoint.sh && \
    ln -s ${BITNAMI_HOME}/scripts/kafka/run.sh /run.sh && \
    # clean up
    dnf clean all && \
    rm -rf /var/cache/dnf

EXPOSE 9092

# gms uid
USER 1001

ENTRYPOINT [ "/opt/bitnami/scripts/kafka/entrypoint.sh" ]
CMD [ "/opt/bitnami/scripts/kafka/run.sh" ]
