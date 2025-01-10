# Keycloak Sub-charts
[Common](common/GMS_SUBCHART_README.md) is a symbolically
linked sub-chart. See the readme file for more details.

All configuration for this sub-chart should occur in the main `values.yaml` file in Keycloak.
No customizations should be made here unless absolutely necessary. The goal is that these charts can
be upgraded directly from the internet with no modifications.

However, there are some cases where modifications are necessary. These changes should be detailed below
so they can be reproduced when upgrading the chart:
* keycloakx - https://github.com/codecentric/helm-charts/tree/master/charts/keycloakx
  * Delete README.md to prevent dirty word scanner trigger
  * Delete `ci` and `examples` directories to prevent fortify findings
  * `templates/rbac.yaml` - add conditional to only install rbac if kubernetes <1.25. This enables the psp
    settings to be in the values file for older versions.
* bitnami postgresql11
  * Delete README.md to prevent dirty word scanner trigger
  * Delete `ci` directory to prevent fortify findings
  * Comment unused replication username and password lines 203,204 from `values.yaml`