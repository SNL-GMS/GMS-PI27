import { processingAnalystConfigurationData } from '@gms/common-model/__tests__/__data__';
import { getStore } from '@gms/ui-state';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { AmplitudeScalingOptions } from '~analyst-ui/components/waveform/components/waveform-controls/scaling-options';
import type { WaveformLabelMenuProps } from '~analyst-ui/components/waveform/waveform-label-menu';
import { WaveformLabelMenu } from '~analyst-ui/components/waveform/waveform-label-menu';

jest.mock('@gms/ui-state', () => {
  const actual = jest.requireActual('@gms/ui-state');
  return {
    ...actual,
    useKeyboardShortcutConfigurationsWithValidation: jest.fn(
      () => processingAnalystConfigurationData.keyboardShortcuts
    )
  };
});

describe('WaveformLabelMenu', () => {
  const props: WaveformLabelMenuProps = {
    isDefaultChannel: false,
    isMeasureWindow: false,
    channelId: '',
    selectedStationIds: ['test', 'foo'],
    manuallyScaledChannelIds: ['test'],
    channelSegments: undefined,
    waveformClientState: {
      isLoading: false,
      total: 2,
      completed: 2,
      percent: 100,
      description: ''
    },
    weavessStations: [],
    amplitudeScaleOption: AmplitudeScalingOptions.AUTO,
    amplitudeMinValue: 0,
    amplitudeMaxValue: 0,
    showAllChannels: jest.fn(),
    hideStationOrChannel: jest.fn(),
    scaleAllAmplitudes: jest.fn(),
    resetAmplitudeSelectedChannels: jest.fn()
  };
  it('renders and matches snapshot', () => {
    const { container } = render(
      <Provider store={getStore()}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <WaveformLabelMenu {...props} />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
  it('renders with disabled options', () => {
    const { container } = render(
      <Provider store={getStore()}>
        <WaveformLabelMenu
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          selectedStationIds={[]}
          amplitudeScaleOption={AmplitudeScalingOptions.FIXED}
          waveformClientState={{
            isLoading: true,
            total: 2,
            completed: 2,
            percent: 100,
            description: ''
          }}
        />
      </Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
