import { render } from '@testing-library/react';

import {
  nonIdealStateSelectChannelGroupRow,
  nonIdealStateStationSelection
} from '../../../../../src/ts/components/analyst-ui/components/station-properties/station-properties-non-ideal-states';

describe('station-properties non ideal states', () => {
  test('can mount', () => {
    expect(nonIdealStateStationSelection).toBeDefined();
    expect(nonIdealStateSelectChannelGroupRow).toBeDefined();
  });
  test('match snapshots for nonIdealStateStationSelection with no station selected', () => {
    const { container } = render(
      nonIdealStateStationSelection(
        'No Station Selected',
        'Select a station in the Waveform, Map Display, or dropdown menu to view station properties',
        'select',
        [],
        [],
        jest.fn()
      )
    );
    expect(container).toMatchSnapshot();
  });

  test('match snapshots for nonIdealStateSelectChannelGroupRow', () => {
    const { container } = render(nonIdealStateSelectChannelGroupRow);
    expect(container).toMatchSnapshot();
  });
});
