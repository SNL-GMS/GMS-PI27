import type { FilterTypes } from '@gms/common-model';
import { UNFILTERED_FILTER } from '@gms/common-model/lib/filter/types';

/**
 * Creates/Returns an unfiltered waveform filter
 */
export function createUnfilteredWaveformFilter(): FilterTypes.Filter {
  return UNFILTERED_FILTER;
}
