export const beamformingConfigurationErrorCodes = [
  'beamforming-invalid-beamforming-template',
  'beamforming-minimum-number-of-channels'
] as const;

export type BeamformingConfigurationErrorCodes =
  (typeof beamformingConfigurationErrorCodes)[number];

export const beamformingProcessingErrorCodes = [
  'beamforming-invalid-interval-id',
  'beamforming-invalid-time-range',
  'beamforming-invalid-event-hypothesis',
  'beamforming-invalid-feature-predictions',
  'beamforming-invalid-arrival-time',
  'beamforming-invalid-azimuth',
  'beamforming-invalid-slowness',
  'beamforming-invalid-station',
  'beamforming-invalid-channels',
  'beamforming-invalid-channels-to-stations',
  'beamforming-invalid-waveform-data',
  'beamforming-filter-error',
  'beamforming-algorithm-error',
  'beamforming-error',
  'beamforming-unknown'
] as const;

export const beamformingErrorCodes = [
  ...beamformingConfigurationErrorCodes,
  ...beamformingProcessingErrorCodes
] as const;

export type BeamformingProcessingErrorCodes = (typeof beamformingProcessingErrorCodes)[number];

export type BeamformingErrorCodes =
  | BeamformingConfigurationErrorCodes
  | BeamformingProcessingErrorCodes;
