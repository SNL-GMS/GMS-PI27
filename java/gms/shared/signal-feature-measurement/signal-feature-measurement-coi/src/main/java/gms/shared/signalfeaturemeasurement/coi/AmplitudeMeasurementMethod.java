package gms.shared.signalfeaturemeasurement.coi;

/** Describes how the amplitude in a {@link AmplitudeMeasurementDefinition} is measured */
public enum AmplitudeMeasurementMethod {
  // The waveform maximum sample amplitude difference between any adjacent local peak and local
  // trough in the measurement window.
  MAX_PEAK_TO_TROUGH,
  // The waveform maximum sample amplitude difference between zero and the maximum peak or trough in
  // the measurement window.
  MAX_ZERO_TO_PEAK,
  // The measured amplitude is the RMS of the waveform samples in the measurement window.
  ROOT_MEAN_SQUARE
}
