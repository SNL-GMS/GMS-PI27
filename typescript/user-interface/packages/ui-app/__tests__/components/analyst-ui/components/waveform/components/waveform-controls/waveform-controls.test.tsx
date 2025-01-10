/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable react/jsx-props-no-spreading */
import type { CommonTypes } from '@gms/common-model';
import { ConfigurationTypes } from '@gms/common-model';
import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import { AnalystWorkspaceTypes, getStore } from '@gms/ui-state';
import { AlignWaveformsOn } from '@gms/ui-state/lib/app/state/analyst/types';
import { render } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';
import * as React from 'react';
import { Provider } from 'react-redux';

import { WaveformControls } from '../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls';
import { AmplitudeScalingOptions } from '../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls/scaling-options';
import type { WaveformControlsProps } from '../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-controls/types';
import { WaveformLoadingIndicator } from '../../../../../../../src/ts/components/analyst-ui/components/waveform/components/waveform-loading-indicator';
import { BaseDisplayContext } from '../../../../../../../src/ts/components/common-ui/components/base-display';
import { useQueryStateResult } from '../../../../../../__data__/test-util-data';

const MOCK_TIME = 123456789;

const mockDate: any = new Date(MOCK_TIME);
mockDate.now = () => MOCK_TIME;
Date.constructor = jest.fn(() => new Date(MOCK_TIME));
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
Date.now = jest.fn(() => MOCK_TIME);
Date.UTC = jest.fn(() => MOCK_TIME);

jest.mock('moment-precise-range-plugin', () => {
  return {};
});

const operationalTimeRange: CommonTypes.TimeRange = {
  startTimeSecs: 0,
  endTimeSecs: 48 * 3600 // 48 hours
};
const operationalTimePeriodConfigurationQuery = cloneDeep(useQueryStateResult);
operationalTimePeriodConfigurationQuery.data = operationalTimeRange;

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useKeyboardShortcutConfigurationsWithValidation: jest.fn(() => {
      const keyboardShortcutConfig = processingAnalystConfigurationData.keyboardShortcuts;
      return keyboardShortcutConfig;
    }),
    useGetProcessingAnalystConfigurationQuery: jest.fn(() => {
      const processingConfig = {
        ...cloneDeep(useQueryStateResult),
        data: {
          ...processingAnalystConfigurationData,
          mOpenAnythingDuration: 7200,
          beamforming: {
            beamChannelThreshold: 3,
            createEventBeamsDescription: 'Test description',
            leadDuration: 60,
            beamDuration: 300,
            beamSummationMethods: {
              COHERENT: 'COHERENT',
              INCOHERENT: 'INCOHERENT',
              RMS: 'RMS'
            },
            interpolationMethods: {
              NEAREST_SAMPLE: 'Nearest sample',
              INTERPOLATED: 'Interpolated'
            },
            beamInputChannelPrioritization: ['SHZ', 'BHZ', 'MHZ', 'HHZ', 'EHZ']
          }
        }
      };
      return processingConfig;
    }),
    useGetOperationalTimePeriodConfigurationQuery: jest.fn(
      () => operationalTimePeriodConfigurationQuery
    )
  };
});

