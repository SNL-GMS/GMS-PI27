{{/*
This file contains the helper templates to handle volumes of various types for
the GMS apps.  Volumes are configured in the "volume" section of each app.  For
example, you might see something like this in a values.yaml file:

postgresql-gms:
  ...
  volume:
    data:
      mountPath: "/var/lib/postgresql/data"
      size: "200Gi"
      type: "persistentVolumeClaim"
    shm:
      medium: "Memory"
      mountPath: "/dev/shm"
      type: "emptyDir"

indicating that there is a 200 GB persistent volume claim volume attached at
/var/lib/postgresql/data and a empty "RAM disk" attached at /dev/shm.

Five different types of volumes are currently supported:

  - configMap
  - emptyDir
  - hostPath
  - persistentVolumeClaim
  - secret

All types support the following configuration values:

  mountPath: "/path/inside/pod"   # mandatory
  readOnly: true                   # optional - default: false
  subPath: "individual-file.txt"   # optional
  type: "persistentVolumeClaim"    # mandatory

Type 'configMap' volume definitions also support these additional configuration
values:

  configMapName: "configmap-name"  # mandatory
  defaultMode: 0755                # optional

Type 'emptyDir' volume definitions also support these additional configuration
values:

  medium: "Memory"                 # optional
  size: "1Gi"                      # optional

Type 'hostPath' volume definitions also support these additional configuration
values:

  hostPath: "/path/on/host"        # mandatory

Type 'persistentVolumeClaim' volume definitions also support these additional
configuration values:

  claimName: "uniqueString"        # optional - default: "{{ .appName }}"
  size: "1Gi"                      # mandatory
  storageClassName: "longhorn"     # optional - default: "{{ .Values.global.storageClassName }}"

Type 'secret' volume definitions also support these additional configuration
values:

  secretName: "oracle-wallet"      # mandatory
*/}}



{{/*
Render the PersistentVolumeClaim objects for an app based on the app's volume
definitions in the values.yaml file.
Usage:
{{- include "gms.common.storage.pvc" $appContext }}
*/}}
{{- define "gms.common.storage.pvc" }}
  {{- if .appValues.volume }}
    {{- range $key, $val := .appValues.volume }}
      {{- if not $val.type }}
        {{- printf "ERROR: %s.volume.%s must contain .type: %s" $.appName $key $val | fail }}
      {{- end }}
      {{- if eq $val.type "persistentVolumeClaim" }}
        {{- $claimName := $val.claimName | default "{{ .appName }}" }}
        {{- if not $val.size }}
          {{- printf "ERROR: %s.volume.%s must contain .size: %s" $.appName $key $val | fail }}
        {{- end }}
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ tpl $claimName $ | quote }}
  labels:
    {{- include "gms.common.labels.standard" $ | trim | nindent 4 }}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: {{ $val.size | quote }}
        {{- if $val.storageClassName }}
  storageClassName: {{ $val.storageClassName | quote }}
        {{- else if $.Values.global.storageClassName }}
  storageClassName: {{ $.Values.global.storageClassName | quote }}
        {{- end }}
      {{- end }}
    {{- end }}
  {{- end }}
{{- end }}



{{/*
Render the Pod volumes block for an app based on the app's volume definitions in
the values.yaml file.
Usage:
      volumes:
        {{- include "gms.common.storage.volumes" $appContext | trim | nindent 8 }}
*/}}
{{- define "gms.common.storage.volumes" }}
  {{- if .appValues.volume }}
    {{- range $key, $val := .appValues.volume }}
      {{- if not $val.type }}
        {{- printf "ERROR: %s.volume.%s must contain .type: %s" $.appName $key $val | fail }}
      {{- end }}
