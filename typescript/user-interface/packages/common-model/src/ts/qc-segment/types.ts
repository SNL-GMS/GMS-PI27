import type { ChannelSegmentDescriptor } from '../channel-segment/types';
import type { EntityReference, Faceted, VersionReference } from '../faceted';
import type { WorkflowDefinitionId } from '../workflow/types';

export enum QcSegmentType {
  AGGREGATE = 'AGGREGATE',
  CALIBRATION = 'CALIBRATION',
  FLAT = 'FLAT',
  GAP = 'GAP',
  NOISY = 'NOISY',
  SENSOR_PROBLEM = 'SENSOR_PROBLEM',
  SPIKE = 'SPIKE',
  STATION_PROBLEM = 'STATION_PROBLEM',
  STATION_SECURITY = 'STATION_SECURITY',
  TIMING = 'TIMING'
}

export enum QcSegmentCategory {
  ANALYST_DEFINED = 'ANALYST_DEFINED',
  DATA_AUTHENTICATION = 'DATA_AUTHENTICATION',
  STATION_SOH = 'STATION_SOH',
  WAVEFORM = 'WAVEFORM',
  LONG_TERM = 'LONG_TERM',
  UNPROCESSED = 'UNPROCESSED'
}

export interface QcSegment {
  readonly id: string;
  readonly channel: EntityReference<'name'>;
  readonly versionHistory: QcSegmentVersion[];
}

export interface QcSegmentVersion {
  readonly id: QcSegmentVersionId;
  readonly startTime: number;
  readonly endTime: number;
  readonly createdBy: string;
  readonly rejected: boolean;
  readonly rationale: string;
  readonly type?: QcSegmentType;
  /** Faceted<ChannelSegment<Timeseries>> that only contains an id of ChannelSegmentDescriptors */
  readonly discoveredOn?: Faceted<{
    readonly id: ChannelSegmentDescriptor;
  }>[];
  readonly stageId?: WorkflowDefinitionId;
  readonly category?: QcSegmentCategory;
  readonly channels: VersionReference<'name'>[];
}

export interface QcSegmentVersionId {
  readonly parentQcSegmentId: string;
  readonly effectiveAt: number;
}
