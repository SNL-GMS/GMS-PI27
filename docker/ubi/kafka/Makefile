NAME = bitnami-kafka

BUILD_ARGS = --build-arg 'KAFKA_IMAGE=$${CI_THIRD_PARTY_DOCKER_REGISTRY}/bitnami/kafka' \
             --build-arg 'KAFKA_TAG=$${BITNAMI_KAFKA_TAG}'

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker
