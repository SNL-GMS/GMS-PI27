package gms.shared.stationdefinition.coi.channel;

/**
 * Represents the SEED / FDSN standard Channel Bands. Each band has a corresponding single letter
 * code.
 */
public enum ChannelBandType {

  // Long Period Bands
  MID_PERIOD('M'),
  LONG_PERIOD('L'),
  VERY_LONG_PERIOD('V'),
  ULTRA_LONG_PERIOD('U'),
  EXTREMELY_LONG_PERIOD('R'),
  PERIOD_ORDER_TENTH_TO_ONE_DAY('P'),
  PERIOD_ORDER_ONE_TO_TEN_DAYS('T'),
  PERIOD_GREATER_TEN_DAYS('Q'),

  // Short Period Bands
  SAMPLE_RATE_1KHZ_TO_LESS_5KHZ_CORNER_LESS_10SEC('G'),
  SAMPLE_RATE_250HZ_TO_LESS_1KHZ_CORNER_LESS_10SEC('D'),
  EXTREMELY_SHORT_PERIOD('E'),
  SHORT_PERIOD('S'),

  // Broadband (Corner Periods > 10 sec)
  SAMPLE_RATE_1KHZ_TO_LESS_5KHZ_CORNER_GREATER_EQUAL_10SEC('F'),
  SAMPLE_RATE_250HZ_TO_LESS_1KHZ_CORNER_GREATER_EQUAL_10SEC('C'),
  HIGH_BROADBAND('H'),
  BROADBAND('B'),

  // Other
  UNKNOWN('-'),
  ADMINISTRATIVE('A'),
  OPAQUE('O');

  private final char code;

  ChannelBandType(char code) {
    this.code = code;
  }

  /**
   * Obtain the single character code associated with this ChannelBandType
   *
   * @return char containing the band code
   */
  public char getCode() {
    return this.code;
  }

  public static ChannelBandType fromCode(char code) {
    for (ChannelBandType type : values()) {
      if (code == type.code) {
        return type;
      }
    }

    return UNKNOWN;
  }
}
