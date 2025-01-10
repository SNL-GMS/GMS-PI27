/* eslint-disable react/jsx-props-no-spreading */
import { WeavessTypes } from '@gms/weavess-core';
import { fireEvent, getByText, render } from '@testing-library/react';
import { hacker, internet, random, seed } from 'faker';
import * as React from 'react';
import * as util from 'util';

import { Label } from '../../../../../../../../../src/ts/components/weavess-waveform-display/components/station/components/channel/components/label/label';

Object.defineProperty(window, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(window, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});
Object.defineProperty(global, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
});
Object.defineProperty(global, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
});

const fakerDummyWaveformSeed = 123;
seed(fakerDummyWaveformSeed);

let labelProps: WeavessTypes.LabelProps;

const onContextMenu = jest.fn();

function generateDisplayType(): WeavessTypes.DisplayType[] {
  const displayTypes: WeavessTypes.DisplayType[] = [];
  for (let i = 0; i < random.number({ min: 1, max: 3 }); i += 1) {
    displayTypes.push(WeavessTypes.DisplayType[random.objectElement(WeavessTypes.DisplayType)]);
  }
  return displayTypes;
}

function generateDataSegment(): WeavessTypes.DataSegment {
  const values: number[] = [];
  for (let i = 0; i < random.number({ min: 10, max: 100 }); i += 1) {
    values.push(random.number({ min: -200, max: 200, precision: 3 }));
  }
  return {
    data: {
      startTimeSecs: 1610000000,
      endTimeSecs: 1610001000,
      sampleRate: random.number({ min: 20, max: 100 }),
      values
    },
    color: random.arrayElement([undefined, internet.color()]),
    displayType: random.arrayElement([undefined, generateDisplayType()]),
    pointSize: random.arrayElement([undefined, random.number({ min: 1, max: 100 })])
  };
}

function generateDataSegments(): WeavessTypes.DataSegment[] {
  const dataSegments: WeavessTypes.DataSegment[] = [];
  for (let i = 0; i < random.number({ min: 10, max: 100 }); i += 1) {
    dataSegments.push(generateDataSegment());
  }
  return dataSegments;
}

function generateChannelSegment(): WeavessTypes.ChannelSegment {
  const csd = {
    channel: {
      name: 'LabelChannelId',
      effectiveAt: 1610000000
    },
    startTime: 1610000000,
    endTime: 1610001000,
    creationTime: 1610000000
  };
  return {
    configuredInputName: JSON.stringify(csd),
    channelName: 'LabelChannel',
    wfFilterId: WeavessTypes.UNFILTERED,
    isSelected: false,
    description: random.arrayElement([undefined, hacker.phrase()]),
    descriptionLabelColor: random.arrayElement([undefined, internet.color()]),

    dataSegments: generateDataSegments()
  };
}

function generateChannelSegments(): Record<string, WeavessTypes.ChannelSegment[]> {
  const channelSegmentsRecord: Record<string, WeavessTypes.ChannelSegment[]> = {};

  for (let i = 0; i < random.number({ min: 1, max: 3 }); i += 1) {
    channelSegmentsRecord[random.uuid()] = [generateChannelSegment()];
  }
  return channelSegmentsRecord;
}

function generateChannelConfig(): WeavessTypes.Channel {
  return {
    id: random.uuid(),
    name: 'ABC',
    channelType: undefined,
    isSelected: false,
    waveform: {
      channelSegmentId: random.uuid(),
      channelSegmentsRecord: generateChannelSegments(),
      masks: undefined,
      signalDetections: undefined,
      theoreticalPhaseWindows: undefined
    }
  };
}

