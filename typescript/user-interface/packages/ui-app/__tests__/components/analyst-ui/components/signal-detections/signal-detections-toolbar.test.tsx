import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { signalDetectionsColumnsToDisplay } from '../../../../../src/ts/components/analyst-ui/components/signal-detections/table/signal-detections-table-utils';
import {
  showDetectionsOnChange,
  SignalDetectionsToolbar
} from '../../../../../src/ts/components/analyst-ui/components/signal-detections/toolbar/signal-detections-toolbar';
import { BaseDisplayContext } from '../../../../../src/ts/components/common-ui/components/base-display/base-display-context';

const mockSetSelectedSDColumnsToDisplay = jest.fn();
const mocksetCreateEventMenuState = jest.fn();

describe('Signal Detection Toolbar', () => {
  test('can be mounted', () => {
    expect(SignalDetectionsToolbar).toBeDefined();
  });

  test('should match snapshot', () => {
    const { container } = render(
      <Provider store={getStore()}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: {} as any,
            widthPx: 100,
            heightPx: 100
          }}
        >
          <SignalDetectionsToolbar
            countEntryRecord={{
              Total: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Completed: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Deleted: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Open: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Other: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Conflicts: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' },
              Unassociated: { count: 0, color: 'tomato', isShown: true, tooltip: 'test' }
            }}
            setSelectedSDColumnsToDisplay={mockSetSelectedSDColumnsToDisplay}
            selectedSDColumnsToDisplay={signalDetectionsColumnsToDisplay}
            setCreateEventMenuState={mocksetCreateEventMenuState}
          />
        </BaseDisplayContext.Provider>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test('checkbox list showDetectionsOnChange with configuration arguments', () => {
    const dispatch = jest.fn();
    const eventObject = {
      syncWaveform: false,
      signalDetectionBeforeInterval: true,
      signalDetectionAfterInterval: true,
      signalDetectionAssociatedToOpenEvent: true,
      signalDetectionAssociatedToCompletedEvent: true,
      signalDetectionAssociatedToOtherEvent: true,
      signalDetectionConflicts: true,
      signalDetectionUnassociated: false
    };
    showDetectionsOnChange(dispatch)(eventObject);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
