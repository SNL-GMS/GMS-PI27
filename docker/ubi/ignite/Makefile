NAME = ignite

BUILD_ARGS = --build-arg 'IGNITE_IMAGE=$${CI_THIRD_PARTY_DOCKER_REGISTRY}/apacheignite/ignite' \
             --build-arg 'IGNITE_TAG=$${IGNITE_TAG}' \
             --build-arg 'MAVEN_REPO_URL=$${MAVEN_REPO_URL}'

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker
