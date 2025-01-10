package gms.shared.stationdefinition.coi.channel;

/**
 * Represents the type of processing metadata values that can appear as keys in the {@link
 * Channel#getProcessingMetadata()} map.
 */
public enum ChannelProcessingMetadataType {

  // General properties
  BRIDGED,
  CHANNEL_GROUP,

  // Filtering properties
  FILTER_CAUSALITY,
  FILTER_GROUP_DELAY,
  FILTER_HIGH_FREQUENCY_HZ,
  FILTER_LOW_FREQUENCY_HZ,
  FILTER_PASS_BAND_TYPE,
  FILTER_TYPE,

  // Channel steering properties (used in beaming, rotation)
  STEERING_BACK_AZIMUTH,
  STEERING_SLOWNESS,

  // Beaming properties
  BEAM_SUMMATION,
  BEAM_TYPE,
  BEAM_LOCATION,
  BEAM_PHASE,
  BEAM_EVENT_HYPOTHESIS_ID,
  BEAM_SIGNAL_DETECTION_HYPOTHESIS_ID,
}