function generateLabelProps(): WeavessTypes.LabelProps {
  const channel = generateChannelConfig();
  return {
    channel,
    channelName: channel.id,
    isDefaultChannel: true,
    isMeasureWindow: false,
    isExpandable: true,
    expanded: false,
    yAxisBounds: {
      waveformYAxisBounds: {
        heightInPercentage: 50,
        minAmplitude: random.number({ min: 10, max: 50 }),
        maxAmplitude: random.number({ min: 150, max: 200 })
      }
    },
    showMaskIndicator: false,
    distance: random.number({ min: 50, max: 1000 }),
    azimuth: random.number({ min: 50, max: 1000 }),
    // assumption for this is that element name and element value are identical (case-sensitive)
    distanceUnits: WeavessTypes.DistanceUnits[random.objectElement(WeavessTypes.DistanceUnits)],
    events: {
      onContextMenu
    }
  };
}

const mockChannelLabelClick = jest.fn();

const mockOnChannelExpanded = jest.fn();

const mockOnChannelCollapsed = jest.fn();

function generateUpdatedLabelEvents(): {
  onChannelExpanded: any;
  onChannelCollapsed: any;
  onChannelLabelClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, channelId: string) => void;
} {
  return {
    onChannelExpanded: mockOnChannelExpanded,
    onChannelCollapsed: mockOnChannelCollapsed,
    onChannelLabelClick: mockChannelLabelClick
  };
}

