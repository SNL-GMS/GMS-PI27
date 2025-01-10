import { queryByText, render } from '@testing-library/react';
import * as React from 'react';

import { ChannelNameRow } from '../../../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/components/label/label-rows';

describe('RowLabel', () => {
  it('renders a label for default channel given a channelLabel', () => {
    const { container } = render(
      <ChannelNameRow
        channelName="ASAR"
        channelLabel="beam.SHZ"
        isDefaultChannel
        isSplitChannel={false}
        phaseColor="FFF"
        phaseLabel="PP"
      />
    );
    expect(container).toMatchSnapshot();
    expect(queryByText(container, 'ASAR')).not.toBeNull();
    expect(queryByText(container, 'beam.SHZ')).not.toBeNull();
    // Not in split mode, and is default channel
    expect(queryByText(container, 'PP')).toBeNull();
  });

  it('renders a label for non-default channel in split mode with phase label', () => {
    const { container } = render(
      <ChannelNameRow
        channelName="ASAR"
        channelLabel="beam.SHZ"
        isDefaultChannel={false}
        isSplitChannel
        phaseColor="FFF"
        phaseLabel="PP"
      />
    );
    expect(container).toMatchSnapshot();
    expect(queryByText(container, 'ASAR')).not.toBeNull();
    expect(queryByText(container, 'beam.SHZ')).not.toBeNull();
    // In split mode, non-default channel
    expect(queryByText(container, '/PP')).not.toBeNull();
  });

  it('renders a label for default channel in split mode without phase label', () => {
    const { container } = render(
      <ChannelNameRow
        channelName="ASAR"
        channelLabel="beam.SHZ"
        isDefaultChannel
        isSplitChannel
        phaseColor="FFF"
        phaseLabel="PP"
      />
    );
    expect(container).toMatchSnapshot();
    expect(queryByText(container, 'ASAR')).not.toBeNull();
    expect(queryByText(container, 'beam.SHZ')).not.toBeNull();
    // In split mode, but is a default channel
    expect(queryByText(container, '/PP')).toBeNull();
  });
  it('renders a label for default channel without a channelLabel (normally for station with no data)', () => {
    const { container } = render(
      <ChannelNameRow
        channelName="ASAR"
        channelLabel=""
        isDefaultChannel
        isSplitChannel={false}
        phaseColor="FFF"
        phaseLabel="PP"
      />
    );
    expect(container).toMatchSnapshot();
    expect(queryByText(container, 'ASAR')).not.toBeNull();
  });

  it('creates labels for signal detections on a single raw channel', () => {
    const { container } = render(
      <ChannelNameRow
        channelName="ASAR.AS01.SHZ"
        channelLabel=""
        isDefaultChannel={false}
        isSplitChannel={false}
        phaseColor="FFF"
        phaseLabel="PP"
      />
    );
    expect(container).toMatchSnapshot();
    expect(queryByText(container, 'ASAR.AS01.SHZ')).toBeDefined();
  });

  it('correctly generates Slowness label for FK display', () => {
    const { container } = render(
      <ChannelNameRow
        channelName="Slowness"
        channelLabel="oaeuaoeu"
        isDefaultChannel={false}
        isSplitChannel={false}
        phaseColor="FFF"
        phaseLabel="PP"
      />
    );
    expect(container).toMatchSnapshot();
    expect(queryByText(container, '°')).not.toBeNull();
  });

  it('correctly generates Azimuth label for FK display', () => {
    const { container } = render(
      <ChannelNameRow
        channelName="Azimuth"
        channelLabel="oaeuaoeu"
        isDefaultChannel={false}
        isSplitChannel={false}
        phaseColor="FFF"
        phaseLabel="PP"
      />
    );
    expect(container).toMatchSnapshot();
    expect(queryByText(container, '(°)')).not.toBeNull();
  });
});
