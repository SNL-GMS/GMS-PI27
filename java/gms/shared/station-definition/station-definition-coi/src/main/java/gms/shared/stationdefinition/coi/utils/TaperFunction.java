package gms.shared.stationdefinition.coi.utils;

public enum TaperFunction {
  BLACKMAN("BLACKMAN"),
  COSINE("COSINE"),
  HAMMING("HAMMING"),
  HANNING("HANNING"),
  PARZEN("PARZEN"),
  WELCH("WELCH");

  private final String function;

  TaperFunction(String function) {
    this.function = function;
  }

  /**
   * Get the string representation of a {@link TaperFunction}
   *
   * @return The string representation of this {@link TaperFunction}
   */
  public String getFunction() {
    return function;
  }

  /**
   * Convert provided string into a {@link TaperFunction} if the input maps to a valid type
   *
   * @param value String representation of the desired {@link TaperFunction}
   * @return The {@link TaperFunction} associated with the provided value
   * @throws IllegalArgumentException if the provided string does not map to a valid {@link
   *     TaperFunction}
   */
  public static TaperFunction fromString(String value) {
    for (TaperFunction tf : TaperFunction.values()) {
      if (tf.function.equals(value)) {
        return tf;
      }
    }
    throw new IllegalArgumentException(
        String.format("String value %s does not map to a TaperFunction enumeration.", value));
  }
}
