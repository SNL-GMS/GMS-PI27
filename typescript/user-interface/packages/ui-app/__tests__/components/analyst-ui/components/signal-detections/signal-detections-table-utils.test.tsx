/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-return-assign */
import { EventTypes } from '@gms/common-model';
import {
  eventData,
  eventData2,
  eventStatusInfoComplete,
  eventStatusInfoInProgress,
  openIntervalName,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import type { RowNode } from '@gms/ui-core-components';
import type { EventStatus } from '@gms/ui-state';
import cloneDeep from 'lodash/cloneDeep';

import { getSignalDetectionStatus } from '~analyst-ui/common/utils/event-util';
import { getEdgeType } from '~analyst-ui/common/utils/signal-detection-util';

import { EventFilterOptions } from '../../../../../src/ts/components/analyst-ui/components/events/types';
import {
  agGridDoesExternalFilterPass,
  agGridIsExternalFilterPresent,
  buildSignalDetectionRow,
  formatRectilinearityOrEmergenceForDisplay,
  signalDetectionsColumnsToDisplay
} from '../../../../../src/ts/components/analyst-ui/components/signal-detections/table/signal-detections-table-utils';
import { messageConfig } from '../../../../../src/ts/components/analyst-ui/config/message-config';
import {
  setRowNodeSelection,
  updateColumns
} from '../../../../../src/ts/components/common-ui/common/table-utils';

describe('Signal Detection Table Utils', () => {
  const currentIntervalMock = {
    startTimeSecs: 6000,
    endTimeSecs: 7000
  };

  it('are defined', () => {
    expect(formatRectilinearityOrEmergenceForDisplay).toBeDefined();
    expect(buildSignalDetectionRow).toBeDefined();
    expect(signalDetectionsColumnsToDisplay).toBeDefined();
    expect(getEdgeType).toBeDefined();
  });

  describe('getEdgeType', () => {
    it('returns before', () => {
      const edgeResult = getEdgeType(currentIntervalMock, 0);
      expect(edgeResult).toEqual(EventFilterOptions.BEFORE);
    });
    it('returns after', () => {
      const edgeResult = getEdgeType(currentIntervalMock, 9001);
      expect(edgeResult).toEqual(EventFilterOptions.AFTER);
    });
    it('returns during', () => {
      const edgeResult = getEdgeType(currentIntervalMock, 6565);
      expect(edgeResult).toEqual(EventFilterOptions.INTERVAL);
    });
  });

  describe('agGridIsExternalFilterPresent', () => {
    it('Given all true values, returns false', () => {
      const filterState = {
        syncWaveform: false,
        signalDetectionBeforeInterval: true,
        signalDetectionAfterInterval: true,
        signalDetectionAssociatedToOpenEvent: true,
        signalDetectionAssociatedToCompletedEvent: true,
        signalDetectionAssociatedToOtherEvent: true,
        signalDetectionConflicts: true,
        signalDetectionUnassociated: true,
        signalDetectionDeleted: true
      };
      const result = agGridIsExternalFilterPresent(filterState);
      expect(result).toBe(false);
    });
    it('Filter SDs associated with OpenEvent, returns true', () => {
      const filterState = {
        syncWaveform: false,
        signalDetectionBeforeInterval: true,
        signalDetectionAfterInterval: true,
        signalDetectionAssociatedToOpenEvent: true,
        signalDetectionAssociatedToCompletedEvent: false,
        signalDetectionAssociatedToOtherEvent: false,
        signalDetectionConflicts: true,
        signalDetectionUnassociated: false,
        signalDetectionDeleted: false
      };
      const result = agGridIsExternalFilterPresent(filterState);
      expect(result).toBe(true);
    });
    it('Filter SDs associated with CompletedEvent, returns true', () => {
      const filterState = {
        syncWaveform: false,
        signalDetectionBeforeInterval: true,
        signalDetectionAfterInterval: true,
        signalDetectionAssociatedToOpenEvent: false,
        signalDetectionAssociatedToCompletedEvent: true,
        signalDetectionAssociatedToOtherEvent: false,
        signalDetectionConflicts: true,
        signalDetectionUnassociated: false,
        signalDetectionDeleted: false
      };
      const result = agGridIsExternalFilterPresent(filterState);
      expect(result).toBe(true);
    });
    it('Filter SDs associated with OtherEvent, returns true', () => {
      const filterState = {
        syncWaveform: false,
        signalDetectionBeforeInterval: true,
        signalDetectionAfterInterval: true,
        signalDetectionAssociatedToOpenEvent: false,
        signalDetectionAssociatedToCompletedEvent: false,
        signalDetectionAssociatedToOtherEvent: true,
        signalDetectionConflicts: true,
        signalDetectionUnassociated: false,
        signalDetectionDeleted: false
      };
      const result = agGridIsExternalFilterPresent(filterState);
      expect(result).toBe(true);
    });
    it('Filter unassociated SDs, returns true', () => {
      const filterState = {
        syncWaveform: false,
        signalDetectionBeforeInterval: true,
        signalDetectionAfterInterval: true,
        signalDetectionAssociatedToOpenEvent: false,
        signalDetectionAssociatedToCompletedEvent: false,
        signalDetectionAssociatedToOtherEvent: false,
        signalDetectionConflicts: true,
        signalDetectionUnassociated: true,
        signalDetectionDeleted: false
      };
      const result = agGridIsExternalFilterPresent(filterState);
      expect(result).toBe(true);
    });

    it('Filter rejected SDs, returns true', () => {
      const filterState = {
        syncWaveform: false,
        signalDetectionBeforeInterval: true,
        signalDetectionAfterInterval: true,
        signalDetectionAssociatedToOpenEvent: false,
        signalDetectionAssociatedToCompletedEvent: false,
        signalDetectionAssociatedToOtherEvent: false,
        signalDetectionConflicts: true,
        signalDetectionUnassociated: false,
        signalDetectionDeleted: true
      };
      const result = agGridIsExternalFilterPresent(filterState);
      expect(result).toBe(true);
    });
  });

  describe('agGridDoesExternalFilterPass', () => {
    const filterState = {
      syncWaveform: false,
      signalDetectionBeforeInterval: true,
      signalDetectionAfterInterval: true,
      signalDetectionAssociatedToOpenEvent: true,
      signalDetectionAssociatedToCompletedEvent: true,
      signalDetectionAssociatedToOtherEvent: true,
      signalDetectionConflicts: true,
      signalDetectionUnassociated: true,
      signalDetectionDeleted: false
    };
    const allMockEvents = [eventData, eventData2];

    it('Filters OPEN_ASSOCIATED event association', () => {
      const eventStatusesComplete: Record<string, EventStatus> = {
        [eventData2.id]: {
          stageId: { name: openIntervalName },
          eventId: eventData2.id,
          eventStatusInfo: eventStatusInfoComplete
        }
      };

      // Should be OPEN_ASSOCIATED
      const associationStatus = getSignalDetectionStatus(
        signalDetectionsData[0],
        allMockEvents,
        eventData2.id,
        eventStatusesComplete,
        openIntervalName
      );

      const rowNode = buildSignalDetectionRow(
        {
          sd: signalDetectionsData[0],
          associationStatus,
          sdInConflict: false,
          sdIsActionTarget: false,
          validActionTargetSignalDetectionIds: []
        },
        currentIntervalMock
      );
      const result = agGridDoesExternalFilterPass({ data: rowNode } as RowNode, filterState);
      expect(result).toBe(true);
    });

    it('Filters COMPLETE_ASSOCIATED event association', () => {
      const eventStatusesComplete: Record<string, EventStatus> = {
        [eventData.id]: {
          stageId: { name: openIntervalName },
          eventId: eventData.id,
          eventStatusInfo: eventStatusInfoComplete
        }
      };

      // Should be COMPLETE_ASSOCIATED
      const associationStatus = getSignalDetectionStatus(
        signalDetectionsData[0],
        allMockEvents,
        '',
        eventStatusesComplete,
        openIntervalName
      );

      const rowNode = buildSignalDetectionRow(
        {
          sd: signalDetectionsData[0],
          associationStatus,
          sdInConflict: false,
          sdIsActionTarget: false,
          validActionTargetSignalDetectionIds: []
        },
        currentIntervalMock
      );
      const result = agGridDoesExternalFilterPass({ data: rowNode } as RowNode, filterState);
      expect(result).toBe(true);

      const newFilterState = cloneDeep(filterState);
      newFilterState.signalDetectionAssociatedToCompletedEvent = false;

      const result2 = agGridDoesExternalFilterPass({ data: rowNode } as RowNode, newFilterState);
      expect(result2).toBe(false);
    });

    it('Filters out COMPLETE_ASSOCIATED event association if it is an edge event', () => {
      const newFilterState = cloneDeep(filterState);
      newFilterState.signalDetectionBeforeInterval = false;

      const eventStatusesComplete: Record<string, EventStatus> = {
        [eventData.id]: {
          stageId: { name: openIntervalName },
          eventId: eventData.id,
          eventStatusInfo: eventStatusInfoComplete
        }
      };

      // Should be COMPLETE_ASSOCIATED
      const associationStatus = getSignalDetectionStatus(
        signalDetectionsData[0],
        allMockEvents,
        '',
        eventStatusesComplete,
        openIntervalName
      );

      const rowNode = buildSignalDetectionRow(
        {
          sd: signalDetectionsData[0],
          associationStatus,
          sdInConflict: false,
          sdIsActionTarget: false,
          validActionTargetSignalDetectionIds: []
        },
        currentIntervalMock
      );

      rowNode.edgeType = EventFilterOptions.BEFORE;
      const result = agGridDoesExternalFilterPass({ data: rowNode } as RowNode, newFilterState);
      expect(result).toBe(false);

      rowNode.edgeType = EventFilterOptions.AFTER;
      const resultAfter = agGridDoesExternalFilterPass(
        { data: rowNode } as RowNode,
        newFilterState
      );
      expect(resultAfter).toBe(true);
    });

    it('Filters OTHER_ASSOCIATED event association', () => {
      const eventStatusesInProgress: Record<string, EventStatus> = {
        [eventData.id]: {
          stageId: { name: openIntervalName },
          eventId: eventData.id,
          eventStatusInfo: eventStatusInfoInProgress
        }
      };

      // Should be OTHER_ASSOCIATED
      const associationStatus = getSignalDetectionStatus(
        signalDetectionsData[0],
        allMockEvents,
        '',
        eventStatusesInProgress,
        openIntervalName
      );

      const rowNode = buildSignalDetectionRow(
        {
          sd: signalDetectionsData[0],
          associationStatus,
          sdInConflict: false,
          sdIsActionTarget: false,
          validActionTargetSignalDetectionIds: []
        },
        currentIntervalMock
      );
      const result = agGridDoesExternalFilterPass({ data: rowNode } as RowNode, filterState);
      expect(result).toBe(true);
    });
  });

  describe('formatRectilinearityOrEmergenceForDisplay', () => {
    it('Given -1, returns Unknown', () => {
      const result = formatRectilinearityOrEmergenceForDisplay(-1);
      expect(result).toEqual('Unknown');
    });
    it('Given null returns messageConfig.invalidCellText', () => {
      const result = formatRectilinearityOrEmergenceForDisplay(-1);
      expect(result).toEqual(messageConfig.invalidCellText);
    });
    it('Given undefined, returns messageConfig.invalidCellText', () => {
      const result = formatRectilinearityOrEmergenceForDisplay(-1);
      expect(result).toEqual(messageConfig.invalidCellText);
    });
    it('Given a number, returns a string containing that number with three decimal point precision', () => {
      const result = formatRectilinearityOrEmergenceForDisplay(234.2342);
      expect(result).toEqual('234.234');
    });
  });

  describe('buildRows', () => {
    const eventStatusesComplete: Record<string, EventStatus> = {};
    eventStatusesComplete[eventData.id] = {
      stageId: { name: 'sample' },
      eventId: '82ca9908-4272-4738-802b-f3d8f3099767',
      eventStatusInfo: {
        eventStatus: EventTypes.EventStatus.COMPLETE,
        activeAnalystIds: ['user1', 'user2']
      }
    };

    describe('updateColumns', () => {
      test('returns undefined with no tableref', () => {
        const result = updateColumns(undefined, signalDetectionsColumnsToDisplay);
        expect(result).toBeUndefined();
      });
      test('returns undefined with no tableref.current', () => {
        const result = updateColumns({ current: null }, signalDetectionsColumnsToDisplay);
        expect(result).toBeUndefined();
      });
      test('returns columns when provided tableref.current', () => {
        const result = updateColumns(
          { current: { columnApi: { setColumnVisible: jest.fn() } } } as any,
          signalDetectionsColumnsToDisplay
        );
        expect(result).toEqual(signalDetectionsColumnsToDisplay);
      });
    });

    describe('updateRowNodeSelection', () => {
      const rowNode = { selected: true, setSelected: jest.fn(s => (rowNode.selected = s)) };

      test('updates row to true', () => {
        const result = setRowNodeSelection(rowNode as unknown as RowNode, true) as any;
        expect(result.selected).toEqual(true);
      });

      test('updates row if false', () => {
        const result = setRowNodeSelection(rowNode as unknown as RowNode, false) as any;
        expect(result.selected).toEqual(false);
      });
    });
  });
});
