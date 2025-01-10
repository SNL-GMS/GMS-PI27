import { eventData, signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import type {
  ArrivalTimeFeatureMeasurement,
  ArrivalTimeMeasurementValue
} from '@gms/common-model/lib/signal-detection';
import { FeatureMeasurementType } from '@gms/common-model/lib/signal-detection';
import { findArrivalTimeFeatureMeasurement } from '@gms/common-model/lib/signal-detection/util';
import type { IntervalId } from '@gms/common-model/lib/workflow/types';

import type {
  addEventBeamsAndChannels,
  AppState,
  associateSignalDetectionsToEvent,
  createSignalDetection,
  createSignalDetectionAndAssociate,
  deleteSignalDetection,
  updateArrivalTimeSignalDetection,
  updatePhaseSignalDetection,
  waveformActions
} from '../../../src/ts/app';
import { getStore } from '../../../src/ts/app';
import type { createEventFromSignalDetections } from '../../../src/ts/app/api/data/event/create-event-from-sds';
import type { createVirtualEvent } from '../../../src/ts/app/api/data/event/create-virtual-event';
import type { deleteEvents } from '../../../src/ts/app/api/data/event/delete-events';
import type { duplicateEvents } from '../../../src/ts/app/api/data/event/duplicate-events';
import type { rejectEvents } from '../../../src/ts/app/api/data/event/reject-events';
import type { unassociateSignalDetectionsToEvent } from '../../../src/ts/app/api/data/event/unassociate-sds-to-event';
import type { acceptFk } from '../../../src/ts/app/api/data/signal-detection/accept-fk-reducer';
import { getHistoryLabelDescriptions } from '../../../src/ts/app/history/utils/get-history-label-description';
import { unfilteredSamplesUiChannelSegment } from '../../__data__';

const MOCK_TIME = 1606818240000;
Date.now = jest.fn(() => MOCK_TIME);
Date.constructor = jest.fn(() => new Date(MOCK_TIME));

describe('history label and descriptions', () => {
  it('exists', () => {
    expect(getHistoryLabelDescriptions).toBeDefined();
  });

  describe('handlers', () => {
    const stageId: IntervalId = {
      definitionId: {
        name: 'test',
        effectiveTime: 100
      },
      startTime: 100
    };

    const username = 'user';
    const preferredBy = username;

    const arrivalFM: ArrivalTimeFeatureMeasurement = findArrivalTimeFeatureMeasurement(
      signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements
    );

    const store = getStore();
    const original: AppState = {
      ...store.getState(),
      data: {
        ...store.getState().data,
        events: {
          A: {
            ...eventData,
            id: 'A',
            eventHypotheses: [
              { ...eventData.eventHypotheses[0], id: { eventId: 'A', hypothesisId: '101' } }
            ],
            preferredEventHypothesisByStage: [
              {
                stage: stageId.definitionId,
                preferred: { id: { eventId: 'A', hypothesisId: '101' } },
                preferredBy
              }
            ]
          },
          B: {
            ...eventData,
            id: 'B',
            eventHypotheses: [
              { ...eventData.eventHypotheses[0], id: { eventId: 'B', hypothesisId: '102' } }
            ],
            preferredEventHypothesisByStage: [
              {
                stage: stageId.definitionId,
                preferred: { id: { eventId: 'B', hypothesisId: '102' } },
                preferredBy
              }
            ]
          }
        },
        signalDetections: {
          A: {
            ...signalDetectionsData[0],
            id: 'A',
            signalDetectionHypotheses: [
              {
                ...signalDetectionsData[0].signalDetectionHypotheses[0],
                id: { id: '101', signalDetectionId: 'A' }
              }
            ]
          },
          B: {
            ...signalDetectionsData[0],
            id: 'B',
            signalDetectionHypotheses: [
              {
                ...signalDetectionsData[0].signalDetectionHypotheses[0],
                id: { id: '102', signalDetectionId: 'B' }
              }
            ]
          },
          C: {
            ...signalDetectionsData[0],
            id: 'B',
            signalDetectionHypotheses: [
              {
                ...signalDetectionsData[0].signalDetectionHypotheses[0],
                id: { id: '103', signalDetectionId: 'C' }
              }
            ]
          },
          D: {
            ...signalDetectionsData[0],
            id: 'B',
            signalDetectionHypotheses: [
              {
                ...signalDetectionsData[0].signalDetectionHypotheses[0],
                id: { id: '104', signalDetectionId: 'D' }
              }
            ]
          }
        }
      }
    };

    const state: AppState = {
      ...store.getState(),
      data: {
        ...store.getState().data,
        events: {
          A: {
            ...eventData,
            id: 'A',
            eventHypotheses: [
              { ...eventData.eventHypotheses[0], id: { eventId: 'A', hypothesisId: '111' } }
            ],
            preferredEventHypothesisByStage: [
              {
                stage: stageId.definitionId,
                preferred: { id: { eventId: 'A', hypothesisId: '111' } },
                preferredBy
              }
            ]
          },
          B: {
            ...eventData,
            id: 'B',
            eventHypotheses: [
              { ...eventData.eventHypotheses[0], id: { eventId: 'B', hypothesisId: '112' } }
            ],
            preferredEventHypothesisByStage: [
              {
                stage: stageId.definitionId,
                preferred: { id: { eventId: 'B', hypothesisId: '112' } },
                preferredBy
              }
            ]
          }
        },
        signalDetections: {
          A: {
            ...signalDetectionsData[1],
            id: 'A',
            signalDetectionHypotheses: [
              {
                ...signalDetectionsData[1].signalDetectionHypotheses[0],
                id: { id: '111', signalDetectionId: 'A' }
              }
            ]
          },
          B: {
            ...signalDetectionsData[1],
            id: 'B',
            signalDetectionHypotheses: [
              {
                ...signalDetectionsData[1].signalDetectionHypotheses[0],
                id: { id: '112', signalDetectionId: 'B' }
              }
            ]
          },
          C: {
            ...signalDetectionsData[0],
            id: 'B',
            signalDetectionHypotheses: [
              {
                ...signalDetectionsData[0].signalDetectionHypotheses[0],
                id: { id: '113', signalDetectionId: 'C' },
                featureMeasurements: [
                  ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements.filter(
                    fm => fm.featureMeasurementType !== FeatureMeasurementType.ARRIVAL_TIME
                  ),
                  {
                    ...arrivalFM,
                    measurementValue: {
                      ...arrivalFM.measurementValue,
                      arrivalTime: {
                        ...arrivalFM.measurementValue.arrivalTime,
                        standardDeviation: 1.223554
                      }
                    } as ArrivalTimeMeasurementValue
                  }
                ]
              }
            ]
          },
          D: {
            ...signalDetectionsData[0],
            id: 'B',
            signalDetectionHypotheses: [
              {
                ...signalDetectionsData[0].signalDetectionHypotheses[0],
                id: { id: '114', signalDetectionId: 'D' },
                featureMeasurements: [
                  ...signalDetectionsData[0].signalDetectionHypotheses[0].featureMeasurements.filter(
                    fm => fm.featureMeasurementType !== FeatureMeasurementType.ARRIVAL_TIME
                  ),
                  {
                    ...arrivalFM,
                    measurementValue: {
                      ...arrivalFM.measurementValue,
                      arrivalTime: {
                        ...arrivalFM.measurementValue.arrivalTime,
                        standardDeviation: 5.45
                      }
                    } as ArrivalTimeMeasurementValue
                  }
                ]
              }
            ]
          }
        }
      }
    };

    it('unknown action', () => {
      const action: ReturnType<typeof waveformActions.setMaskVisibility> = {
        payload: {
          analystDefined: true,
          dataAuthentication: true,
          longTerm: true,
          processingMask: true,
          qcSegments: true,
          rejected: true,
          stationSOH: true,
          unprocessed: true,
          waveform: true
        },
        type: 'waveform/setMaskVisibility'
      };

      const result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "waveform/setMaskVisibility",
            "waveform/setMaskVisibility",
          ],
          "signalDetections": {},
        }
      `);
    });

    it('associate signal detections to event', () => {
      const action: ReturnType<typeof associateSignalDetectionsToEvent> = {
        payload: {
          openIntervalName: 'test',
          stageId,
          username: 'user',
          eventId: 'A',
          signalDetectionIds: ['A']
        },
        type: 'data/associateSignalDetectionsToEvent'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Association",
            "ASAR-Pg associated to EV-1970-01-01 01:00:00.000",
          ],
          "signalDetections": {
            "A": [
              "Association",
              "ASAR-Pg associated to EV-1970-01-01 01:00:00.000",
            ],
          },
        }
      `);

      result = getHistoryLabelDescriptions(
        { ...action, payload: { ...action.payload, signalDetectionIds: ['A', 'B'] } },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Association",
            "Multiple",
          ],
          "signalDetections": {
            "A": [
              "Association",
              "ASAR-Pg associated to EV-1970-01-01 01:00:00.000",
            ],
            "B": [
              "Association",
              "ASAR-Pg associated to EV-1970-01-01 01:00:00.000",
            ],
          },
        }
      `);
    });

    it('unassociate signal detections to event', () => {
      const action: ReturnType<typeof unassociateSignalDetectionsToEvent> = {
        payload: {
          openIntervalName: 'test',
          stageId,
          username: 'user',
          eventId: 'A',
          signalDetectionIds: ['A'],
          rejectAssociations: true
        },
        type: 'data/unassociateSignalDetectionsToEvent'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Unassociation",
            "ASAR-Pg unassociated to EV-1970-01-01 01:00:00.000",
          ],
          "signalDetections": {
            "A": [
              "Unassociation",
              "ASAR-Pg unassociated to EV-1970-01-01 01:00:00.000",
            ],
          },
        }
      `);

      result = getHistoryLabelDescriptions(
        { ...action, payload: { ...action.payload, signalDetectionIds: ['A', 'B'] } },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Unassociation",
            "Multiple",
          ],
          "signalDetections": {
            "A": [
              "Unassociation",
              "ASAR-Pg unassociated to EV-1970-01-01 01:00:00.000",
            ],
            "B": [
              "Unassociation",
              "ASAR-Pg unassociated to EV-1970-01-01 01:00:00.000",
            ],
          },
        }
      `);
    });

    it('create virtual event', () => {
      const action: ReturnType<typeof createVirtualEvent> = {
        payload: {
          depthKm: 4,
          latitudeDegrees: 4,
          longitudeDegrees: 5,
          monitoringOrganization: 'test',
          newEventId: 'event id',
          eventDate: new Date(),
          username: 'user'
        },
        type: 'data/createVirtualEvent'
      };

      const result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "event id": [
              "Creation",
              "EV-1970-01-01 00:00:00.000 created",
            ],
          },
          "history": [
            "Creation",
            "EV-1970-01-01 00:00:00.000 created",
          ],
          "signalDetections": {},
        }
      `);
    });

    it('create event from signal detections', () => {
      const action: ReturnType<typeof createEventFromSignalDetections> = {
        payload: {
          signalDetectionIds: ['A', 'B'],
          monitoringOrganization: 'test',
          newEventId: 'event id',
          username: 'user',
          stations: []
        },
        type: 'data/createEventFromSignalDetections'
      };

      const result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "event id": [
              "Creation",
              "EV-1970-01-01 00:00:00.000 created",
            ],
          },
          "history": [
            "Creation",
            "EV-1970-01-01 00:00:00.000 created",
          ],
          "signalDetections": {},
        }
      `);
    });

    it('duplicate events', () => {
      const action: ReturnType<typeof duplicateEvents> = {
        payload: {
          newEventIds: ['newA'],
          openIntervalName: 'test',
          workflowDefinitionId: stageId.definitionId,
          username: 'user',
          eventIds: ['A']
        },
        type: 'data/duplicateEvents'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "newA": [
              "Creation",
              "EV-1970-01-01 00:00:00.000 created (duplicate)",
            ],
          },
          "history": [
            "Creation",
            "EV-1970-01-01 00:00:00.000 created (duplicate)",
          ],
          "signalDetections": {},
        }
      `);

      result = getHistoryLabelDescriptions(
        {
          ...action,
          payload: { ...action.payload, eventIds: ['A', 'B'], newEventIds: ['newA', 'newB'] }
        },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "newA": [
              "Creation",
              "EV-1970-01-01 00:00:00.000 created (duplicate)",
            ],
            "newB": [
              "Creation",
              "EV-1970-01-01 00:00:00.000 created (duplicate)",
            ],
          },
          "history": [
            "Creation",
            "Multiple",
          ],
          "signalDetections": {},
        }
      `);
    });

    it('reject events', () => {
      const action: ReturnType<typeof rejectEvents> = {
        payload: {
          stageId: { definitionId: { name: 'test', effectiveTime: 1 }, startTime: 1 },
          openIntervalName: 'test',
          username: 'user',
          eventIds: ['A']
        },
        type: 'data/rejectEvent'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "A": [
              "Rejection",
              "EV-1970-01-01 01:00:00.000 rejected",
            ],
          },
          "history": [
            "Rejection",
            "EV-1970-01-01 01:00:00.000 rejected",
          ],
          "signalDetections": {},
        }
      `);

      result = getHistoryLabelDescriptions(
        { ...action, payload: { ...action.payload, eventIds: ['A', 'B'] } },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "A": [
              "Rejection",
              "EV-1970-01-01 01:00:00.000 rejected",
            ],
            "B": [
              "Rejection",
              "EV-1970-01-01 01:00:00.000 rejected",
            ],
          },
          "history": [
            "Rejection",
            "Multiple",
          ],
          "signalDetections": {},
        }
      `);
    });

    it('delete events', () => {
      const action: ReturnType<typeof deleteEvents> = {
        payload: {
          stageId: {
            definitionId: {
              name: 'AL1'
            },
            startTime: 1669150800
          },
          openIntervalName: 'test',
          username: 'user',
          eventIds: ['A']
        },
        type: 'data/deleteEvents'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "A": [
              "Deletion",
              "EV-1970-01-01 01:00:00.000 deleted",
            ],
          },
          "history": [
            "Deletion",
            "EV-1970-01-01 01:00:00.000 deleted",
          ],
          "signalDetections": {},
        }
      `);

      result = getHistoryLabelDescriptions(
        { ...action, payload: { ...action.payload, eventIds: ['A', 'B'] } },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "A": [
              "Deletion",
              "EV-1970-01-01 01:00:00.000 deleted",
            ],
            "B": [
              "Deletion",
              "EV-1970-01-01 01:00:00.000 deleted",
            ],
          },
          "history": [
            "Deletion",
            "Multiple",
          ],
          "signalDetections": {},
        }
      `);
    });

    it('create signal detection', () => {
      const action: ReturnType<typeof createSignalDetection> = {
        payload: {
          signalDetection: {
            ...signalDetectionsData[0]
          },
          updatedUiChannelSegments: []
        },
        type: 'data/createSignalDetection'
      };

      const result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Creation",
            "ASAR-P created at 2021-11-10 00:16:44.000",
          ],
          "signalDetections": {
            "012de1b9-8ae3-3fd4-800d-58665c3152cc": [
              "Creation",
              "ASAR-P created at 2021-11-10 00:16:44.000",
            ],
          },
        }
      `);
    });

    it('create signal detection and associate', () => {
      const action: ReturnType<typeof createSignalDetectionAndAssociate> = {
        payload: {
          signalDetection: signalDetectionsData[0],
          stageId: { definitionId: { name: 'stage name', effectiveTime: 111 }, startTime: 111 },
          username: 'test',
          openIntervalName: 'test',
          eventId: 'A',
          updatedUiChannelSegments: []
        },
        type: 'data/createSignalDetectionAndAssociate'
      };

      const result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Creation",
            "ASAR-P created at 2021-11-10 00:16:44.000 and associated to EV-1970-01-01 01:00:00.000",
          ],
          "signalDetections": {
            "012de1b9-8ae3-3fd4-800d-58665c3152cc": [
              "Creation",
              "ASAR-P created at 2021-11-10 00:16:44.000 and associated to EV-1970-01-01 01:00:00.000",
            ],
          },
        }
      `);
    });

    it('update signal detection arrival time', () => {
      const action: ReturnType<typeof updateArrivalTimeSignalDetection> = {
        payload: {
          stageId: { definitionId: { name: 'stage name', effectiveTime: 111 }, startTime: 111 },
          username: 'test',
          openIntervalName: 'test',
          signalDetectionId: 'A',
          arrivalTime: { value: 99, uncertainty: 5 },
          channelSegmentDescriptor: undefined,
          analysisWaveform: undefined,
          updatedUiChannelSegments: []
        },
        type: 'data/updateArrivalTimeSignalDetection'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Time",
            "ASAR-Pg time changed from 2021-11-10 00:16:44.000 to 2021-11-10 00:17:00.000",
          ],
          "signalDetections": {
            "A": [
              "Time",
              "ASAR-Pg time changed from 2021-11-10 00:16:44.000 to 2021-11-10 00:17:00.000",
            ],
          },
        }
      `);

      result = getHistoryLabelDescriptions(
        {
          ...action,
          payload: {
            ...action.payload,
            signalDetectionId: 'D'
          }
        },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Time",
            "ASAR-P time uncertainty changed from 1.162s to 5.450s",
          ],
          "signalDetections": {
            "D": [
              "Time",
              "ASAR-P time uncertainty changed from 1.162s to 5.450s",
            ],
          },
        }
      `);
    });

    it('update signal detection time uncertainty', () => {
      const action: ReturnType<typeof updateArrivalTimeSignalDetection> = {
        payload: {
          stageId: { definitionId: { name: 'stage name', effectiveTime: 111 }, startTime: 111 },
          username: 'test',
          openIntervalName: 'test',
          signalDetectionId: 'C',
          arrivalTime: { value: 99, uncertainty: 5 },
          channelSegmentDescriptor: undefined,
          analysisWaveform: undefined,
          updatedUiChannelSegments: []
        },
        type: 'data/updateArrivalTimeSignalDetection'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Time",
            "ASAR-P time uncertainty changed from 1.162s to 1.224s",
          ],
          "signalDetections": {
            "C": [
              "Time",
              "ASAR-P time uncertainty changed from 1.162s to 1.224s",
            ],
          },
        }
      `);

      result = getHistoryLabelDescriptions(
        {
          ...action,
          payload: {
            ...action.payload,
            signalDetectionId: 'D'
          }
        },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Time",
            "ASAR-P time uncertainty changed from 1.162s to 5.450s",
          ],
          "signalDetections": {
            "D": [
              "Time",
              "ASAR-P time uncertainty changed from 1.162s to 5.450s",
            ],
          },
        }
      `);
    });

    it('update signal detection arrival time and time uncertainty', () => {
      const action: ReturnType<typeof updateArrivalTimeSignalDetection> = {
        payload: {
          stageId: { definitionId: { name: 'stage name', effectiveTime: 111 }, startTime: 111 },
          username: 'test',
          openIntervalName: 'test',
          signalDetectionId: 'A',
          arrivalTime: { value: 99, uncertainty: 5 },
          channelSegmentDescriptor: undefined,
          analysisWaveform: undefined,
          updatedUiChannelSegments: []
        },
        type: 'data/updateArrivalTimeSignalDetection'
      };

      const result = getHistoryLabelDescriptions(
        { ...action, payload: { ...action.payload } },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Time",
            "ASAR-Pg time changed from 2021-11-10 00:16:44.000 to 2021-11-10 00:17:00.000",
          ],
          "signalDetections": {
            "A": [
              "Time",
              "ASAR-Pg time changed from 2021-11-10 00:16:44.000 to 2021-11-10 00:17:00.000",
            ],
          },
        }
      `);
    });

    it('update signal detection phase', () => {
      const action: ReturnType<typeof updatePhaseSignalDetection> = {
        payload: {
          stageId: { definitionId: { name: 'stage name', effectiveTime: 111 }, startTime: 111 },
          username: 'test',
          openIntervalName: 'test',
          updateSignalDetectionsRecord: {
            A: {
              channelSegmentDescriptor: unfilteredSamplesUiChannelSegment.channelSegmentDescriptor,
              analysisWaveform: undefined
            }
          },
          phase: 'P'
        },
        type: 'data/updatePhaseSignalDetection'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Phase",
            "ASAR-P phase changed to Pg",
          ],
          "signalDetections": {
            "A": [
              "Phase",
              "ASAR-P phase changed to Pg",
            ],
          },
        }
      `);

      result = getHistoryLabelDescriptions(
        {
          ...action,
          payload: {
            ...action.payload,
            updateSignalDetectionsRecord: {
              ...action.payload.updateSignalDetectionsRecord,
              B: {
                channelSegmentDescriptor:
                  unfilteredSamplesUiChannelSegment.channelSegmentDescriptor,
                analysisWaveform: undefined
              }
            }
          }
        },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Phase",
            "Multiple to P",
          ],
          "signalDetections": {
            "A": [
              "Phase",
              "ASAR-P phase changed to Pg",
            ],
            "B": [
              "Phase",
              "ASAR-P phase changed to Pg",
            ],
          },
        }
      `);
    });

    it('delete signal detection', () => {
      const action: ReturnType<typeof deleteSignalDetection> = {
        payload: {
          stageId: { definitionId: { name: 'stage name', effectiveTime: 111 }, startTime: 111 },
          username: 'test',
          openIntervalName: 'test',
          signalDetectionIds: ['A']
        },
        type: 'data/deleteSignalDetection'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Deletion",
            "ASAR-Pg deleted at 2021-11-10 00:17:00.000",
          ],
          "signalDetections": {
            "A": [
              "Deletion",
              "ASAR-Pg deleted at 2021-11-10 00:17:00.000",
            ],
          },
        }
      `);

      result = getHistoryLabelDescriptions(
        { ...action, payload: { ...action.payload, signalDetectionIds: ['A', 'B'] } },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "Deletion",
            "Multiple",
          ],
          "signalDetections": {
            "A": [
              "Deletion",
              "ASAR-Pg deleted at 2021-11-10 00:17:00.000",
            ],
            "B": [
              "Deletion",
              "ASAR-Pg deleted at 2021-11-10 00:17:00.000",
            ],
          },
        }
      `);
    });

    it('accept fk', () => {
      const action: ReturnType<typeof acceptFk> = {
        payload: {
          sdIdsAndMeasuredValues: [
            { signalDetectionId: 'A', measuredValues: { azimuth: 44, slowness: 98 } }
          ],
          stageId: { definitionId: { name: 'stage name', effectiveTime: 111 }, startTime: 111 },
          username: 'test',
          openIntervalName: 'test'
        },
        type: 'data/acceptFkAction'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "FK",
            "ASAR-Pg az/slow accepted at time 2020-12-01 10:24:00.000",
          ],
          "signalDetections": {
            "A": [
              "FK",
              "ASAR-Pg az/slow accepted at time 2020-12-01 10:24:00.000",
            ],
          },
        }
      `);

      result = getHistoryLabelDescriptions(
        {
          ...action,
          payload: {
            ...action.payload,
            sdIdsAndMeasuredValues: [
              { signalDetectionId: 'A', measuredValues: { azimuth: 44, slowness: 98 } },
              { signalDetectionId: 'B', measuredValues: { azimuth: 19, slowness: 17 } }
            ]
          }
        },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {},
          "history": [
            "FK",
            "Multiple",
          ],
          "signalDetections": {
            "A": [
              "FK",
              "ASAR-Pg az/slow accepted at time 2020-12-01 10:24:00.000",
            ],
            "B": [
              "FK",
              "ASAR-Pg az/slow accepted at time 2020-12-01 10:24:00.000",
            ],
          },
        }
      `);
    });

    it('addEventBeamsAndChannelsAction', () => {
      const action: ReturnType<typeof addEventBeamsAndChannels> = {
        payload: {
          stageId: { definitionId: { name: 'stage name', effectiveTime: 111 }, startTime: 111 },
          username: 'test',
          openIntervalName: 'test',
          eventHypothesisId: 'unknown',
          eventId: 'A',
          results: [],
          phase: 'P'
        },
        type: 'data/addEventBeamsAndChannels'
      };

      let result = getHistoryLabelDescriptions(action, original, state);
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "A": [
              "Event beam",
              "EV-1970-01-01 01:00:00.000 created beams on 0 stations for P",
            ],
          },
          "history": [
            "Event beam",
            "EV-1970-01-01 01:00:00.000 created beams on 0 stations for P",
          ],
          "signalDetections": {},
        }
      `);

      result = getHistoryLabelDescriptions(
        {
          ...action,
          payload: {
            ...action.payload,
            results: [
              {
                beamedChannel: {
                  station: {
                    name: 'TEST1'
                  }
                }
              } as any
            ]
          }
        },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "A": [
              "Event beam",
              "EV-1970-01-01 01:00:00.000 created beams on stations: TEST1-P",
            ],
          },
          "history": [
            "Event beam",
            "EV-1970-01-01 01:00:00.000 created beams on stations: TEST1-P",
          ],
          "signalDetections": {},
        }
      `);

      result = getHistoryLabelDescriptions(
        {
          ...action,
          payload: {
            ...action.payload,
            results: [
              {
                beamedChannel: {
                  station: {
                    name: 'TEST1'
                  }
                }
              },
              {
                beamedChannel: {
                  station: {
                    name: 'TEST2'
                  }
                }
              },
              {
                beamedChannel: {
                  station: {
                    name: 'TEST3'
                  }
                }
              }
            ] as any[]
          }
        },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "A": [
              "Event beam",
              "EV-1970-01-01 01:00:00.000 created beams on stations: TEST1-P, TEST2-P, TEST3-P",
            ],
          },
          "history": [
            "Event beam",
            "EV-1970-01-01 01:00:00.000 created beams on stations: TEST1-P, TEST2-P, TEST3-P",
          ],
          "signalDetections": {},
        }
      `);

      result = getHistoryLabelDescriptions(
        {
          ...action,
          payload: {
            ...action.payload,
            results: [
              {
                beamedChannel: {
                  station: {
                    name: 'TEST1'
                  }
                }
              },
              {
                beamedChannel: {
                  station: {
                    name: 'TEST2'
                  }
                }
              },
              {
                beamedChannel: {
                  station: {
                    name: 'TEST3'
                  }
                }
              },
              {
                beamedChannel: {
                  station: {
                    name: 'TEST4'
                  }
                }
              }
            ] as any[]
          }
        },
        original,
        state
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "events": {
            "A": [
              "Event beam",
              "EV-1970-01-01 01:00:00.000 created beams on 4 stations for P",
            ],
          },
          "history": [
            "Event beam",
            "EV-1970-01-01 01:00:00.000 created beams on 4 stations for P",
          ],
          "signalDetections": {},
        }
      `);
    });
  });
});
