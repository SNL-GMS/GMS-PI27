package gms.shared.stationdefinition.coi.filter.types;

/** Enumeration of all valid autoregressive filter types */
public enum AutoregressiveFilterType {
  ADAPTIVE("ADAPTIVE"),
  NON_ADAPTIVE("NON_ADAPTIVE");

  private final String value;

  AutoregressiveFilterType(String value) {
    this.value = value;
  }

  /**
   * Get the string representation of a {@link AutoregressiveFilterType}
   *
   * @return The string representation of this {@link AutoregressiveFilterType}
   */
  public String getValue() {
    return value;
  }

  /**
   * Convert provided string into a {@link FilterType} if the input maps to a valid type
   *
   * @param value String representation of the desired {@link AutoregressiveFilterType}
   * @return The {@link AutoregressiveFilterType} associated with the provided value
   * @throws IllegalArgumentException if the provided string does not map to a valid {@link
   *     AutoregressiveFilterType}
   */
  public static AutoregressiveFilterType fromString(String value) {
    for (AutoregressiveFilterType ft : AutoregressiveFilterType.values()) {
      if (ft.value.equals(value)) {
        return ft;
      }
    }
    throw new IllegalArgumentException(
        String.format(
            "String value %s does not map to a AutoregressiveFilterType enumeration.", value));
  }
}