describe('WaveformControls', () => {
  const currentOpenEventId = 'TEST_EVENT_ID';
  const FIFTEEN_MINUTES = 15 * 60;
  const currentTimeInterval = {
    startTimeSecs: MOCK_TIME,
    endTimeSecs: MOCK_TIME + 10000
  };
  const viewableTimeInterval = {
    startTimeSecs: MOCK_TIME - FIFTEEN_MINUTES,
    endTimeSecs: MOCK_TIME + 10000 + FIFTEEN_MINUTES
  };
  it('matches a snapshot when given basic props', () => {
    const props: WaveformControlsProps = {
      defaultSignalDetectionPhase: 'P',
      setCreateEventMenuState: jest.fn(),
      setCurrentPhaseMenuVisibility: jest.fn(),
      currentSortType: AnalystWorkspaceTypes.WaveformSortType.stationNameAZ,
      currentOpenEventId,
      currentTimeInterval,
      viewableTimeInterval,
      analystNumberOfWaveforms: 20,
      showPredictedPhases: false,
      alignWaveformsOn: AlignWaveformsOn.TIME,
      defaultPhaseAlignment: 'P',
      phaseToAlignOn: 'P',
      selectedStationIds: [],
      measurementMode: {
        mode: AnalystWorkspaceTypes.WaveformDisplayMode.DEFAULT,
        entries: undefined
      },
      setDefaultSignalDetectionPhase: jest.fn(),
      setAlignWaveformsOn: jest.fn(),
      setSelectedSortType: jest.fn(),
      setAnalystNumberOfWaveforms: jest.fn(),
      setMode: jest.fn(),
      toggleMeasureWindow: jest.fn(),
      loadData: jest.fn(),
      onKeyPress: jest.fn(),
      isMeasureWindowVisible: false,
      amplitudeScaleOption: AmplitudeScalingOptions.AUTO,
      fixedScaleVal: 1,
      setAmplitudeScaleOption: jest.fn(),
      setFixedScaleVal: jest.fn(),
      zoomAlignSort: jest.fn(),
      featurePredictionQueryDataUnavailable: false,
      uiTheme: {
        name: 'mockTheme',
        isDarkMode: true,
        colors: ConfigurationTypes.defaultColorTheme,
        display: {
          edgeEventOpacity: 0.5,
          edgeSDOpacity: 0.2,
          predictionSDOpacity: 0.1
        }
      },
      qcMaskDefaultVisibility: {
        analystDefined: true,
        dataAuthentication: false,
        longTerm: true,
        processingMask: true,
        rejected: true,
        stationSOH: true,
        unprocessed: true,
        waveform: true,
        qcSegments: true
      },
      setRotationDialogVisibility: jest.fn(),
      setEventBeamDialogVisibility: jest.fn(),
      setWaveformAlignment: jest.fn()
    };
    const { container } = render(
      <Provider store={getStore()}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: undefined,
            widthPx: 1920,
            heightPx: 1080
          }}
        >
          <WaveformControls {...props} />
          <WaveformLoadingIndicator />
        </BaseDisplayContext.Provider>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('matches a snapshot when given missing props', () => {
    const props: WaveformControlsProps = {
      setCreateEventMenuState: jest.fn(),
      setCurrentPhaseMenuVisibility: jest.fn(),
      defaultSignalDetectionPhase: 'P',
      currentSortType: AnalystWorkspaceTypes.WaveformSortType.stationNameAZ,
      currentOpenEventId,
      currentTimeInterval,
      viewableTimeInterval,
      analystNumberOfWaveforms: 20,
      showPredictedPhases: false,
      alignWaveformsOn: AlignWaveformsOn.PREDICTED_PHASE,
      phaseToAlignOn: 'P',
      defaultPhaseAlignment: 'P',
      selectedStationIds: [],
      measurementMode: {
        mode: AnalystWorkspaceTypes.WaveformDisplayMode.DEFAULT,
        entries: undefined
      },
      setDefaultSignalDetectionPhase: jest.fn(),
      setSelectedSortType: jest.fn(),
      setAnalystNumberOfWaveforms: jest.fn(),
      setAlignWaveformsOn: jest.fn(),
      setMode: jest.fn(),
      toggleMeasureWindow: jest.fn(),
      loadData: jest.fn(),
      onKeyPress: jest.fn(),
      isMeasureWindowVisible: false,
      amplitudeScaleOption: AmplitudeScalingOptions.AUTO,
      fixedScaleVal: 1,
      setAmplitudeScaleOption: jest.fn(),
      setFixedScaleVal: jest.fn(),
      zoomAlignSort: jest.fn(),
      setWaveformAlignment: jest.fn(),
      featurePredictionQueryDataUnavailable: false,
      qcMaskDefaultVisibility: {
        analystDefined: true,
        dataAuthentication: false,
        longTerm: true,
        processingMask: true,
        rejected: true,
        stationSOH: true,
        unprocessed: true,
        waveform: true,
        qcSegments: true
      },
      uiTheme: {
        name: 'mockTheme',
        isDarkMode: true,
        colors: ConfigurationTypes.defaultColorTheme,
        display: {
          edgeEventOpacity: 0.5,
          edgeSDOpacity: 0.2,
          predictionSDOpacity: 0.1
        }
      },
      setRotationDialogVisibility: jest.fn(),
      setEventBeamDialogVisibility: jest.fn()
    };
    const { container } = render(
      <Provider store={getStore()}>
        <BaseDisplayContext.Provider
          value={{
            glContainer: undefined,
            widthPx: 1920,
            heightPx: 1080
          }}
        >
          <WaveformControls {...props} />
          <WaveformLoadingIndicator />
        </BaseDisplayContext.Provider>
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
