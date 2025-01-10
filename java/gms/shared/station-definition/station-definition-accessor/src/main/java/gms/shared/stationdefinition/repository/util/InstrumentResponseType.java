package gms.shared.stationdefinition.repository.util;

/** InstrumentResponseType represents the instrument response types used within the system */
public enum InstrumentResponseType {
  FAP,
  FIR,
  PAZ;

  /**
   * Retrieves the {@link InstrumentResponseBlockParser} to translate data blocks into a common
   * format
   *
   * @return {@link InstrumentResponseBlockParser} associated with enum type
   */
  public InstrumentResponseBlockParser getBlockParser() {

    return switch (this) {
      case FAP -> new FapBlockParser();
      case FIR -> new FirBlockParser();
      case PAZ -> new PazBlockParser();
      default -> throw new IllegalStateException("No Parser available for type");
    };
  }
}
