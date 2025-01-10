package gms.shared.stationdefinition.coi.filter.types;

/** Enumeration of all valid pass band types */
public enum PassBandType {
  BAND_PASS("BP"),
  BAND_REJECT("BR"),
  HIGH_PASS("HP"),
  LOW_PASS("LP");

  private final String value;

  PassBandType(String value) {
    this.value = value;
  }

  /**
   * Get the string representation of a {@link PassBandType}
   *
   * @return The string representation of this {@link PassBandType}
   */
  public String getValue() {
    return value;
  }

  /**
   * Convert provided string into a {@link PassBandType} if the input maps to a valid type
   *
   * @param value String representation of the desired {@link PassBandType}
   * @return The {@link PassBandType} associated with the provided value
   * @throws IllegalArgumentException if the provided string does not map to a valid {@link
   *     PassBandType}
   */
  public static PassBandType fromString(String value) {
    for (PassBandType pbt : PassBandType.values()) {
      if (pbt.value.equals(value)) {
        return pbt;
      }
    }
    throw new IllegalArgumentException(
        String.format("String value %s does not map to a PassBandType enumeration.", value));
  }
}
