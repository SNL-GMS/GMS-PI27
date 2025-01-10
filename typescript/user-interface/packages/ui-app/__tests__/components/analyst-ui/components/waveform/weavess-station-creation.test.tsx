import { AnalystWorkspaceTypes } from '@gms/ui-state';

import { createWeavessStations } from '../../../../../src/ts/components/analyst-ui/components/waveform/weavess-stations-util';
import { waveformUtilParams } from './__data__/weavess-station-util-data';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

describe('Weavess Station Creation unit tests', () => {
  const measurementMode: AnalystWorkspaceTypes.MeasurementMode = {
    mode: AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT,
    entries: {}
  };

  let result = createWeavessStations(
    waveformUtilParams,
    AnalystWorkspaceTypes.WaveformSortType.stationNameAZ,
    []
  );

  it('When switching to measurement mode, should show only waveforms/channels with associated SD', () => {
    expect(result).toMatchSnapshot();

    waveformUtilParams.measurementMode = measurementMode;

    result = createWeavessStations(
      waveformUtilParams,
      AnalystWorkspaceTypes.WaveformSortType.stationNameAZ,
      []
    );
    expect(result).toMatchSnapshot();
  });
});
