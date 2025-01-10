package gms.shared.event.coi;

import com.google.common.base.Functions;
import com.google.common.collect.ImmutableMap;
import java.util.Arrays;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public enum MagnitudeType {
  MB("mb"),
  MB_CODA("mb_coda"),
  MB_MB("mb_mb"),
  MB_MLE("mb_mle"),
  MB_PG("mb_pg"),
  MB_REL_T("mb_rel_t"),
  ML("ml"),
  MS("ms"),
  MS_MLE("ms_mle"),
  MS_VMAX("ms_max"),
  MW_CODA("mw_coda");

  private static final ImmutableMap<String, MagnitudeType> flagsByType;
  private static final Logger LOGGER = LoggerFactory.getLogger(MagnitudeType.class);

  static {
    flagsByType =
        Arrays.stream(values())
            .collect(ImmutableMap.toImmutableMap(MagnitudeType::getType, Functions.identity()));
  }

  private final String type;

  MagnitudeType(String type) {
    this.type = type;
  }

  /**
   * Converts the String representation to an enum
   *
   * @param type String to convert
   * @return {@link MagnitudeType} of input string
   */
  public static MagnitudeType fromString(String type) {
    if (!containsType(type)) {
      LOGGER.warn("MagnitudeType mapping does not exist for input string '{}'", type);
    }
    return flagsByType.get(type);
  }

  /**
   * Validates the String matches a {@link MagnitudeType} enum
   *
   * @param type String to validate
   * @return True if the string matches a valid enum, false otherwise
   */
  public static boolean containsType(String type) {
    type = Objects.requireNonNullElse(type, "");
    return flagsByType.containsKey(type);
  }

  /**
   * The String representation of the enum object
   *
   * @return Enums string representation
   */
  public String getType() {
    return type;
  }
}
