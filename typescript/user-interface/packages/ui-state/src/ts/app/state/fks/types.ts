/**
 * Different filters that are available
 */

import type { FkTypes } from '@gms/common-model';

import type { ChannelFilterRecord } from '../../../types';

export enum FkThumbnailsFilterType {
  KEYACTIVITYPHASES = 'Key Activity Phases',
  ALL = 'All',
  OPENEVENT = 'Open Event',
  NEEDSREVIEW = 'Needs review'
}

export interface FksState {
  sdIdsToShowFk: string[];
  displayedSDMeasuredValues: FkTypes.FkMeasuredValues | undefined;
  fkPlotsExpandToolbar: boolean;
  currentFkThumbnailFilter: FkThumbnailsFilterType;
  fkChannelFilters: Record<string, ChannelFilterRecord>;
  displayedSignalDetectionId: string;
}
