NAME = bitnami-kibana

BUILD_ARGS = --build-arg 'KIBANA_IMAGE=$${CI_THIRD_PARTY_DOCKER_REGISTRY}/bitnami/kibana' \
             --build-arg 'KIBANA_TAG=$${BITNAMI_KIBANA_TAG}'

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker
