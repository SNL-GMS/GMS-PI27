package gms.shared.stationdefinition.coi.filter.types;

/** Enumeration of all valid filter types */
public enum FilterType {
  AUTOREGRESSIVE("AR"),
  CASCADE("C"),
  LINEAR("L"),
  PHASE_MATCH("PM");

  private final String value;

  FilterType(String value) {
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
   * Convert provided string into a {@link FilterType} if the input maps to a valid type
   *
   * @param value String representation of the desired {@link FilterType}
   * @return The {@link FilterType} associated with the provided value
   * @throws IllegalArgumentException if the provided string does not map to a valid {@link
   *     FilterType}
   */
  public static FilterType fromString(String value) {
    for (FilterType ft : FilterType.values()) {
      if (ft.value.equals(value)) {
        return ft;
      }
    }
    throw new IllegalArgumentException(
        String.format("String value %s does not map to a FilterType enumeration.", value));
  }

  public static boolean containsValue(String value) {
    for (FilterType ft : FilterType.values()) {
      if (ft.value.equals(value)) {
        return true;
      }
    }
    return false;
  }
}
