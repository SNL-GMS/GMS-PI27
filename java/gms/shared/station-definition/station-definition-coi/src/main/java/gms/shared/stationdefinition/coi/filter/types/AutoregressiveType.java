package gms.shared.stationdefinition.coi.filter.types;

/** Enumeration of all valid autoregressive types */
public enum AutoregressiveType {
  N("N"),
  N_SQUARED("N_SQUARED");

  private final String value;

  AutoregressiveType(String value) {
    this.value = value;
  }

  /**
   * Get the string representation of a {@link AutoregressiveType}
   *
   * @return The string representation of this {@link AutoregressiveType}
   */
  public String getValue() {
    return value;
  }

  /**
   * Convert provided string into a {@link AutoregressiveType} if the input maps to a valid type
   *
   * @param value String representation of the desired {@link AutoregressiveType}
   * @return The {@link AutoregressiveType} associated with the provided value
   * @throws IllegalArgumentException if the provided string does not map to a valid {@link
   *     AutoregressiveType}
   */
  public static AutoregressiveType fromString(String value) {
    for (AutoregressiveType ft : AutoregressiveType.values()) {
      if (ft.value.equals(value)) {
        return ft;
      }
    }
    throw new IllegalArgumentException(
        String.format("String value %s does not map to a AutoregressiveType enumeration.", value));
  }
}
