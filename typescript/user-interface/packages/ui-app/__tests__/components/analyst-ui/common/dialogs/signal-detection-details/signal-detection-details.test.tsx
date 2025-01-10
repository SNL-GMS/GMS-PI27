import { eventData, eventData2, signalDetectionsData } from '@gms/common-model/__tests__/__data__';
import type { AppState, AssociationConflictRecord } from '@gms/ui-state';
import { getStore } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { render } from '@testing-library/react';
import { produce } from 'immer';
import React from 'react';
import { Provider } from 'react-redux';

import { SignalDetectionDetails } from '~analyst-ui/common/dialogs';

// set up window alert and open so we don't see any errors
window.alert = jest.fn();
window.open = jest.fn();

// This is required so that jest.spyOn doesn't throw a type error
jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  const allEvents = {
    [eventData.id]: eventData,
    [eventData2.id]: eventData2
  };
  return {
    ...actual,
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const conflict: AssociationConflictRecord = {
        [signalDetectionsData[0].id]: {
          signalDetectionHypothesisId: signalDetectionsData[0].signalDetectionHypotheses[0].id,
          eventHypothesisIds: eventData.eventHypotheses.map(h => h.id)
        }
      };

      const state = produce(appState, draft => {
        draft.data.associationConflict = conflict;
        draft.app.workflow.openIntervalName = 'AL1';
        draft.app.analyst.openEventId = eventData.id;
        draft.data.associationConflict = conflict;
        draft.data.signalDetections = {
          [signalDetectionsData[0].id]: signalDetectionsData[0],
          [signalDetectionsData[1].id]: signalDetectionsData[1],
          [signalDetectionsData[2].id]: signalDetectionsData[2],
          [signalDetectionsData[3].id]: signalDetectionsData[3]
        };
        draft.data.events = allEvents;
      });
      return stateFunc(state);
    }),
    useGetEvents: jest.fn().mockReturnValue({
      data: Object.values(allEvents)
    })
  };
});

describe('SignalDetectionDetails', () => {
  it('renders with conflict icon and matches snapshot', () => {
    const store = getStore();
    const { container } = render(
      <Provider store={store}>
        <SignalDetectionDetails signalDetection={signalDetectionsData[0]} />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
  it('shows N/A for associated event time if not associated to an event', () => {
    const store = getStore();
    const { container } = render(
      <Provider store={store}>
        <SignalDetectionDetails signalDetection={signalDetectionsData[1]} />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