- name: {{ $key | quote }}
      {{- if eq $val.type "configMap" }}
        {{- if not $val.configMapName }}
          {{- printf "ERROR: %s.volume.%s is of type configMap, so it must contain .configMapName: %s" $.appName $key $val | fail }}
        {{- end }}
  configMap:
    name: {{ tpl $val.configMapName $ | quote }}
        {{- if $val.defaultMode }}
    defaultMode: {{ $val.defaultMode }}
        {{- end }}
      {{- else if eq $val.type "emptyDir" }}
  emptyDir:
        {{- if $val.medium }}
    medium: {{ $val.medium | quote }}
        {{- end }}
        {{- if $val.size }}
    sizeLimit: {{ $val.size | quote }}
        {{- end }}
      {{- else if eq $val.type "hostPath" }}
        {{- if not $val.hostPath }}
          {{- printf "ERROR: %s.volume.%s is of type hostPath, so it must contain .hostPath: %s" $.appName $key $val | fail }}
        {{- end }}
  hostPath:
        {{- if kindIs "map" $val.hostPath }}
          {{- if not $val.hostPath.type }}
            {{- printf "ERROR: %s.volume.%s hostPath is a map, so it must contain .type: %s" $.appName $key $val | fail }}
          {{- end }}
          {{- if eq $val.hostPath.type "fromConfigMap" }}
            {{- if or (not $val.hostPath.key) (not $val.hostPath.name) (not $val.hostPath.namespace) }}
              {{- printf "ERROR: %s.volume.%s hostPath is of type fromConfigMap, so it must contain .namespace, .name  and .key: %s" $.appName $key $val | fail }}
            {{- end }}
    path: {{ include "gms.common.configMap.getValue" (dict "context" $ "namespace" $val.hostPath.namespace "name" $val.hostPath.name "key" $val.hostPath.key) | trim | quote }}
          {{- end }}
        {{- else }}
    path: {{ tpl $val.hostPath $ | quote }}
        {{- end }}
      {{- else if eq $val.type "persistentVolumeClaim" }}
  persistentVolumeClaim:
        {{- $claimName := $val.claimName | default "{{ .appName }}" }}
    claimName: {{ tpl $claimName $ | quote }}
      {{- else if eq $val.type "secret" }}
        {{- if not $val.secretName }}
          {{- printf "ERROR: %s.volume.%s is of type secret, so it must contain .secretName: %s" $.appName $key $val | fail }}
        {{- end }}
  secret:
    secretName: {{ tpl $val.secretName $ | quote }}
      {{- else }}
        {{- printf "ERROR: %s.volume.%s is invalid: %s" $.appName $key $val | fail }}
      {{- end }}
    {{- end }}
  {{- end }}
{{- end }}



{{/*
Render the Container volumeNames block for an app based on the app's volume definitions
in the values.yaml file.
Usage:
          volumeMounts:
            {{- include "gms.common.storage.volumeMounts" $appContext | trim | nindent 12 }}
*/}}
{{- define "gms.common.storage.volumeMounts" }}
  {{- if .appValues.volume }}
    {{- range $key, $val := .appValues.volume }}
      {{- if not $val.mountPath }}
        {{- printf "ERROR: %s.volume.%s must contain .mountPath: %s" $.appName $key $val | fail }}
      {{- end }}
      {{- if kindIs "map" $val.mountPath }}
        {{- if not $val.mountPath.type }}
          {{- printf "ERROR: %s.volume.%s.mountPath is a map, so it must contain .type: %s" $.appName $key $val | fail }}
        {{- end }}
          {{- if eq $val.mountPath.type "fromConfigMap" }}
            {{- if or (not $val.mountPath.key) (not $val.mountPath.name) (not $val.mountPath.namespace) }}
              {{- printf "ERROR: %s.volume.%s mountPath is of type fromConfigMap, so it must contain .namespace, .name  and .key: %s" $.appName $key $val | fail }}
            {{- end }}
            {{- $augmentation := $.Values.augmentation | default dict }}
            {{- $oracle := $augmentation.oracle | default dict }}
            {{- if $oracle.enabled }}
              {{/* Check if the oracle augmentation is enabled and override the bridge mounts since they are hardcoded in the db */}}
              {{- if eq $val.mountPath.key "bridge-waveforms-mount" }}
- mountPath: "/data/bridge-waveforms"
              {{- else if eq $val.mountPath.key "bridge-responses-mount" }}
- mountPath: "/data/bridge-responses"
              {{- end }}
            {{- else }}
- mountPath: {{ include "gms.common.configMap.getValue" (dict "context" $ "namespace" $val.mountPath.namespace "name" $val.mountPath.name "key" $val.mountPath.key) | trim | quote }}
            {{- end }}
          {{- end }}
        {{- else }}
- mountPath: {{ tpl $val.mountPath $ | quote }}
        {{- end }}
  name: {{ $key | quote }}
      {{- if $val.readOnly }}
  readOnly: {{ $val.readOnly }}
      {{- end }}
      {{- if $val.subPath }}
  subPath: {{ $val.subPath | quote }}
      {{- end }}
    {{- end }}
  {{- end }}
{{- end }}
