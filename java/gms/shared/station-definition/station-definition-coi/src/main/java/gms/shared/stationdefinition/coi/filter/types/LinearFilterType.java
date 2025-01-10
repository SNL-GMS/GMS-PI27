package gms.shared.stationdefinition.coi.filter.types;

/** Enumeration of all valid linear filter types */
public enum LinearFilterType {
  FIR_HAMMING("H"),
  IIR_BUTTERWORTH("B"),
  FIR_OTHER("FIR_Other"),
  IIR_OTHER("IIR_Other");

  private final String value;

  LinearFilterType(String value) {
    this.value = value;
  }

  /**
   * Get the string representation of a {@link FilterType}
   *
   * @return The string representation of this {@link FilterType}
   */
  public String getValue() {
    return value;
  }

  /**
   * Convert provided string into a {@link LinearFilterType} if the input maps to a valid type
   *
   * @param value String representation of the desired {@link LinearFilterType}
   * @return The {@link LinearFilterType} associated with the provided value
   * @throws IllegalArgumentException if the provided string does not map to a valid {@link
   *     LinearFilterType}
   */
  public static LinearFilterType fromString(String value) {
    for (LinearFilterType ft : LinearFilterType.values()) {
      if (ft.value.equals(value)) {
        return ft;
      }
    }
    throw new IllegalArgumentException(
        String.format("String value %s does not map to a LinearFilterType enumeration.", value));
  }

  public static boolean containsValue(String value) {
    for (LinearFilterType ft : LinearFilterType.values()) {
      if (ft.value.equals(value)) {
        return true;
      }
    }
    return false;
  }
}
