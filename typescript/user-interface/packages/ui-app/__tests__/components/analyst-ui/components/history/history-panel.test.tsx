import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import type { AppState } from '@gms/ui-state';
import { getStore } from '@gms/ui-state';
import { appState } from '@gms/ui-state/__tests__/test-util';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { HistoryComponent } from '~analyst-ui/components/history/history-component';
import { HistoryPanel } from '~analyst-ui/components/history/history-panel';

import { glContainer } from '../workflow/gl-container';

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useKeyboardShortcutConfigurations: jest.fn(
      () => processingAnalystConfigurationData.keyboardShortcuts
    ),
    useHistoryKeyboardShortcutConfig: jest.fn(
      (key: string) => processingAnalystConfigurationData.keyboardShortcuts.hotkeys[key]
    ),
    useAppSelector: jest.fn((stateFunc: (state: AppState) => any) => {
      const state: AppState = appState;
      state.history = {
        mode: 'global',
        stack: [
          {
            id: 'b',
            historyId: `1`,
            label: 'label',
            description: 'desc',
            patches: [],
            inversePatches: [],
            status: 'applied',
            time: 1,
            type: 'data/updateArrivalTimeSignalDetection',
            conflictStatus: 'none',
            isDeletion: false,
            isRejection: false
          }
        ],
        events: {},
        signalDetections: {}
      };
      return stateFunc(state);
    })
  };
});

describe('history panel', () => {
  it('exists', () => {
    expect(HistoryPanel).toBeDefined();
  });

  it('can render with data', () => {
    const store = getStore();

    const { container } = render(
      <Provider store={store}>
        <HistoryComponent glContainer={glContainer} />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
