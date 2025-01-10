import { eventData, eventData2, signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import type { AppState, AssociationConflictRecord } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { produce } from 'immer';
import React from 'react';

import { EventTimesDisplayItem } from '~analyst-ui/common/dialogs/signal-detection-details';

// set up window alert and open so we do../../../../../../src/ts/components/analyst-ui/common/dialogs
window.alert = jest.fn();
window.open = jest.fn();

// This is required so that jest.spyOn doesn't throw a type error
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const conflict: AssociationConflictRecord = {
        [signalDetectionsData[0].id]: {
          signalDetectionHypothesisId: signalDetectionsData[0].signalDetectionHypotheses[0].id,
          eventHypothesisIds: eventData.eventHypotheses.map(h => h.id)
        }
      };

      // const state: AppState = appState;
      const state = produce(appState, draft => {
        draft.data.associationConflict = conflict;
        draft.app.workflow.openIntervalName = 'AL1';
        draft.app.analyst.openEventId = eventData.id;
        draft.data.associationConflict = conflict;
        draft.data.events = {
          [eventData.id]: eventData,
          [eventData2.id]: eventData2
        };
      });
      return stateFunc(state);
    })
  };
});

describe('EventTimesDisplayItem', () => {
  it('Renders with 2 time entries', () => {
    const mockEventTimes = [{ time: 1686174616.291 }, { time: 1686175478.044 }];
    const { container } = render(
      <EventTimesDisplayItem time={['1686174616.291']} conflictData={mockEventTimes} />
    );
    expect(container).toMatchSnapshot();
  });

  it('Renders with 3 time entires and an overflow of 2', () => {
    const mockEventTimes = [
      { time: 1686174616.291 },
      { time: 1686175478.044 },
      { time: 1686175309.839 },
      { time: 1686176502.433 },
      { time: 1686179314.954 },
      { time: 1686173161.468 }
    ];
    const { container } = render(
      <EventTimesDisplayItem time={['1686174616.291']} conflictData={mockEventTimes} />
    );
    expect(container).toMatchSnapshot();
  });

  it('Renders tooltip on mouseover', async () => {
    const mockEventTimes = [
      { time: 1686174616.291 },
      { time: 1686175478.044 },
      { time: 1686175309.839 },
      { time: 1686176502.433 },
      { time: 1686179314.954 }
    ];
    const { container } = render(
      <EventTimesDisplayItem time={['1686174616.291']} conflictData={mockEventTimes} />
    );
    fireEvent.mouseOver(screen.getByText('2023-06-07 22:01:49.839'));
    await waitFor(() => {
      screen.getByText('Event(s) in conflict:');
    });
    expect(container).toMatchSnapshot();
  });
});
