# User Interface

Front end for the GMS User Interface.

This project consists of multiple sub-projects connected using [lerna](https://github.com/lerna/lerna).
Sub-Projects:

- ui-app -> main user interface components, organized using golden layout
- ui-electron -> runs ui-app in an electron stand-alone window
- ui-core-components -> library of reusable ui components
- weavess -> library used in analysis to visualize waveform data

## Installation

Install [Nodejs v18](https://nodejs.org/en/download/), then run

```bash
yarn
yarn build
```

## Getting Started

### Interactive Analysis UI

To run the IAN UI using mock data, run the following commands from separate terminals:

```bash
yarn mock boot
yarn run dev-no-auth
```

### Running with keycloak enabled locally

Io run the UI with keycloak enabled locally, set these environment variable in your bash_profile or bash_rc

```bash
GMS_KEYCLOAK_REALM="gms"
GMS_KEYCLOAK_URL="KEYCLOAK_URL_HERE"
GMS_KEYCLOAK_CLIENT_ID="gms-development"
GMS_DISABLE_KEYCLOAK_AUTH: false
```

If you would like to disable keycloak for local runs, simply set `GMS_DISABLE_KEYCLOAK_AUTH: true`

## Build Scripts

- `clean`: runs a lerna clean the yarn cache and coverage / log output
- `build:dev`: runs a lerna development build for all sub packages
- `build:prod`: runs a lerna production build for all sub packages
- `build`: runs a lerna production build for all sub packages
- `dev`: starts the webpack dev server in development mode `localhost:8000/` for analyst-core-ui
- `start`: starts the webpack dev server in production mode `localhost:8000/` for analyst-core-ui
- `start`: starts the webpack dev server in production mode `localhost:8000/` for analyst-core-ui
- `start-no-auth`: disables keycloak and starts the webpack dev server in production mode `localhost:8000/` for analyst-core-ui
- `dev-no-auth`: disables keycloak and starts the webpack dev server in dev mode `localhost:8000/` for analyst-core-ui
- `docs`: generates the package source documentation for all sub packages
- `docs-user-interface`: generates the package source documentation for user interface
- `"docs-ui-app`: generates the package source documentation for ui-app
- `"docs-ui-electron`: generates the package source documentation for ui-electron
- `docs-ui-core-components`: generates the package source documentation for ui-core-components
- `docs-weavess`: generates the package source documentation for weavess
- `sonar`: runs sonar lint checks across all sub packages
- `test`: runs lerna test to run the package jest tests for all sub packages
- `test-jest`: runs the package jest tests
- `version`: returns the version of the package

### Using Real Data for a Service

Currently, each endpoint can be configured to point to either a local service or a remote service. By default, most services are
pointing to either `localhost:3000` or `localhost:3001`. In order to change where that service is run, you can run the development
server with some environment variables that tell the [webpack dev server](packages/ui-app/webpack.config.ts) where to point those endpoints.
For example, if you want to point the dev server to a running Station Definition Service, you could start the dev server with: `STATION_DEFINITION_SERVICE_URL="https://station-definition-service.com" yarn dev`. Now requests will be made to the endpoint located at `https://station-definition-service.com`.

#### Using Real Data for All Services

As a helpful shortcut, you can set all endpoints to point at a single deployment by setting the `DEPLOYMENT_URL` variable like so:

```sh
DEPLOYMENT_URL=https://example.com yarn dev
```

Note that you do not need to add the `interactive-analysis-ui` route.

For a full list of environment variables that can be set, please see the
[webpack file](packages/ui-app/webpack.config.ts) and also refer to the section [Route Configuration Section](#route-configuration)

### <a name="route-configuration">Route Configuration </a>

This app leverages proxying to make requests to services. This enables the UI to make requests to an endpoint on its own server (e.g., `http://localhost:8000/myProxiedService`), offloading the endpoint configuration to the web server itself&mdash;the UI doesn't have to configure endpoint locations. This obviates the need for specialized CORS configurations, and it allows the use of environment variables in the production deployment at run time instead of at build time.

In development mode, [webpack is used](packages/ui-app/webpack.config.ts) to proxy requests, and in the production build, [nginx is used](packages/ui-app/nginx/nginx-ian.template) to proxy requests.

### Redux DevTools Configuration

The redux store for the IAN UI is very large, and using the dev tools can cause the page to crash.
To fix this, you can sanitize the redux state that the devtools keeps track of.

**Note**: This has no effect on the data in the actual store.

Controlling which pieces of the store are shown is done by environment variable at run time. For example, the following would run the app with the `data` slice shown in the devtools for the redux state.

```sh
GMS_DEV_TOOLS_ENABLE_DATA=true yarn dev
```

#### Query Variables

These control whether RTK Query API slices are shown. By default, they are hidden.

The special variable `GMS_DEV_TOOLS_ENABLE_QUERIES` shows all RTK query slice, and the data slice, which also contains the results of queries.

To show all RTK Query slices, set:

```sh
GMS_DEV_TOOLS_ENABLE_QUERIES=true
```

The variables here are shown with their defaults.

```sh
GMS_DEV_TOOLS_ENABLE_SYSTEM_EVENT_GATEWAY_API=false
GMS_DEV_TOOLS_ENABLE_EVENT_MANAGER_API=false
GMS_DEV_TOOLS_ENABLE_PROCESSING_CONFIGURATION_API=false
GMS_DEV_TOOLS_ENABLE_PROCESSING_STATION_API=false
GMS_DEV_TOOLS_ENABLE_SIGNAL_ENHANCEMENT_CONFIGURATION_API=false
GMS_DEV_TOOLS_ENABLE_SSAM_CONTROL_API=false
GMS_DEV_TOOLS_ENABLE_STATION_DEFINITION_API=true
GMS_DEV_TOOLS_ENABLE_SYSTEM_MESSAGE_DEFINITION_API=false
GMS_DEV_TOOLS_ENABLE_USER_MANAGER_API=false
GMS_DEV_TOOLS_ENABLE_WORKFLOW_API=false
```

#### App Slices

App slices, such as `analystSlice` are shown by default. To turn them off, you can set

```sh
GMS_DEV_TOOLS_ENABLE_APP=false
```

#### History Slice

The `history` slice is hidden by default. To show it, set

```sh
GMS_DEV_TOOLS_ENABLE_HISTORY=true
```

#### Data Slice

The `data` slice is hidden by default. To show it, set

```sh
GMS_DEV_TOOLS_ENABLE_DATA=true
```

Individual pieces of the `data` slice may be controlled separately.
By default they are all shown if the `data` slice is shown. To turn them off, set them to `false`.

Here they are shown with their default values:

```sh
GMS_DEV_TOOLS_ENABLE_DATA_ASSOCIATION_CONFLICT=true
GMS_DEV_TOOLS_ENABLE_DATA_BEAMFORMING_TEMPLATES=true
GMS_DEV_TOOLS_ENABLE_DATA_ROTATION_TEMPLATES=true
GMS_DEV_TOOLS_ENABLE_DATA_CHANNELS=true
GMS_DEV_TOOLS_ENABLE_DATA_DEFAULT_FILTER_DEFINITION_BY_USAGE_FOR_CHANNEL_SEGMENTS=true
GMS_DEV_TOOLS_ENABLE_DATA_DEFAULT_FILTER_DEFINITION_BY_USAGE_FOR_CHANNEL_SEGMENTS_EVENT_OPEN=true
GMS_DEV_TOOLS_ENABLE_DATA_EVENTS=true
GMS_DEV_TOOLS_ENABLE_DATA_FILTER_DEFINITIONS=true
GMS_DEV_TOOLS_ENABLE_DATA_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTION_HYPOTHESES=true
GMS_DEV_TOOLS_ENABLE_DATA_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTION_HYPOTHESES_EVENT_OPEN=true
GMS_DEV_TOOLS_ENABLE_DATA_FILTER_DEFINITIONS_FOR_SIGNAL_DETECTIONS=true
GMS_DEV_TOOLS_ENABLE_DATA_FK_CHANNEL_SEGMENTS=true
GMS_DEV_TOOLS_ENABLE_DATA_FK_FREQUENCY_THUMBNAILS=true
GMS_DEV_TOOLS_ENABLE_DATA_MISSING_SIGNAL_DETECTIONS_HYPOTHESES_FOR_FILTER_DEFINITIONS=true
GMS_DEV_TOOLS_ENABLE_DATA_PROCESSING_MASK_DEFINITIONS=true
GMS_DEV_TOOLS_ENABLE_DATA_QC_SEGMENTS=true
GMS_DEV_TOOLS_ENABLE_DATA_QUERIES=true
GMS_DEV_TOOLS_ENABLE_DATA_SIGNAL_DETECTIONS=true
GMS_DEV_TOOLS_ENABLE_DATA_UI_CHANNEL_SEGMENTS=true
```

#### Redux Action Sanitization and Deny List

By default, all redux actions of RTK Query calls affecting sanitized state are also sanitized.
This limits the growth of the memory the dev tools has to track.

To see the payload and metadata for sanitized actions, turn on the environment variable for that portion of the redux state (shown above).

If you do not wish to see any query actions for redux state, set

```sh
GMS_DEV_TOOLS_ENABLE_QUERY_ACTION_TRACKING=false
```

## Deployment

This directory contains a `Dockerfile` and can be built as such, e.g. `docker build -t gms/analyst-ui .`

## Development

After installing dependencies, see the README in any sub-project under [./packages](packages) for instructions on developing in that particular project

## Tests

Unit tests and [integration tests](packages/integration-tests/README.md) are written in TypeScript, using [Jest](https://jestjs.io/).

To run the tests:

```bash
yarn test
```

To update test snapshots:

```bash
yarn test -u
```

To run tests on a specific set of files or directories, you can pass one or more strings as arguments to the test. Jest will attempt to match the string(s)
provided to file names or paths, and will run those tests. For example:

```bash
yarn test waveform # will run all tests that have the string `waveform` in their path or file name.
```

The test command run by the pipeline, which runs all tests is:

```bash
yarn test-all:prod
```

## Packages

[ui-app](./packages/ui-app)

[ui-electron](./packages/ui-electron)

[ui-core-components](./packages/ui-core-components)

[weavess](./packages/weavess)
