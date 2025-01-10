import type { FilterTypes } from '@gms/common-model';
import type { FilterError } from '@gms/common-model/lib/filter';
import type { ProcessingAnalystConfiguration } from '@gms/common-model/lib/ui-configuration/types';

import type { FilterDefinitionsRecord } from '../../../../types';
import type { MaskAndBeamWaveformResult } from '../../../../workers/waveform-worker/types';
import { BeamformingError } from './beamforming-error';

export class BeamformingFilterError extends BeamformingError {
  public readonly error: FilterError | Error | string;

  public readonly maskAndBeamWaveformResult: MaskAndBeamWaveformResult | undefined;

  public readonly beamFilter: FilterTypes.Filter | undefined;

  public readonly processingAnalystConfiguration: ProcessingAnalystConfiguration | undefined;

  public readonly cachedFilterDefinitions: FilterDefinitionsRecord | undefined;

  public readonly channelFilter: FilterTypes.Filter | undefined;

  public constructor(
    error: FilterError | Error | string,
    maskAndBeamWaveformResult: MaskAndBeamWaveformResult | undefined,
    beamFilter: FilterTypes.Filter | undefined,
    processingAnalystConfiguration: ProcessingAnalystConfiguration | undefined,
    cachedFilterDefinitions: FilterDefinitionsRecord | undefined,
    channelFilter: FilterTypes.Filter | undefined
  ) {
    super(
      `Cannot create beam. Filter error: ${typeof error !== 'string' ? error.message : error}`,
      'beamforming-filter-error'
    );
    Object.setPrototypeOf(this, BeamformingError.prototype);
    this.error = error;
    this.maskAndBeamWaveformResult = maskAndBeamWaveformResult;
    this.beamFilter = beamFilter;
    this.processingAnalystConfiguration = processingAnalystConfiguration;
    this.cachedFilterDefinitions = cachedFilterDefinitions;
    this.channelFilter = channelFilter;
  }
}
