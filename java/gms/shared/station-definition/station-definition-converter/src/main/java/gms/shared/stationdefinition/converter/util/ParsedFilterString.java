package gms.shared.stationdefinition.converter.util;

import com.google.auto.value.AutoValue;
import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import org.apache.commons.lang3.StringUtils;

/**
 * Value class representing a filter table's filter_string column parsed into their appropriate
 * types
 */
@AutoValue
public abstract class ParsedFilterString {

  private static final int LOW_FREQ_INDEX = 0;
  private static final int HIGH_FREQ_INDEX = 1;
  private static final int ORDER_INDEX = 2;
  private static final int TYPE_STR_INDEX = 3;
  private static final int CAUSAL_STR_INDEX = 4;
  private static final int NUM_VALUES = 5;

  public abstract double getLowFrequencyHz();

  public abstract double getHighFrequencyHz();

  public abstract int getOrder();

  public abstract PassBandType getPassBandType();

  public abstract boolean isCausal();

  /**
   * Factory method for constructing {@link ParsedFilterString}s
   *
   * @param filterString String in the format expected from the filter_string column of the filter
   *     table
   * @return Value class representation of the input filter string
   */
  public static ParsedFilterString create(String filterString) {
    Preconditions.checkNotNull(filterString);

    var values = StringUtils.normalizeSpace(filterString).strip().split(" ");

    Preconditions.checkArgument(
        values.length == NUM_VALUES,
        "filter_string must have " + NUM_VALUES + " space-separated values");

    var causalString = values[CAUSAL_STR_INDEX];
    var causal =
        switch (causalString) {
          case "causal" -> true;
          case "non-causal" -> false;
          default -> throw new IllegalArgumentException(
              String.format("filter_string contains an invalid causal value %s", causalString));
        };

    var lowFrequencyHz = Double.valueOf(values[LOW_FREQ_INDEX]);
    var highFrequencyHz = Double.valueOf(values[HIGH_FREQ_INDEX]);
    var order = Integer.valueOf(values[ORDER_INDEX]);
    var typeString = values[TYPE_STR_INDEX];
    var passBandType = parsePassBandType(typeString);

    return new AutoValue_ParsedFilterString(
        lowFrequencyHz, highFrequencyHz, order, passBandType, causal);
  }

  private static PassBandType parsePassBandType(String typeString) {
    return switch (typeString) {
      case "LP" -> PassBandType.LOW_PASS;
      case "HP" -> PassBandType.HIGH_PASS;
      case "BP" -> PassBandType.BAND_PASS;
      case "BR" -> PassBandType.BAND_REJECT;
      default -> throw new IllegalArgumentException(
          String.format("Invalid pass-band type string %s", typeString));
    };
  }

  /**
   * Converts the parsed value class back into the raw string represented in the filter table's
   * filter_string column
   *
   * @return Filter string in the format expected for filter_string column of filter table
   */
  public String toFilterString() {
    var causalString = this.isCausal() ? "causal" : "non-causal";
    return String.format(
        "%f %f %d %s %s",
        this.getLowFrequencyHz(),
        this.getHighFrequencyHz(),
        this.getOrder(),
        this.getPassBandType().getValue(),
        causalString);
  }
}
