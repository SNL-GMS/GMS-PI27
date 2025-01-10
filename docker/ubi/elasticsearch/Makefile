NAME = bitnami-elasticsearch

BUILD_ARGS = --build-arg 'ES_IMAGE=$${CI_THIRD_PARTY_DOCKER_REGISTRY}/bitnami/elasticsearch' \
             --build-arg 'ES_TAG=$${BITNAMI_ELASTICSEARCH_TAG}'

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker
