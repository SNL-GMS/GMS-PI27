import type { FkTypes } from '@gms/common-model';
import { defaultSpectraTemplate } from '@gms/ui-state/__tests__/__data__';

export const fkInput: FkTypes.FkInputWithConfiguration = {
  signalDetectionId: '012de1b9-8ae3-3fd4-800d-58665c3152cc',
  fkComputeInput: {
    phaseType: 'P',
    lowFrequency: 0.5,
    highFrequency: 2.0,
    sampleRate: 40,
    sampleCount: 604,
    useChannelVerticalOffset: false,
    normalizeWaveforms: true,
    startTime: 1675874304.406,
    channels: [
      { name: 'ARCES.ARA0.BHE' },
      { name: 'ARCES.ARA0.BHN' },
      { name: 'ARCES.ARA0.BHZ' },
      { name: 'ARCES.ARA1.BHE' },
      { name: 'ARCES.ARA1.BHN' }
    ],
    windowLead: 'PT1S',
    windowLength: 'PT5S',
    slowCountX: 25,
    slowCountY: 25,
    slowStartX: -0.008993216059187304,
    slowStartY: -0.008993216059187304,
    slowDeltaX: 0.01798643211837461,
    slowDeltaY: 0.01798643211837461
  },
  configuration: defaultSpectraTemplate,
  isThumbnailRequest: false
};
