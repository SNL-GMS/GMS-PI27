{{/*
Render the PodDisruptionBudget object for the app, if enabled
Usage:
  {{- include "gms.common.podDisruptionBudget" $appContext }}
*/}}
{{- define "gms.common.podDisruptionBudget" }}
  {{- if .appValues.podDisruptionBudget }}
    {{- if or (hasKey .appValues.podDisruptionBudget "minAvailable") (hasKey .appValues.podDisruptionBudget "maxUnavailable") }}
---
apiVersion: {{ include "gms.common.capabilities.policy.apiVersion" $ }}
kind: PodDisruptionBudget
metadata:
  name: {{ .appName }}
  labels:
    {{- include "gms.common.labels.standard" . | trim | nindent 4 }}
spec:
      {{- if (hasKey .appValues.podDisruptionBudget "minAvailable") }}
  minAvailable: {{ .appValues.podDisruptionBudget.minAvailable }}
      {{- end  }}
      {{- if (hasKey .appValues.podDisruptionBudget "maxUnavailable") }}
  maxUnavailable: {{ .appValues.podDisruptionBudget.maxUnavailable }}
      {{- end  }}
  selector:
    matchLabels:
      {{- include "gms.common.labels.matchLabels" . | trim | nindent 6 }}
    {{- end }}
  {{- end }}
{{- end }}