{{/*
Render the app overall Kubernetes Deployment object
Example:
  {{- include "gms.common.deployment" $appContext }}
*/}}
{{- define "gms.common.deployment" }}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .appName }}
  labels:
    {{- include "gms.common.labels.standard" . | trim | nindent 4 }}
    {{- include "gms.common.labels.restartAfterReconfig" . | trim | nindent 4 }}
spec:
  replicas: {{ ternary .appValues.replicas 1 (hasKey .appValues "replicas" ) }}
  strategy:
    type: {{ include "gms.common.deployment.strategy" . }}
  selector:
    matchLabels:
      {{- include "gms.common.labels.matchLabels" . | trim | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "gms.common.labels.standard" . | trim | nindent 8 }}
        {{- include "gms.common.labels.podLabels" . | trim | nindent 8 }}
  {{- if .appValues.podAnnotations }}
      annotations:
        {{- tpl (toYaml .appValues.podAnnotations) $ | trim | nindent 8 }}
  {{- end }}
    spec:
      affinity:
        {{- include "gms.common.pod.affinity" . | trim | nindent 8 }}
      securityContext:
        {{- include "gms.common.pod.securityContext" . | trim | nindent 8 }}
      serviceAccount: {{ .appValues.serviceAccount | default "gms" }}
      volumes:
        {{- include "gms.common.storage.volumes" . | trim | nindent 8 }}
      containers:
        - name: {{ .appName }}
          image: {{ include "gms.common.container.image" . }}
          imagePullPolicy: {{ .Values.global.imagePullPolicy }}
          env:
            {{- include "gms.common.container.env" . | trim | nindent 12 }}
          ports:
            {{- include "gms.common.network.ports" . | trim | nindent 12 }}
  {{- if .appValues.startupProbe }}
          startupProbe: {{- tpl (toYaml .appValues.startupProbe) $ | trim | nindent 12 }}
  {{- end }}
  {{- if .appValues.readinessProbe }}
          readinessProbe: {{- tpl (toYaml .appValues.readinessProbe) $ | trim | nindent 12 }}
  {{- end }}
  {{- if .appValues.livenessProbe }}
          livenessProbe: {{- tpl (toYaml .appValues.livenessProbe) $ | trim | nindent 12 }}
  {{- end }}
  {{- if .appValues.resources }}
          resources: {{- toYaml .appValues.resources | trim | nindent 12 }}
  {{- end }}
          securityContext:
            {{- include "gms.common.container.securityContext" . | trim | nindent 12 }}
          volumeMounts:
            {{- include "gms.common.storage.volumeMounts" . | trim | nindent 12 }}
  {{- if .appValues.command }}
          command:
            {{- tpl (toYaml .appValues.command) $ | trim | nindent 12 }}
  {{- end }}
  {{- if .appValues.args }}
          args:
            {{- tpl (toYaml .appValues.args) $ | trim | nindent 12 }}
  {{- end }}
  {{- if .appValues.extraContainers }}
    {{- tpl .appValues.extraContainers $ | trim | nindent 8 }}
  {{- end }}
{{- end }}


{{/*
Render the app's Deployment strategy type.
Usage:
    strategy:
      type: {{ include "gms.common.deployment.strategy" $appContext }}
*/}}
{{- define "gms.common.deployment.strategy" }}
{{- .appValues.deploymentStrategy | default "RollingUpdate" }}
{{- end }}
