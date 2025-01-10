import type { WeavessTypes } from '@gms/weavess-core';

import type { CommonStationProps } from '../../types';
import type { Channel } from './channel';

export interface ChannelProps extends CommonStationProps {
  /** The index of the channel in relation to the station */
  index: number;

  /** Height of channel */
  height: number;

  /** callback executed when closing expanded mode */
  closeSplitChannelOverlayCallback?: () => void;

  /** reference to split channels for expanded mode */
  splitChannelRefs: { [id: string]: Channel | null };

  /** true if waveforms should be rendered; false otherwise */
  shouldRenderWaveforms: boolean;

  /** true if spectrograms should be rendered; false otherwise */
  shouldRenderSpectrograms: boolean;

  /** default min max range scale */
  defaultRange?: WeavessTypes.Range;

  /** Configuration for weavess */
  initialConfiguration: WeavessTypes.Configuration;

  /** Station Id as string */
  stationId: string;

  /** Channel configuration (Holds the Data) */
  channel: WeavessTypes.Channel;

  /** how much to offset the channel (used in mouse callbacks) */
  offsetSecs: number;

  /** Boolean is default channel */
  isDefaultChannel: boolean;

  /** Does have sub channels */
  isExpandable: boolean;

  /** Are we in split channel mode, which denotes a special state */
  isSplitChannelOverlayOpen: boolean;

  /** A flag to determine if we are a channel of the split station */
  isSplitStation?: boolean;

  /** Displaying sub channels */
  expanded: boolean;

  /** Toggles red M when mask(s) is in view */
  showMaskIndicator: boolean;

  /** true if parent station's channels are targeted for qc mask creation */
  isStationMaskTarget?: boolean;

  /** Distance */
  distance: number;

  /** Distance units */
  distanceUnits: WeavessTypes.DistanceUnits;

  /** Azimuth */
  azimuth: number;

  /** Defines a custom component for displaying a custom label */
  customLabel?: React.FunctionComponent<WeavessTypes.LabelProps>;

  /** (optional) callback events Ex on label click */
  events?: WeavessTypes.ChannelEvents;

  /** the min boundary (x value) in gl units */
  glMin: number;

  /** the max boundary (x value) in gl units */
  glMax: number;

  /** Tooltip for the Channel Label */
  channelLabelTooltip?: string;

  splitModePickMarkerColor?: string;

  activeSplitModeType: WeavessTypes.SplitMode | undefined;

  // callbacks

  /** Ref to the html canvas element */
  canvasRef(): HTMLCanvasElement | null;

  /** gets the bounding rectangle for the canvas */
  getCanvasBoundingRect(): DOMRect;
}

export interface ChannelState {
  /** Waveform y-axis bounds */
  waveformYAxisBounds: WeavessTypes.YAxisBounds;

  /** Spectrogram y-axis bounds */
  spectrogramYAxisBounds: WeavessTypes.YAxisBounds;
}

export interface Handler<EventType> {
  test(event: EventType): boolean;
  action(event: EventType): boolean;
}