describe('Label Tests', () => {
  afterEach(() => {
    mockChannelLabelClick.mockReset();
    mockOnChannelExpanded.mockReset();
    mockOnChannelCollapsed.mockReset();
  });

  test('should be clickable', () => {
    labelProps = generateLabelProps();

    labelProps.distanceUnits = WeavessTypes.DistanceUnits.km;
    labelProps.distance = 555.557;

    // labelProps.selectedChannels = ['730b69ba-2721-48b8-aa4d-7bb95b65a553'];
    labelProps.events = generateUpdatedLabelEvents();

    const result = render(<Label {...labelProps} />);

    expect(result?.container?.querySelector('.label')?.classList).not.toContain('is-selected');

    fireEvent.click(result.getByText('ABC'));

    expect(mockChannelLabelClick).toHaveBeenCalled();
  });

  test('should be able to expand', () => {
    labelProps = generateLabelProps();

    labelProps.distanceUnits = WeavessTypes.DistanceUnits.km;
    labelProps.distance = 555.557;

    labelProps.events = generateUpdatedLabelEvents();

    const result = render(<Label {...labelProps} />);

    fireEvent.click(result.getByText('+'));

    expect(mockOnChannelExpanded).toHaveBeenCalled();
  });

  test('should be able to collapse', () => {
    labelProps = generateLabelProps();

    labelProps.distanceUnits = WeavessTypes.DistanceUnits.km;
    labelProps.distance = 555.557;

    labelProps.expanded = true;
    labelProps.events = generateUpdatedLabelEvents();

    const result = render(<Label {...labelProps} />);

    fireEvent.click(result.getByText('-'));

    expect(mockOnChannelCollapsed).toHaveBeenCalled();
  });

  test('should be able invoke context menu', () => {
    labelProps = generateLabelProps();
    labelProps.events = generateUpdatedLabelEvents();

    const mockOnContextMenu = jest.fn();
    labelProps.events.onContextMenu = mockOnContextMenu;

    const result = render(<Label {...labelProps} />);

    fireEvent.contextMenu(result.getByText('ABC'), { button: 2 });

    expect(mockChannelLabelClick).not.toHaveBeenCalled();
    expect(mockOnContextMenu).toHaveBeenCalled();
  });

  describe('Split mode', () => {
    it('should say CHOOSE WAVEFORM on the default channel when in split mode', () => {
      labelProps = generateLabelProps();
      labelProps.channel.splitChannelTime = 1610000000;
      labelProps.channel.splitChannelPhase = 'Pg';
      if (labelProps.channel.waveform)
        labelProps.channel.waveform.signalDetections = [
          {
            id: `sd`,
            timeSecs: 1610000500,
            color: 'red',
            label: 'Pg',
            filter: 'brightness(1)',
            isConflicted: false,
            uncertaintySecs: 1.5,
            showUncertaintyBars: true,
            isSelected: true,
            isActionTarget: false,
            isDraggable: true
          }
        ];
      labelProps.customLabel = undefined;
      const { container } = render(<Label {...labelProps} isDefaultChannel />);
      expect(getByText(container, 'CHOOSE WAVEFORM')).toBeDefined();
    });
    it('should have a phase name in the phase description when given a signal detection of that phase with different phases', () => {
      labelProps = generateLabelProps();
      labelProps.channel.splitChannelTime = 1610000000;
      labelProps.channel.splitChannelPhase = 'Pg';
      if (labelProps.channel.waveform)
        labelProps.channel.waveform.signalDetections = [
          {
            id: `sd`,
            timeSecs: 1610000500,
            color: 'red',
            label: 'Pg',
            filter: 'brightness(1)',
            isConflicted: false,
            uncertaintySecs: 1.5,
            showUncertaintyBars: true,
            isSelected: true,
            isActionTarget: false,
            isDraggable: true
          }
        ];
      labelProps.customLabel = undefined;
      const { container } = render(
        <>
          <Label {...labelProps} isDefaultChannel />
          <Label {...labelProps} isDefaultChannel={false} />
        </>
      );
      expect(getByText(container, '/Pg')).toBeDefined();
    });
    it('should have a phase name in the phase description when given two signal detections of the same phase', () => {
      labelProps = generateLabelProps();
      labelProps.channel.splitChannelTime = 1610000000;
      labelProps.channel.splitChannelPhase = 'Pg';
      if (labelProps.channel.waveform)
        labelProps.channel.waveform.signalDetections = [
          {
            id: `sd1`,
            timeSecs: 1610000500,
            color: 'red',
            label: 'Pg',
            filter: 'brightness(1)',
            isConflicted: false,
            uncertaintySecs: 1.5,
            showUncertaintyBars: true,
            isSelected: true,
            isActionTarget: false,
            isDraggable: true
          },
          {
            id: `sd2`,
            timeSecs: 1610000500,
            color: 'red',
            label: 'Pg',
            filter: 'brightness(1)',
            isConflicted: false,
            uncertaintySecs: 1.5,
            showUncertaintyBars: true,
            isSelected: true,
            isActionTarget: false,
            isDraggable: true
          }
        ];
      labelProps.customLabel = undefined;
      const { container } = render(
        <>
          <Label {...labelProps} isDefaultChannel />
          <Label {...labelProps} isDefaultChannel={false} />
        </>
      );
      expect(getByText(container, '/Pg')).toBeDefined();
    });
    it('should have an asterisk in the phase description when given two signal detections of different phases', () => {
      labelProps = generateLabelProps();
      labelProps.channel.splitChannelTime = 1610000000;
      labelProps.channel.splitChannelPhase = 'Pg';
      if (labelProps.channel.waveform)
        labelProps.channel.waveform.signalDetections = [
          {
            id: `sd1`,
            timeSecs: 1610000500,
            color: 'red',
            label: 'Pg',
            filter: 'brightness(1)',
            isConflicted: false,
            uncertaintySecs: 1.5,
            showUncertaintyBars: true,
            isSelected: true,
            isActionTarget: false,
            isDraggable: true
          },
          {
            id: `sd2`,
            timeSecs: 1610000500,
            color: 'red',
            label: 'PP',
            filter: 'brightness(1)',
            isConflicted: false,
            uncertaintySecs: 1.5,
            showUncertaintyBars: true,
            isSelected: true,
            isActionTarget: false,
            isDraggable: true
          }
        ];
      labelProps.customLabel = undefined;
      const { container } = render(
        <>
          <Label {...labelProps} isDefaultChannel />
          <Label {...labelProps} isDefaultChannel={false} />
        </>
      );
      expect(getByText(container, '/*')).toBeDefined();
    });
  });
});
