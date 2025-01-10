package gms.shared.stationdefinition.coi.qc;

import java.util.Arrays;

/** */
public enum ProcessingOperation {
  AMPLITUDE_MEASUREMENT_BEAM,
  DISPLAY_FILTER,
  EVENT_BEAM,
  FK_BEAM,
  FK_SPECTRA,
  ROTATION,
  SIGNAL_DETECTION_BEAM,
  SPECTROGRAM,
  VIRTUAL_BEAM;

  /**
   * Validates the String matches a {@link ProcessingOperation} enum
   *
   * @param operation String to validate
   * @return True if the string matches a valid enum, false otherwise
   */
  public static boolean containsOperation(String operation) {
    return Arrays.stream(ProcessingOperation.values()).anyMatch(op -> op.name().equals(operation));
  }
}
