![GMS Logo](doc/images/gms-logo.png)

# GMS Common

This repository contains the common code for the **Geophysical Monitoring System (GMS)**.

Source code is organized by language:
* Java code has been incorporated in the [java](java) subdirectory.
* Python code has been incorporated in the [python](python) subdirectory.
* Typescript code has been incorporated in the [typescript](typescript) subdirectory.

## Installation Instructions

Instructions for building, installing, and verifying the system can be [**found here**](doc/).

## GMS Interactive Analysis (IAN)

The GMS Interactive Analysis (IAN) will create a bi-directional data
bridge between the legacy system and GMS to load data and processing results
and to provide the functionality needed to support the typical analyst
workflow.

### GMS IAN Persistent Services

| **Service Name** | **Description** |
|---|:---|
| config-loader                               | Service for orchestrating configuration loading |
| frameworks-configuration-service            | Serves processing configuration |
| interactive-analysis-ui                     | Serves the GMS user interface |
| mock-data-server                            | Support running GMS user interface without making requests to backend Java services  |
| signal-detection-manager-service            | Service that provides signal detection query, storage and distribution within GMS  |
| station-definition-service                  | Service that defines procession station definitions |
| mock-waveform-service                       | Service that generates mock waveform data for UI display and processing  |
| mock-workflow-service                       | Service to generate mock workflow data for UI display and processing  |
| ui-processing-configuration-service         | Serves processing configuration for the UI |
| user-manager-service                        | Manages user preferences for UI customization and collects user interactions  |
| waveform-manager-service                    | Service responsible for storage and retrieval of waveform data  |
| workflow-manager-service                    | service responsible for creation, storage and distribution of workflow and interval information  |

### GMS IAN Transient Services

| **Service Name** | **Description** |
|---|:---|
| bastion             | Contains command-line support tools for system maintenance |
| javadoc                 | Serves generated javadoc documentation |
| swagger-gms             | Servers OpenAPI interface definitions for service interfaces in GMS |

### GMS IAN Third-Party Services

| **Service Name** | **Description** |
|---|:---|
| etcd                         | Service for system configuration values |
| kafka                        | Distributed streaming queues used for interprocess communication |
| postgresql-gms               | The database used for storing OSD objects |



