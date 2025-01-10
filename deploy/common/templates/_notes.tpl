{{/*
Print standard info for all types in NOTES.txt
*/}}
{{- define "gms.common.notes.standard" }}
Type:               {{ .Chart.Name }}
Instance name:      {{ .Release.Name }}
Base domain:        {{ .Values.global.baseDomain }}
Ingress port:       {{ .Values.global.basePort }}
User:               {{ .Values.global.user }}
Image registry:     {{ .Values.global.imageRegistry }}
Image tag:          {{ .Values.global.imageTag }}
Istio:              {{ .Values.global.istio }}
Kubernetes version: {{ .Capabilities.KubeVersion.Version }}
Helm version:       {{ .Capabilities.HelmVersion.Version }}
{{- end }}