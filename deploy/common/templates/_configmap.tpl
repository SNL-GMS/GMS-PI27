{{/*
Render the standard GMS ConfigMap that is required by gmskube. This is not
the best implementation, it should have used data instead of labels. However,
to maintain backwards compatiblity it's best to just leave it as-is.
Usage:
{{- include "gms.common.configMap.standard" $ }}
*/}}
{{- define "gms.common.configMap.standard" }}
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: "gms"
  labels:
    {{- include "gms.common.labels.standard" . | trim | nindent 4 }}
    gms/type: {{ .Chart.Name | quote }}
    gms/user: {{ .Values.global.user | default "UNKNOWN" | quote }}
    gms/name: {{ .Release.Name | quote }}
    gms/namespace: {{ .Release.Namespace | quote }}
    gms/image-tag: {{ .Values.global.imageTag | quote }}
    gms/update-time: {{ dateInZone "2006-01-02T150405Z" (now) "UTC" | quote }}
{{- end }}


{{/*
Render configmap for app. The configmap are defined with the app, but
they are available to the entire namespace.

Usage:
  {{- include "gms.common.configMap" .appContext }}
*/}}
{{- define "gms.common.configMap" }}
  {{- range $name, $configDef := .appValues.configMap }}
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: "{{ $name }}"
  labels:
    {{- include "gms.common.labels.standard" $ | trim | nindent 4 }}
data:
    {{- range $key, $value := $configDef.data }}
  {{ $key }}: {{- tpl $value $ | toYaml | indent 2 }}
    {{- end }}
  {{- end }}
{{- end }}


{{/*
Copy multiple configMaps from another namespace as defined in the .Values.copyConfigMaps.
The source and destination names default to the key name. Source name can be overridden
by specifying sourceName. Destination name can be overidden by specifying destName.
The source namespace must always be specified.

Usage:
  {{- include "gms.common.configMaps.copy" $ }
*/}}
{{- define "gms.common.configMaps.copy" }}
  {{- if .Values.copyConfigMaps }}
    {{- range $key, $configDef := .Values.copyConfigMaps }}
      {{- if not $configDef }}
        {{- printf "ERROR: copyConfigMaps.%s cannot be empty" $key | fail }}
      {{- end }}
      {{- if not $configDef.namespace }}
        {{- printf "ERROR: copyConfigMaps.%s.namespace cannot be empty" $key | fail }}
      {{- end }}
      {{- include "gms.common.configMap.copy" (dict "context" $ "namespace" $configDef.namespace "source_name" ($configDef.sourceName | default $key) "dest_name" ($configDef.destName | default $key) "optional" ($configDef.optional | default false)) }}
    {{- end }}
  {{- end }}
{{- end }}


{{/*
Copy a configmap from another namespace.
namespace: source namespace
source_name: source configmap name
dest_name: destination configmap name, optional. Will use source_name if not defined.
optional: If false, error if configmap does not exist. If true, then just continue without creating configmap. Default false.

Usage:
  {{- include "gms.common.configMap.copy" (dict "context" $ "namespace" "gms" "source_name" "ingress-cert" "dest_name" "my-cert") }}
*/}}
{{- define "gms.common.configMap.copy" }}
  {{/* Check if running dryrun or template by getting the namespace, it will return empty in that case */}}
  {{- if (lookup "v1" "Namespace" "" .context.Release.Namespace) }}
    {{- $existing_configMap := (lookup "v1" "ConfigMap" .namespace .source_name) }}
    {{- if not $existing_configMap }}
      {{- if not (.optional | default false) }}
        {{- printf "ERROR: ConfigMap %s does not exist in %s namespace" .source_name .namespace | fail }}
      {{- end }}
    {{- else }}
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .dest_name | default .source_name | quote }}
  labels:
    {{- include "gms.common.labels.standard" .context | trim | nindent 4 }}
data:
      {{- range $key, $value := $existing_configMap.data }}
  {{ $key }}: {{ $value | quote }}
      {{- end }}
    {{- end }}
  {{- end }}
{{- end }}


{{/*
Get a value from a configmap in the namespace specified
namespace: namespace where the configmap exists
name: name of the configmap
key: key name to get the value

Note: You cannot get a value from a configmap that is created using one of the copy
templates above, because the configmap won't exist until the manifests are applied.
So the value can only be retreived from a configmap that exists before running
install/upgrade.

{{- include "gms.common.configMap.getValue" (dict "context" $ "namespace" "gms" "name" "kube-root-ca" "key" "ca.crt") }}
*/}}
{{- define "gms.common.configMap.getValue" }}
  {{/* Check if running dryrun or template by getting the namespace, it will return empty in that case */}}
  {{- if (lookup "v1" "Namespace" "" .namespace) }}
    {{- $configMap := (lookup "v1" "ConfigMap" .namespace .name) }}
    {{- if not $configMap }}
      {{- printf "ERROR: ConfigMap %s does not exist in %s namespace" .name .namespace | fail }}
    {{- end }}
    {{- get $configMap.data .key }}
  {{- else }}
    {{/* In the case of dryrun or template, just output a static string */}}
    {{- printf "dryrun" }}
  {{- end }}
{{- end }}