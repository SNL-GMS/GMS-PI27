ARG IGNITE_IMAGE
ARG IGNITE_TAG
ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${IGNITE_IMAGE}:${IGNITE_TAG} as ignite
FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/ubi:${DOCKER_IMAGE_TAG}

ARG MAVEN_REPO_URL
ENV JAVA_HOME /usr/lib/jvm/jre-11-openjdk
ENV PATH $JAVA_HOME/bin:$PATH
ENV JAVA_TOOL_OPTIONS='-XX:MaxRAMPercentage=25.0'
ENV IGNITE_HOME /opt/ignite/apache-ignite

USER 0

COPY --from=ignite --chown=gms:gms /opt/ignite /opt/ignite/

RUN dnf install -y java-11-openjdk-headless tzdata-java freetype fontconfig dejavu-sans-fonts && \
    dnf clean all && \
    rm -rf /var/cache/dnf && \
    sed -i -e "s~security.useSystemPropertiesFile=true~security.useSystemPropertiesFile=false~" ${JAVA_HOME}/conf/security/java.security && \
    cd ${IGNITE_HOME}/libs/optional && \
    curl -fOL ${MAVEN_REPO_URL}/net/logstash/logback/logstash-logback-encoder/7.1.1/logstash-logback-encoder-7.1.1.jar && \
    curl -fOL ${MAVEN_REPO_URL}/ch/qos/logback/logback-classic/1.2.11/logback-classic-1.2.11.jar && \
    chmod 777 $IGNITE_HOME

# gms uid
USER 1001

CMD $IGNITE_HOME/run.sh

EXPOSE 11211 47100 47500 49112 10800 8080