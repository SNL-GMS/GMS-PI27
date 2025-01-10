import { Tooltip } from '@blueprintjs/core';
import type { DistanceUnits } from '@gms/weavess-core/lib/types';
import classNames from 'classnames';
import React from 'react';

import { DistanceAzimuth } from './distance-azimuth';

export interface ChooseWaveformRowProps {
  isDefaultChannel: boolean;
  isSplitChannel: boolean;
}

export interface ChannelNameRowProps {
  isSplitChannel: boolean;
  channelLabel?: string;
  channelLabelTooltip?: string;
  channelName: string | JSX.Element;
  phaseLabel: string | undefined;
  phaseColor: string | undefined;
  isDefaultChannel: boolean;
  tooltipText?: string;
}
export interface PhaseLabelProps {
  phaseLabel: string;
  phaseColor: string | undefined;
  tooltipText?: string;
}

export interface AzimuthMaskRowProps {
  maskIndicator: string | null;
  azimuth: number;
  distance: number;
  distanceUnits: DistanceUnits;
}

export interface LabelHeaderRowProps {
  labelHeader: string | JSX.Element;
}

export interface FKRowProps {
  id: string;
}

/**
 * Special formatting for FK channel label rows
 *
 * @param props uses ID to determine FK type
 * @returns name row for FK plots
 */
export const FKNameRow = React.memo(function FKNameRow(props: FKRowProps) {
  const { id } = props;
  if (id === 'Slowness') {
    return (
      <div style={{ whiteSpace: 'nowrap' }}>
        Slowness (<sup>s</sup>
        &#8725;
        <sub>&deg;</sub>)
      </div>
    );
  }
  if (id === 'Azimuth') {
    return (
      <div style={{ whiteSpace: 'nowrap' }}>
        Azimuth <sup>(&deg;)</sup>
      </div>
    );
  }
  return null;
});

const PhaseLabel = React.memo(function PhaseLabel({
  tooltipText,
  phaseLabel,
  phaseColor
}: PhaseLabelProps) {
  const phaseColorStyle = {
    color: phaseColor
  };
  return tooltipText ? (
    <Tooltip content={tooltipText}>
      <span className="station-name__phase-name" style={phaseColorStyle}>
        {`/${phaseLabel}`}
      </span>
    </Tooltip>
  ) : (
    <span className="station-name__phase-name" style={phaseColorStyle}>
      {`/${phaseLabel}`}
    </span>
  );
});

/**
 * Exists only when split channel mode expansion is active, and only for Default Channels
 *
 * @param isDefaultChannel
 * @param isSplitChannel
 * @returns null when not a default channel in split channel expanded mode
 */
export const ChooseWaveformRow = React.memo(function ChooseWaveformRow(
  props: ChooseWaveformRowProps
) {
  const { isDefaultChannel, isSplitChannel } = props;
  return isSplitChannel && isDefaultChannel ? <span>CHOOSE WAVEFORM</span> : null;
});

/**
 * Includes the channel name.
 * For split non-default channels, also contains Signal Detection phase colored to match event association
 *
 * @param props
 * @returns a row for weavess channel labels
 */
export const ChannelNameRow = React.memo(function ChannelNameRow(props: ChannelNameRowProps) {
  const {
    isSplitChannel,
    channelName,
    channelLabel,
    phaseColor,
    phaseLabel,
    isDefaultChannel,
    tooltipText
  } = props;
  // For displaying labels in FK plots
  if (channelName === 'Slowness' || channelName === 'Azimuth') {
    return <FKNameRow id={channelName} />;
  }

  return (
    <div className="label-channel-name-row">
      <span
        className={classNames(
          { 'station-name__channel-name': !isDefaultChannel },
          { 'station-name': isDefaultChannel }
        )}
      >
        {channelName}
      </span>
      <span className="station-name__channel-name">&nbsp;{channelLabel}</span>
      {isSplitChannel && !isDefaultChannel && phaseLabel ? (
        <PhaseLabel tooltipText={tooltipText} phaseLabel={phaseLabel} phaseColor={phaseColor} />
      ) : null}
    </div>
  );
});

/**
 *
 * @param props Includes the Azimuth and Distance when an event is open, as well as an indicator if a mask is applied
 * @returns a row for weavess channel labels
 */
export const AzimuthMaskRow = React.memo(function AzimuthMaskRow(props: AzimuthMaskRowProps) {
  const { maskIndicator, azimuth, distance, distanceUnits } = props;
  return (
    <div className="distance-azimuth">
      <p>
        <DistanceAzimuth azimuth={azimuth} distance={distance} distanceUnits={distanceUnits} />
        <span className="label-container-content-mask-indicator">{maskIndicator}</span>
      </p>
    </div>
  );
});

/**
 * @returns simple row to display a label header
 */
export const LabelHeaderRow = React.memo(function LabelHeaderRow(props: LabelHeaderRowProps) {
  const { labelHeader } = props;

  return <div className="label-header">{labelHeader}</div>;
});
