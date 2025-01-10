import type { QcSegment, QcSegmentVersion } from '../../../src/ts/qc-segment/types';
import { QcSegmentCategory, QcSegmentType } from '../../../src/ts/qc-segment/types';
import { akasgBHEChannel, akasgBHNChannel, PD01Channel, PD02Channel } from '../station-definitions';

export const qcSegmentVersion: QcSegmentVersion = {
  id: { parentQcSegmentId: 'qcSegmentTestId', effectiveAt: 0 },
  startTime: 1636503404,
  endTime: 1636503704,
  createdBy: 'User 1',
  rejected: false,
  rationale: '',
  type: QcSegmentType.AGGREGATE,
  discoveredOn: undefined,
  stageId: undefined,
  category: QcSegmentCategory.ANALYST_DEFINED,
  channels: [PD01Channel].map(c => ({ name: c.name, effectiveAt: c.effectiveAt }))
};

export const qcSegment: QcSegment = {
  id: 'qcSegmentTestId',
  channel: PD01Channel,
  versionHistory: [qcSegmentVersion]
};

export const qcSegment2Version: QcSegmentVersion = {
  id: { parentQcSegmentId: 'qcSegment2TestId', effectiveAt: 0 },
  startTime: 0,
  endTime: 100,
  createdBy: 'User 1',
  rejected: false,
  rationale: '',
  type: QcSegmentType.AGGREGATE,
  discoveredOn: undefined,
  stageId: undefined,
  category: QcSegmentCategory.UNPROCESSED,
  channels: [PD01Channel].map(c => ({ name: c.name, effectiveAt: c.effectiveAt }))
};

export const qcSegment2: QcSegment = {
  id: 'qcSegment2TestId',
  channel: PD01Channel,
  versionHistory: [qcSegment2Version]
};

export const qcSegment3Version: QcSegmentVersion = {
  id: { parentQcSegmentId: 'qcSegment3TestId', effectiveAt: 0 },
  startTime: 0,
  endTime: 100,
  createdBy: 'User 1',
  rejected: false,
  rationale: '',
  type: QcSegmentType.AGGREGATE,
  discoveredOn: undefined,
  stageId: undefined,
  category: QcSegmentCategory.UNPROCESSED,
  channels: [PD01Channel].map(c => ({ name: c.name, effectiveAt: c.effectiveAt }))
};

export const qcSegment3Version2: QcSegmentVersion = {
  id: { parentQcSegmentId: 'qcSegment3TestId', effectiveAt: 0 },
  startTime: 0,
  endTime: 100,
  createdBy: 'User 1',
  rejected: false,
  rationale: '',
  type: QcSegmentType.AGGREGATE,
  discoveredOn: undefined,
  stageId: undefined,
  category: QcSegmentCategory.ANALYST_DEFINED,
  channels: [PD01Channel].map(c => ({ name: c.name, effectiveAt: c.effectiveAt }))
};

export const qcSegment4Version: QcSegmentVersion = {
  id: { parentQcSegmentId: 'qcSegment4TestId', effectiveAt: 0 },
  startTime: 0,
  endTime: 100,
  createdBy: 'User 1',
  rejected: true,
  rationale: '',
  type: undefined,
  discoveredOn: undefined,
  stageId: undefined,
  category: undefined,
  channels: [PD01Channel].map(c => ({ name: c.name, effectiveAt: c.effectiveAt }))
};

export const qcSegment3: QcSegment = {
  id: 'qcSegment3TestId',
  channel: PD02Channel,
  versionHistory: [qcSegment3Version, qcSegment3Version2]
};

export const qcSegment4: QcSegment = {
  id: 'qcSegment4TestId',
  channel: PD02Channel,
  versionHistory: [qcSegment4Version]
};

export const qcSegmentsByChannelName: Record<string, Record<string, QcSegment>> = {
  [PD01Channel.name]: { [qcSegment.id]: qcSegment, [qcSegment2.id]: qcSegment2 },
  [PD02Channel.name]: { [qcSegment3.id]: qcSegment3, [qcSegment4.id]: qcSegment4 }
};

export const qcSegment5Version: QcSegmentVersion = {
  id: { parentQcSegmentId: 'qcSegment5TestId', effectiveAt: 0 },
  startTime: 100,
  endTime: 200,
  createdBy: 'User 1',
  rejected: false,
  rationale: '',
  type: QcSegmentType.AGGREGATE,
  discoveredOn: undefined,
  stageId: undefined,
  category: QcSegmentCategory.ANALYST_DEFINED,
  channels: [PD01Channel].map(c => ({ name: c.name, effectiveAt: c.effectiveAt }))
};

export const qcSegment6Version: QcSegmentVersion = {
  id: { parentQcSegmentId: 'qcSegment5TestId', effectiveAt: 0 },
  startTime: 1000,
  endTime: 2000,
  createdBy: 'User 1',
  rejected: false,
  rationale: '',
  type: QcSegmentType.AGGREGATE,
  discoveredOn: undefined,
  stageId: undefined,
  category: QcSegmentCategory.ANALYST_DEFINED,
  channels: [PD01Channel].map(c => ({ name: c.name, effectiveAt: c.effectiveAt }))
};

export const qcSegmentAkasgBHEVersion: QcSegmentVersion = {
  id: { parentQcSegmentId: 'qcSegmentAkasgBHETestId', effectiveAt: akasgBHEChannel.effectiveAt },
  startTime: 100,
  endTime: 200,
  createdBy: 'User 1',
  rejected: false,
  rationale: '',
  type: QcSegmentType.AGGREGATE,
  discoveredOn: undefined,
  stageId: undefined,
  category: QcSegmentCategory.WAVEFORM,
  channels: [akasgBHEChannel].map(c => ({ name: c.name, effectiveAt: c.effectiveAt }))
};

export const qcSegmentAkasgBHNVersion: QcSegmentVersion = {
  id: { parentQcSegmentId: 'qcSegmentAkasgBHETestId', effectiveAt: akasgBHNChannel.effectiveAt },
  startTime: 100,
  endTime: 200,
  createdBy: 'User 1',
  rejected: false,
  rationale: '',
  type: QcSegmentType.AGGREGATE,
  discoveredOn: undefined,
  stageId: undefined,
  category: QcSegmentCategory.ANALYST_DEFINED,
  channels: [akasgBHNChannel].map(c => ({ name: c.name, effectiveAt: c.effectiveAt }))
};

export const qcSegmentAkasgBHE: QcSegment = {
  channel: akasgBHEChannel,
  id: 'qcSegmentAkasgBHETestId',
  versionHistory: [qcSegmentAkasgBHEVersion]
};

export const qcSegmentAkasgBHN: QcSegment = {
  channel: akasgBHNChannel,
  id: 'qcSegmentAkasgBHNTestId',
  versionHistory: [qcSegmentAkasgBHNVersion]
};
