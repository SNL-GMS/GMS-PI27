/* eslint-disable react/destructuring-assignment */
import { NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { WeavessTypes } from '@gms/weavess-core';
import * as React from 'react';

import { WeavessWaveformPanel } from '../../weavess-waveform-panel';
import type { MeasureWindowProps } from './types';

const HEIGHT_OF_X_AXIS_PX = 55;

const useMeasureWindowEvents = (
  events: WeavessTypes.Events,
  measureWindowSelection: WeavessTypes.MeasureWindowSelection | undefined
) => {
  return React.useMemo(
    () => ({
      ...events,
      stationEvents: {
        defaultChannelEvents: measureWindowSelection?.isDefaultChannel
          ? events?.stationEvents?.defaultChannelEvents
          : events?.stationEvents?.nonDefaultChannelEvents
      }
    }),
    [events, measureWindowSelection]
  );
};

const useMeasureWindowInitialConfig = (
  initialConfiguration: WeavessTypes.Configuration,
  measureWindowSelection: WeavessTypes.MeasureWindowSelection | undefined
) => {
  return React.useMemo(
    () => ({
      ...initialConfiguration,
      defaultChannel: {
        disableMeasureWindow: true,
        disableMaskModification: measureWindowSelection?.isDefaultChannel
          ? initialConfiguration?.defaultChannel?.disableMaskModification
          : initialConfiguration?.nonDefaultChannel?.disableMaskModification
      }
    }),
    [initialConfiguration, measureWindowSelection]
  );
};

const useMeasureWindowStations = (
  measureWindowSelection: WeavessTypes.MeasureWindowSelection | undefined,
  measureWindowHeightPx: number
) =>
  React.useMemo(
    () =>
      measureWindowSelection
        ? [
            {
              id: measureWindowSelection?.stationId,
              name: measureWindowSelection?.stationId,
              defaultChannel: {
                ...measureWindowSelection?.channel,
                timeOffsetSeconds: 0, // always show true time in the measure window
                height: measureWindowHeightPx - HEIGHT_OF_X_AXIS_PX
              }
            }
          ]
        : [],
    [measureWindowSelection, measureWindowHeightPx]
  );

/**
 * If given a getBoundaries function, returns a function with the same signature, but that is
 * modified to be for the measure window.
 *
 * @param getBoundaries the getBoundaries function to modify so it applies to the measure window
 * @returns a getBoundariesFunction modified to inject the isMeasureWindow parameter, or undefined if no getBoundaries function was provided
 */
const useGetBoundariesForMeasureWindow = (
  getBoundaries?: (
    channelName: string,
    channelSegment: WeavessTypes.ChannelSegment,
    timeRange?: WeavessTypes.TimeRange,
    isMeasureWindow?: boolean | undefined
  ) => Promise<WeavessTypes.ChannelSegmentBoundaries | undefined>
) => {
  const getBoundariesForMeasureWindow = React.useCallback(
    async (
      channelName: string,
      channelSegment: WeavessTypes.ChannelSegment,
      timeRange?: WeavessTypes.TimeRange | undefined
    ) => {
      if (!getBoundaries) {
        throw new Error(
          'Cannot call getBoundaries when function is not provided. This may be a bug.'
        );
      }
      return getBoundaries(channelName, channelSegment, timeRange, true);
    },
    [getBoundaries]
  );
  return getBoundaries ? getBoundariesForMeasureWindow : undefined;
};

function MeasureWindow(props: MeasureWindowProps) {
  const {
    events,
    setMeasureWindowRef,
    measureWindowSelection,
    initialConfiguration,
    measureWindowHeightPx,
    activeSplitModeType
  } = props;
  const measureWindowEvents = useMeasureWindowEvents(events, measureWindowSelection);
  const initialMeasureWindowConfig = useMeasureWindowInitialConfig(
    initialConfiguration,
    measureWindowSelection
  );

  const measureWindowStations = useMeasureWindowStations(
    measureWindowSelection,
    measureWindowHeightPx
  );

  // We want the same unbound method so we can use it as a dependency in the new function creation.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const getBoundariesForMeasureWindow = useGetBoundariesForMeasureWindow(props.getBoundaries);
  if (measureWindowSelection) {
    return (
      <WeavessWaveformPanel
        ref={setMeasureWindowRef}
        key={measureWindowSelection.channel.id}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        activeSplitModeType={activeSplitModeType}
        getBoundaries={getBoundariesForMeasureWindow}
        events={measureWindowEvents}
        initialConfiguration={initialMeasureWindowConfig}
        stations={measureWindowStations}
        displayInterval={{
          startTimeSecs: measureWindowSelection.startTimeSecs,
          endTimeSecs: measureWindowSelection.endTimeSecs
        }}
        msrWindowWaveformAmplitudeScaleFactor={measureWindowSelection.waveformAmplitudeScaleFactor}
      />
    );
  }
  return (
    <NonIdealState icon={IconNames.TIMELINE_LINE_CHART} title="No measure window data selected" />
  );
}

export const MemoizedMeasureWindow = React.memo(MeasureWindow);
