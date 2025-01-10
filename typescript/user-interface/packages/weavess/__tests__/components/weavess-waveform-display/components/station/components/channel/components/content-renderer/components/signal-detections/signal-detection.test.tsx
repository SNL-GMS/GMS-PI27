import type { WeavessTypes } from '@gms/weavess-core';
import { WeavessConstants } from '@gms/weavess-core';
import { render } from '@testing-library/react';
import * as React from 'react';

import { SignalDetection } from '../../../../../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/components/content-renderer/components/signal-detections';
import type { SignalDetectionProps } from '../../../../../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/components/content-renderer/components/signal-detections/types';
import { initialConfiguration } from '../../../../../../../../../../__data__/test-util-data';

const displayInterval: WeavessTypes.TimeRange = {
  startTimeSecs: 500,
  endTimeSecs: 600
};
const signalDetection: WeavessTypes.PickMarker = {
  /** unique id of the pick marker */
  id: 'foo',
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  timeSecs: displayInterval.startTimeSecs + 10,
  uncertaintySecs: 1.5,
  showUncertaintyBars: true,
  label: 'P',
  color: 'red',
  isConflicted: false,
  isSelected: true,
  isDisabled: false,
  isActionTarget: false,
  isDraggable: true,
  filter: 'none'
};

const weavessEvents: WeavessTypes.ChannelContentEvents = {
  ...WeavessConstants.DEFAULT_UNDEFINED_EVENTS?.stationEvents?.defaultChannelEvents?.events,
  onSignalDetectionDragEnd: jest.fn()
};

const props: SignalDetectionProps = {
  stationId: 'my-station',
  channelId: 'my-channel',
  signalDetection,
  displayInterval,
  viewableInterval: displayInterval,
  offsetSecs: 0,
  events: weavessEvents,
  initialConfiguration,
  getTimeSecsForClientX: jest.fn(() => 2),
  toggleDragIndicator: jest.fn(),
  positionDragIndicator: jest.fn(),
  getClientXForTimeSecs: jest.fn(),
  isOnSplitChannel: false
};

describe('Weavess Signal Detection', () => {
  it('Weavess Pick Marker to be defined', () => {
    expect(SignalDetection).toBeDefined();
  });

  it('renders', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const { container } = render(<SignalDetection {...props} />);
    expect(container).toMatchSnapshot();
  });
});
