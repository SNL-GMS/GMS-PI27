NAME       = gmskube
BUILD_ARGS = --build-arg 'GOOGLEAPIS_URL=$${GOOGLEAPIS_URL}' \
             --build-arg 'HELM_URL=$${HELM_URL}' \
             --build-arg 'HELM_VERSIONS=$${HELM_VERSIONS}'

CLEAN = rm -rf src/_deploy

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker
