import { eventHypothesis, pdar } from '@gms/common-model/__tests__/__data__';

import type { FindEventBeamsByEventHypothesisAndStationsQueryArgs } from '../../../../../src/ts/app';
import {
  addEventBeamsByEventHypothesisAndStationsMatchReducers,
  findEventBeamsByEventHypothesisAndStations,
  findEventBeamsByEventHypothesisAndStationsQuery
} from '../../../../../src/ts/app';

const queryArgs: FindEventBeamsByEventHypothesisAndStationsQueryArgs = {
  stations: [pdar],
  eventHypotheses: [eventHypothesis]
};

describe('find event beams by event hypothesis and stations', () => {
  it('has been defined', () => {
    expect(findEventBeamsByEventHypothesisAndStations).toBeDefined();
    expect(addEventBeamsByEventHypothesisAndStationsMatchReducers).toBeDefined();
  });

  it('should build a builder using addEventBeamsByEventHypothesisAndStationsMatchReducers', () => {
    const builderMap: any[] = [];
    const builder: any = {
      addCase: (k, v) => {
        builderMap.push(v);
        return builder;
      },
      addMatcher: (k, v) => {
        builderMap.push(v);
        return builder;
      }
    };

    addEventBeamsByEventHypothesisAndStationsMatchReducers(builder);
    expect(builderMap).toMatchSnapshot();
    const state = {
      queries: { findEventBeamsByEventHypothesisAndStations: {} }
    };
    const action = {
      meta: {
        requestId: findEventBeamsByEventHypothesisAndStationsQuery.idGenerator(queryArgs),
        arg: queryArgs
      },
      payload: []
    };
    builderMap[0](state, action);
    expect(
      state.queries.findEventBeamsByEventHypothesisAndStations[
        findEventBeamsByEventHypothesisAndStationsQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('pending');
    builderMap[1](state, action);
    expect(
      state.queries.findEventBeamsByEventHypothesisAndStations[
        findEventBeamsByEventHypothesisAndStationsQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('fulfilled');
    builderMap[2](state, action);
    expect(state).toMatchSnapshot();
    expect(
      state.queries.findEventBeamsByEventHypothesisAndStations[
        findEventBeamsByEventHypothesisAndStationsQuery.idGenerator(queryArgs)
      ][action.meta.requestId].status
    ).toMatch('rejected');
  });

  it('can generate lookup keys from args', () => {
    expect(
      findEventBeamsByEventHypothesisAndStationsQuery.idGenerator(queryArgs)
    ).toMatchInlineSnapshot(`"eventHypothesisIds:hypothesisID/stations:PDAR"`);
  });

  describe('should skip if there is a problem with the args', () => {
    it('having no stations', () => {
      const brokenQueryArgs = { ...queryArgs, stations: [] };
      expect(findEventBeamsByEventHypothesisAndStationsQuery.shouldSkip(brokenQueryArgs)).toBe(
        true
      );
    });
    it('having no eventHypotheses', () => {
      const brokenQueryArgs = { ...queryArgs, eventHypotheses: [] };
      expect(findEventBeamsByEventHypothesisAndStationsQuery.shouldSkip(brokenQueryArgs)).toBe(
        true
      );
    });
    it('where stations is empty', () => {
      const brokenQueryArgs = { ...queryArgs, stations: [] };
      expect(findEventBeamsByEventHypothesisAndStationsQuery.shouldSkip(brokenQueryArgs)).toBe(
        true
      );
    });
    it('where eventHypotheses is empty', () => {
      const brokenQueryArgs = { ...queryArgs, eventHypotheses: [] };
      expect(findEventBeamsByEventHypothesisAndStationsQuery.shouldSkip(brokenQueryArgs)).toBe(
        true
      );
    });
  });

  it('correctly prevents duplicate queries', () => {
    expect(
      findEventBeamsByEventHypothesisAndStationsQuery.transformArgs
        ? findEventBeamsByEventHypothesisAndStationsQuery.transformArgs(queryArgs, {}, '', [])
        : undefined
    ).toMatchInlineSnapshot(`
      {
        "eventHypotheses": [
          {
            "associatedSignalDetectionHypotheses": [
              {
                "id": {
                  "id": "20cc9505-efe3-3068-b7d5-59196f37992c",
                  "signalDetectionId": "012de1b9-8ae3-3fd4-800d-58665c3152cc",
                },
              },
            ],
            "deleted": false,
            "id": {
              "eventId": "eventID",
              "hypothesisId": "hypothesisID",
            },
            "locationSolutions": [
              {
                "featurePredictions": {
                  "featurePredictions": [],
                },
                "id": "locationSolutionID",
                "location": {
                  "depthKm": 3.3,
                  "latitudeDegrees": 1.1,
                  "longitudeDegrees": 2.2,
                  "time": 3600,
                },
                "locationBehaviors": [],
                "locationRestraint": {
                  "depthRestraintKm": undefined,
                  "depthRestraintReason": undefined,
                  "depthRestraintType": "UNRESTRAINED",
                  "latitudeRestraintDegrees": undefined,
                  "longitudeRestraintDegrees": undefined,
                  "positionRestraintType": "UNRESTRAINED",
                  "timeRestraint": undefined,
                  "timeRestraintType": "UNRESTRAINED",
                },
                "networkMagnitudeSolutions": [
                  {
                    "magnitude": {
                      "standardDeviation": 0,
                      "units": "MAGNITUDE",
                      "value": 1.2,
                    },
                    "magnitudeBehaviors": [],
                    "type": "MB",
                  },
                ],
              },
            ],
            "parentEventHypotheses": [],
            "preferredLocationSolution": {
              "featurePredictions": {
                "featurePredictions": [],
              },
              "id": "locationSolutionID",
              "location": {
                "depthKm": 3.3,
                "latitudeDegrees": 1.1,
                "longitudeDegrees": 2.2,
                "time": 3600,
              },
              "locationBehaviors": [],
              "locationRestraint": {
                "depthRestraintKm": undefined,
                "depthRestraintReason": undefined,
                "depthRestraintType": "UNRESTRAINED",
                "latitudeRestraintDegrees": undefined,
                "longitudeRestraintDegrees": undefined,
                "positionRestraintType": "UNRESTRAINED",
                "timeRestraint": undefined,
                "timeRestraintType": "UNRESTRAINED",
              },
              "networkMagnitudeSolutions": [
                {
                  "magnitude": {
                    "standardDeviation": 0,
                    "units": "MAGNITUDE",
                    "value": 1.2,
                  },
                  "magnitudeBehaviors": [],
                  "type": "MB",
                },
              ],
            },
            "rejected": false,
          },
        ],
        "stations": [
          {
            "allRawChannels": [
              {
                "canonicalName": "PDAR.PD01.SHZ",
                "channelBandType": "SHORT_PERIOD",
                "channelDataType": "SEISMIC",
                "channelInstrumentType": "HIGH_GAIN_SEISMOMETER",
                "channelOrientationCode": "Z",
                "channelOrientationType": "VERTICAL",
                "configuredInputs": [],
                "description": "Raw Channel created from ReferenceChannel 2fabc2d3-858b-3e85-9f47-e2ee72060f0b with version d767395c-850e-36f8-a6f2-a1c7398440e4",
                "effectiveAt": 1636503404,
                "effectiveForRequestTime": 1636503405,
                "effectiveUntil": 1660701599.984,
                "location": {
                  "depthKm": 0.0381,
                  "elevationKm": 2.192,
                  "latitudeDegrees": 42.7765,
                  "longitudeDegrees": -109.58314,
                },
                "name": "PDAR.PD01.SHZ",
                "nominalSampleRateHz": 20,
                "orientationAngles": {
                  "horizontalAngleDeg": -1,
                  "verticalAngleDeg": 0,
                },
                "processingDefinition": {},
                "processingMetadata": {
                  "CHANNEL_GROUP": "PD01",
                },
                "station": {
                  "name": "PDAR",
                },
                "units": "NANOMETERS_PER_COUNT",
              },
              {
                "canonicalName": "PDAR.PD02.SHZ",
                "channelBandType": "SHORT_PERIOD",
                "channelDataType": "SEISMIC",
                "channelInstrumentType": "HIGH_GAIN_SEISMOMETER",
                "channelOrientationCode": "Z",
                "channelOrientationType": "VERTICAL",
                "configuredInputs": [],
                "description": "Raw Channel created from ReferenceChannel 04abdfb2-0fac-37cd-8b9e-18a997362ea6 with version d621a702-3f21-34ba-8bae-fd242438152b",
                "effectiveAt": 1636503404,
                "effectiveForRequestTime": 1636503405,
                "effectiveUntil": 1660701599.984,
                "location": {
                  "depthKm": 0.0381,
                  "elevationKm": 2.207,
                  "latitudeDegrees": 42.77818,
                  "longitudeDegrees": -109.5663,
                },
                "name": "PDAR.PD02.SHZ",
                "nominalSampleRateHz": 20,
                "orientationAngles": {
                  "horizontalAngleDeg": -1,
                  "verticalAngleDeg": 0,
                },
                "processingDefinition": {},
                "processingMetadata": {
                  "CHANNEL_GROUP": "PD02",
                },
                "station": {
                  "name": "PDAR",
                },
                "units": "NANOMETERS_PER_COUNT",
              },
              {
                "canonicalName": "PDAR.PD03.SHZ",
                "channelBandType": "SHORT_PERIOD",
                "channelDataType": "SEISMIC",
                "channelInstrumentType": "HIGH_GAIN_SEISMOMETER",
                "channelOrientationCode": "Z",
                "channelOrientationType": "VERTICAL",
                "configuredInputs": [],
                "description": "Raw Channel created from ReferenceChannel a8c4a1f5-ff8c-330d-8e83-cb07b88da81f with version 11105cfd-4a56-38f6-82b4-0c56caec0057",
                "effectiveAt": 1636503404,
                "effectiveUntil": 1660701599.984,
                "location": {
                  "depthKm": 0.0381,
                  "elevationKm": 2.286,
                  "latitudeDegrees": 42.77582,
                  "longitudeDegrees": -109.5495,
                },
                "name": "PDAR.PD03.SHZ",
                "nominalSampleRateHz": 20,
                "orientationAngles": {
                  "horizontalAngleDeg": -1,
                  "verticalAngleDeg": 0,
                },
                "processingDefinition": {},
                "processingMetadata": {
                  "CHANNEL_GROUP": "PD03",
                },
                "station": {
                  "name": "PDAR",
                },
                "units": "NANOMETERS_PER_COUNT",
              },
            ],
            "channelGroups": [
              {
                "channels": [
                  {
                    "canonicalName": "PDAR.PD01.SHZ",
                    "channelBandType": "SHORT_PERIOD",
                    "channelDataType": "SEISMIC",
                    "channelInstrumentType": "HIGH_GAIN_SEISMOMETER",
                    "channelOrientationCode": "Z",
                    "channelOrientationType": "VERTICAL",
                    "configuredInputs": [],
                    "description": "Raw Channel created from ReferenceChannel 2fabc2d3-858b-3e85-9f47-e2ee72060f0b with version d767395c-850e-36f8-a6f2-a1c7398440e4",
                    "effectiveAt": 1636503404,
                    "effectiveForRequestTime": 1636503405,
                    "effectiveUntil": 1660701599.984,
                    "location": {
                      "depthKm": 0.0381,
                      "elevationKm": 2.192,
                      "latitudeDegrees": 42.7765,
                      "longitudeDegrees": -109.58314,
                    },
                    "name": "PDAR.PD01.SHZ",
                    "nominalSampleRateHz": 20,
                    "orientationAngles": {
                      "horizontalAngleDeg": -1,
                      "verticalAngleDeg": 0,
                    },
                    "processingDefinition": {},
                    "processingMetadata": {
                      "CHANNEL_GROUP": "PD01",
                    },
                    "station": {
                      "name": "PDAR",
                    },
                    "units": "NANOMETERS_PER_COUNT",
                  },
                ],
                "description": "Pinedale,_Wyoming:_USA_array_element",
                "effectiveAt": 1636503404,
                "effectiveUntil": 1660701599.984,
                "location": {
                  "depthKm": 0,
                  "elevationKm": 2.192,
                  "latitudeDegrees": 42.7765,
                  "longitudeDegrees": -109.58314,
                },
                "name": "PD01",
                "type": "SITE_GROUP",
              },
              {
                "channels": [
                  {
                    "canonicalName": "PDAR.PD02.SHZ",
                    "channelBandType": "SHORT_PERIOD",
                    "channelDataType": "SEISMIC",
                    "channelInstrumentType": "HIGH_GAIN_SEISMOMETER",
                    "channelOrientationCode": "Z",
                    "channelOrientationType": "VERTICAL",
                    "configuredInputs": [],
                    "description": "Raw Channel created from ReferenceChannel 04abdfb2-0fac-37cd-8b9e-18a997362ea6 with version d621a702-3f21-34ba-8bae-fd242438152b",
                    "effectiveAt": 1636503404,
                    "effectiveForRequestTime": 1636503405,
                    "effectiveUntil": 1660701599.984,
                    "location": {
                      "depthKm": 0.0381,
                      "elevationKm": 2.207,
                      "latitudeDegrees": 42.77818,
                      "longitudeDegrees": -109.5663,
                    },
                    "name": "PDAR.PD02.SHZ",
                    "nominalSampleRateHz": 20,
                    "orientationAngles": {
                      "horizontalAngleDeg": -1,
                      "verticalAngleDeg": 0,
                    },
                    "processingDefinition": {},
                    "processingMetadata": {
                      "CHANNEL_GROUP": "PD02",
                    },
                    "station": {
                      "name": "PDAR",
                    },
                    "units": "NANOMETERS_PER_COUNT",
                  },
                ],
                "description": "Pinedale,_Wyoming:_USA_array_element",
                "effectiveAt": 1636503404,
                "effectiveUntil": 1660701599.984,
                "location": {
                  "depthKm": 0,
                  "elevationKm": 2.207,
                  "latitudeDegrees": 42.77818,
                  "longitudeDegrees": -109.5663,
                },
                "name": "PD02",
                "type": "SITE_GROUP",
              },
              {
                "channels": [
                  {
                    "canonicalName": "PDAR.PD03.SHZ",
                    "channelBandType": "SHORT_PERIOD",
                    "channelDataType": "SEISMIC",
                    "channelInstrumentType": "HIGH_GAIN_SEISMOMETER",
                    "channelOrientationCode": "Z",
                    "channelOrientationType": "VERTICAL",
                    "configuredInputs": [],
                    "description": "Raw Channel created from ReferenceChannel a8c4a1f5-ff8c-330d-8e83-cb07b88da81f with version 11105cfd-4a56-38f6-82b4-0c56caec0057",
                    "effectiveAt": 1636503404,
                    "effectiveUntil": 1660701599.984,
                    "location": {
                      "depthKm": 0.0381,
                      "elevationKm": 2.286,
                      "latitudeDegrees": 42.77582,
                      "longitudeDegrees": -109.5495,
                    },
                    "name": "PDAR.PD03.SHZ",
                    "nominalSampleRateHz": 20,
                    "orientationAngles": {
                      "horizontalAngleDeg": -1,
                      "verticalAngleDeg": 0,
                    },
                    "processingDefinition": {},
                    "processingMetadata": {
                      "CHANNEL_GROUP": "PD03",
                    },
                    "station": {
                      "name": "PDAR",
                    },
                    "units": "NANOMETERS_PER_COUNT",
                  },
                ],
                "description": "Pinedale,_Wyoming:_USA_array_element",
                "effectiveAt": 1636503404,
                "effectiveUntil": 1660701599.984,
                "location": {
                  "depthKm": 0,
                  "elevationKm": 2.286,
                  "latitudeDegrees": 42.77582,
                  "longitudeDegrees": -109.5495,
                },
                "name": "PD03",
                "type": "SITE_GROUP",
              },
              {
                "channels": [
                  {
                    "canonicalName": "PDAR.PD31.BHE",
                    "channelBandType": "SHORT_PERIOD",
                    "channelDataType": "SEISMIC",
                    "channelInstrumentType": "HIGH_GAIN_SEISMOMETER",
                    "channelOrientationCode": "E",
                    "channelOrientationType": "VERTICAL",
                    "configuredInputs": [],
                    "description": "PDAR PD31 East Channel",
                    "effectiveAt": 1636503404,
                    "effectiveUntil": 1660701599.984,
                    "location": {
                      "depthKm": 0.046,
                      "elevationKm": 2.213,
                      "latitudeDegrees": 42.77582,
                      "longitudeDegrees": -109.5495,
                    },
                    "name": "PDAR.PD31.BHE",
                    "nominalSampleRateHz": 40,
                    "orientationAngles": {
                      "horizontalAngleDeg": -1,
                      "verticalAngleDeg": 0,
                    },
                    "processingDefinition": {},
                    "processingMetadata": {
                      "CHANNEL_GROUP": "PD31",
                    },
                    "station": {
                      "name": "PDAR",
                    },
                    "units": "NANOMETERS_PER_COUNT",
                  },
                  {
                    "canonicalName": "PDAR.PD31.BHN",
                    "channelBandType": "SHORT_PERIOD",
                    "channelDataType": "SEISMIC",
                    "channelInstrumentType": "HIGH_GAIN_SEISMOMETER",
                    "channelOrientationCode": "N",
                    "channelOrientationType": "VERTICAL",
                    "configuredInputs": [],
                    "description": "PDAR PD31 North Channel",
                    "effectiveAt": 1636503404,
                    "effectiveUntil": 1660701599.984,
                    "location": {
                      "depthKm": 0.046,
                      "elevationKm": 2.213,
                      "latitudeDegrees": 42.77582,
                      "longitudeDegrees": -109.5495,
                    },
                    "name": "PDAR.PD31.BHN",
                    "nominalSampleRateHz": 40,
                    "orientationAngles": {
                      "horizontalAngleDeg": -1,
                      "verticalAngleDeg": 0,
                    },
                    "processingDefinition": {},
                    "processingMetadata": {
                      "CHANNEL_GROUP": "PD31",
                    },
                    "station": {
                      "name": "PDAR",
                    },
                    "units": "NANOMETERS_PER_COUNT",
                  },
                ],
                "description": "Pinedale,_Wyoming:_USA_array_element",
                "effectiveAt": 1636503404,
                "effectiveUntil": 1660701599.984,
                "location": {
                  "depthKm": 0,
                  "elevationKm": 2.215,
                  "latitudeDegrees": 42.77582,
                  "longitudeDegrees": -109.5495,
                },
                "name": "PD31",
                "type": "SITE_GROUP",
              },
            ],
            "description": "Pinedale,_Wyoming:_USA_array_element",
            "effectiveAt": 1636503404,
            "effectiveUntil": 1660701599.984,
            "location": {
              "depthKm": 0,
              "elevationKm": 2.215,
              "latitudeDegrees": 42.76738,
              "longitudeDegrees": -109.5579,
            },
            "name": "PDAR",
            "relativePositionsByChannel": {
              "PDAR.PD01.SHZ": {
                "eastDisplacementKm": -2.066,
                "northDisplacementKm": 1.014,
                "verticalDisplacementKm": 0,
              },
              "PDAR.PD02.SHZ": {
                "eastDisplacementKm": -0.688,
                "northDisplacementKm": 1.201,
                "verticalDisplacementKm": 0,
              },
              "PDAR.PD03.SHZ": {
                "eastDisplacementKm": 0.688,
                "northDisplacementKm": 0.939,
                "verticalDisplacementKm": 0,
              },
              "PDAR.PD31.BHE": {
                "eastDisplacementKm": 0,
                "northDisplacementKm": 0,
                "verticalDisplacementKm": 0,
              },
              "PDAR.PD31.BHN": {
                "eastDisplacementKm": 0,
                "northDisplacementKm": 0,
                "verticalDisplacementKm": 0,
              },
            },
            "type": "SEISMIC_ARRAY",
          },
        ],
      }
    `);
  });
});
