# Logging Sub-charts
[Common](common/GMS_SUBCHART_README.md) is a symbolically
linked sub-chart. See the readme file for more details.

All configuration for this sub-chart should occur in the main `values.yaml` file in Logging.
No customizations should be made here unless absolutely necessary. The goal is that these charts can
be upgraded directly from the internet with no modifications.

However, there are some cases where modifications are necessary. These changes should be detailed below
so they can be reproduced when upgrading the chart:
* elasticsearch
  * values.yaml - remove any comments that talk about a TLS PK to prevent fortify finding
  * charts/kibana/values.yaml - remove any comments that talk about a TLS PK to prevent fortify finding
* fluentd
  * templates/_pod.tpl
    * line 18 - add tpl to init container render: {{- tpl (toYaml .) $ | nindent 2 }}
    * line 40 - add tpl to env var render: {{- tpl (toYaml .Values.env) $ | nindent 4 }}
