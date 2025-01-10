NAME = keycloak
SOURCE_IMAGE = $${IRONBANK_REGISTRY}/ironbank/opensource/keycloak/keycloak
SOURCE_TAG = $${KEYCLOAK_TAG}

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker

build:
	$(MAKE) tag
