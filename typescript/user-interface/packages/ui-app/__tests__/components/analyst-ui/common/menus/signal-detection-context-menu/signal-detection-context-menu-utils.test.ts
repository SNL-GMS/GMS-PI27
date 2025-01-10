import type { SignalDetectionTypes } from '@gms/common-model';
import {
  deletedEventData,
  eventData,
  rejectedEventData,
  signalDetectionsData
} from '@gms/common-model/__tests__/__data__';
import { AnalystWorkspaceTypes } from '@gms/ui-state';

import {
  canDisplayFkForSds,
  canGenerateFk,
  getSignalDetectionDetailsProps,
  hideMeasurementModeEntries,
  showMeasurementModeEntries,
  toggleShownSDs
} from '~analyst-ui/common/menus/signal-detection-menu-utils';

describe('Signal Detection Context Menu Utils', () => {
  const sdhypIds: string[] = [];
  signalDetectionsData.forEach(sd => {
    sd.signalDetectionHypotheses.forEach(sdhypo => {
      sdhypIds.push(sdhypo.id.id);
    });
  });

  const mockSetMeasurementModeEntries = jest.fn();
  const measurementMode = {
    mode: AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT,
    entries: {
      [signalDetectionsData[0].id]: true
    }
  };

  it('Should be defined', () => {
    expect(canDisplayFkForSds).toBeDefined();
    expect(canGenerateFk).toBeDefined();
    expect(getSignalDetectionDetailsProps).toBeDefined();
    expect(hideMeasurementModeEntries).toBeDefined();
    expect(showMeasurementModeEntries).toBeDefined();
    expect(toggleShownSDs).toBeDefined();
  });

  it('canGenerateFk', () => {
    const result: boolean = canGenerateFk(signalDetectionsData[0]);
    expect(result).toBe(true);
  });

  it('getSignalDetectionDetailsProps', () => {
    const mockUiThemeColors = {
      colors: {
        openEventSDColor: '#000000',
        completeEventSDColor: '#111111',
        otherEventSDColor: '#222222',
        unassociatedSDColor: '#333333'
      }
    };
    const sdDetailsProps = getSignalDetectionDetailsProps(
      signalDetectionsData[0],
      [eventData, deletedEventData, rejectedEventData],
      eventData.id,
      undefined,
      'AL1',
      { startTimeSecs: 1638297900, endTimeSecs: 1638298200 },
      mockUiThemeColors as any
    );
    expect(sdDetailsProps).toMatchSnapshot();
  });

  describe('canDisplayFkForSds', () => {
    it('canDisplayFkForSds is false', () => {
      const result: boolean = canDisplayFkForSds([] as SignalDetectionTypes.SignalDetection[]);
      expect(result).toBe(false);
    });
  });

  it('hideMeasurementModeEntries', () => {
    hideMeasurementModeEntries(
      sdhypIds,
      measurementMode,
      signalDetectionsData,
      mockSetMeasurementModeEntries
    );

    expect(mockSetMeasurementModeEntries).toHaveBeenCalledWith({
      '012de1b9-8ae3-3fd4-800d-58123c3152cc': false,
      '012de1b9-8ae3-3fd4-800d-58165c3152cc': false,
      '012de1b9-8ae3-3fd4-800d-58665c3152cc': false,
      '012de1b9-8ae3-3fd4-800d-58665c3152dd': false
    });
  });

  it('showMeasurementModeEntries', () => {
    showMeasurementModeEntries(
      sdhypIds,
      measurementMode,
      signalDetectionsData,
      mockSetMeasurementModeEntries
    );

    expect(mockSetMeasurementModeEntries).toHaveBeenCalledWith({
      '012de1b9-8ae3-3fd4-800d-58123c3152cc': true,
      '012de1b9-8ae3-3fd4-800d-58165c3152cc': true,
      '012de1b9-8ae3-3fd4-800d-58665c3152cc': true,
      '012de1b9-8ae3-3fd4-800d-58665c3152dd': true
    });
  });

  it('toggleShownSDs', () => {
    toggleShownSDs(
      signalDetectionsData.map(sd => sd.id),
      true,
      true,
      measurementMode,
      mockSetMeasurementModeEntries
    );

    expect(mockSetMeasurementModeEntries).toHaveBeenCalledWith({
      '012de1b9-8ae3-3fd4-800d-58123c3152cc': false,
      '012de1b9-8ae3-3fd4-800d-58165c3152cc': false,
      '012de1b9-8ae3-3fd4-800d-58665c3152cc': false,
      '012de1b9-8ae3-3fd4-800d-58665c3152dd': false
    });
  });
});
