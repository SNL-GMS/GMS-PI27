NAME = keycloak-postgresql
SOURCE_IMAGE = $${IRONBANK_REGISTRY}/ironbank/bitnami/postgres/postgresql11
SOURCE_TAG = $${KEYCLOAK_POSTGRESQL_TAG}

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker

build:
	$(MAKE) tag
