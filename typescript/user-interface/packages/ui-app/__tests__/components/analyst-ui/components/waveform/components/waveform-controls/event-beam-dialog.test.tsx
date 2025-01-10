import { defaultStations } from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import { testFilterList } from '@gms/ui-state/__tests__/filter-list-data';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { EventBeamDialog } from '~analyst-ui/components/waveform/components/waveform-controls/event-beam-dialog/event-beam-dialog';

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useSelectedFilterList: jest.fn(() => testFilterList),
    useVisibleStations: jest.fn(() => defaultStations)
  };
});

describe('Event beam dialog', () => {
  it('matches snapshot', () => {
    const store = getStore();
    const mockSetEventBeamDialogVisibility = jest.fn();
    const { container } = render(
      <Provider store={store}>
        <EventBeamDialog
          setEventBeamDialogVisibility={mockSetEventBeamDialogVisibility}
          isEventBeamDialogVisible
        />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
