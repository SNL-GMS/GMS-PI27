import type { Units } from '../common/types';
import type { EntityReference, VersionReference } from '../faceted';
import type { FilterDefinition } from '../filter';
import type { QcSegmentVersion } from '../qc-segment';
import type { Channel } from '../station-definitions/channel-definitions/channel-definitions';
import type { ToUITime } from '../time';

/**
 * Channel Segment Descriptor contains Channel and start, end and creation times of channel segment
 * (this replaces ChannelSegment Id in FeatureMeasurement)
 */
export interface ChannelSegmentDescriptor {
  readonly channel: VersionReference<'name', Channel> | Channel;
  readonly startTime: number;
  readonly endTime: number;
  readonly creationTime: number;
}

export enum TimeseriesType {
  WAVEFORM = 'WAVEFORM',
  FK_SPECTRA = 'FK_SPECTRA',
  DETECTION_FEATURE_MAP = 'DETECTION_FEATURE_MAP',
  // TODO: Remove after FK wasm is implemented
  FK_SPECTRA_OLD = 'FK_SPECTRA_OLD'
}

export enum ProcessingOperation {
  AMPLITUDE_MEASUREMENT_BEAM = 'AMPLITUDE_MEASUREMENT_BEAM',
  DISPLAY_FILTER = 'DISPLAY_FILTER',
  EVENT_BEAM = 'EVENT_BEAM',
  FK_BEAM = 'FK_BEAM',
  FK_SPECTRA = 'FK_SPECTRA',
  ROTATION = 'ROTATION',
  SIGNAL_DETECTION_BEAM = 'SIGNAL_DETECTION_BEAM',
  SPECTROGRAM = 'SPECTROGRAM',
  VIRTUAL_BEAM = 'VIRTUAL_BEAM'
}

/**
 * Represents a mask that has been applied to the channel segment
 */
export interface ProcessingMask {
  /**
   * UUID string
   */
  id: string;

  /**
   * effective at time
   */
  effectiveAt: number;

  /**
   * mask start time
   */
  startTime: number;

  /**
   * mask end time
   */
  endTime: number;

  /**
   * entity reference for the channel applied too
   */
  appliedToRawChannel: EntityReference<'name', Channel>;

  /**
   * Processing operation type
   */
  processingOperation: ProcessingOperation;

  /**
   * List of qc segments covered by the processing mask
   */
  maskedQcSegmentVersions: QcSegmentVersion[];
}

/**
 * A base interface for time series data should be extended to include time series data.
 */
export interface Timeseries {
  /**
   * The type of data contained in this time series.
   */
  type: TimeseriesType;
  /**
   * The time corresponding to the first point in the time series, measured in seconds since the Linux epoch.
   */
  startTime: number;
  /**
   * The time corresponding to the last point in the time series, measured in seconds since the Linux epoch.
   */
  endTime: number;
  /**
   * The sample rate of the time series, in Hz.
   */
  sampleRateHz: number;
  /**
   * The number of samples expected to be in the time series.
   */
  sampleCount: number;
}

/**
 * A map representing a {@link Channel} {@link EntityReference} (key) to the TimeRanges (value) it was unavailable.
 */
export interface TimeRangesByChannel {
  /** Missing {@link Channel} {@link EntityReference} */
  readonly channel: EntityReference<'name', Channel>;

  /** Time ranges when channel was unavailable */
  readonly timeRanges: ToUITime<{
    /* instance date/time converted to epoch seconds via transformer */
    startTime: string;
    /* instance date/time converted to epoch seconds via transformer */
    endTime: string;
  }>[];
}

/**
 * Represents a subset of data of a single channel segment type from a raw channel or derived channel. Can include many time series but all must be of the same type.
 */
export interface ChannelSegment<T extends Timeseries> {
  /**
   * Channel Segment Description
   */
  id: ChannelSegmentDescriptor;

  /**
   * Units of the channel segment time series data
   */
  units: Units;

  /**
   * The type of time series in this segment.
   */
  timeseriesType: TimeseriesType;

  /**
   * The time series data that constitutes this channel segment.
   */
  timeseries: T[];

  /**
   * The processing masks that have been applied to the channel segment
   */
  maskedBy: ProcessingMask[];

  /**
   * The channels which did not contribute to the channel segment
   */
  missingInputChannels: TimeRangesByChannel[];

  /**
   * Filter name default is 'UNFILTERED'
   */
  _uiFilterId?: string;

  /**
   * Filters used to filter the timeseries
   */
  _uiFiltersBySampleRate?: Record<number, FilterDefinition>;

  /**
   * Configured input used to create this channel segment
   */
  _uiConfiguredInput?: ChannelSegmentDescriptor;
}

export interface ChannelSegmentFaceted {
  /**
   * Channel Segment Description
   */
  id: ChannelSegmentDescriptor;
}
