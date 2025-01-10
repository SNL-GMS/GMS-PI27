ARG SOURCE_IMAGE
ARG SOURCE_TAG
FROM ${SOURCE_IMAGE}:${SOURCE_TAG}

ARG UBI_RPM_URL
ARG DOCKER_YUM_URL

COPY src/*.repo /etc/yum.repos.d/

USER 0

RUN set -ex && \
    # setup repos
    sed -i -e "s~#UBI_RPM_URL#~${UBI_RPM_URL}~" /etc/yum.repos.d/ubi.repo && \
    sed -i -e "s~#DOCKER_YUM_URL#~${DOCKER_YUM_URL}~g" /etc/yum.repos.d/docker-ce.repo && \
    # configure yum
    echo "skip_missing_names_on_install=0" >> /etc/dnf/dnf.conf && \
    # disable docs
    echo "tsflags=nodocs" >> /etc/dnf/dnf.conf && \
    # install a few things needed to build images
    dnf install -y docker-ce-cli make rsync && \
    # clean up
    dnf clean all && \
    rm -rf /var/cache/dnf

CMD ["/bin/bash"]
