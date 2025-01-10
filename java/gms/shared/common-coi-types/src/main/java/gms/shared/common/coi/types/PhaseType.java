package gms.shared.common.coi.types;

import com.fasterxml.jackson.annotation.JsonValue;
import com.google.common.collect.ImmutableMap;
import java.util.HashMap;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// Intentional use of enum casing, suppressing sonar warning
@SuppressWarnings("java:S115")
public enum PhaseType {
  // this is for supporting the Filter Definition Configuration
  UNSET,
  // if adding values, need to edit EnumeratedMeasurementValueConverter to add support for those
  UNKNOWN("Unknown"),
  WILD_CARD("*"),
  // For the phases below, the label should match the enum literal.
  P3KPbc,
  PnPn,
  PKKPbc,
  PKP3bc,
  Sdiff,
  PKPdf,
  PKSbc,
  SKKSac,
  sSdiff,
  PKP2ab,
  pPdiff,
  sSKSdf,
  Pg,
  PKKSab,
  P5KPbc_B,
  sPKPab,
  P5KPdf_C,
  Pb,
  P5KPdf_B,
  P4KPdf,
  P7KPbc,
  PKSab,
  Pn,
  SKKPdf,
  pSKS,
  pSKSac,
  sSKS,
  Sg,
  P3KPdf,
  Sb,
  P7KPbc_B,
  P7KPdf_C,
  PKPbc,
  P7KPbc_C,
  P7KPdf_B,
  P5KPbc,
  Sn,
  P7KPdf_D,
  SKKPab,
  Rg,
  PKKPab,
  PKP3ab,
  sPdiff,
  PKiKP,
  PcP,
  SKSdf,
  PKPab,
  PcS,
  sPKP,
  SKKPbc,
  SKS2df,
  PKP2df,
  pPKP,
  sSKSac,
  PKKSdf,
  sPKPdf,
  pPKPdf,
  P4KPbc,
  SKSac,
  pSdiff,
  P5KPdf,
  SnSn,
  pSKSdf,
  ScP,
  ScS,
  Lg,
  SKPdf,
  Pdiff,
  PKP2bc,
  P4KPdf_B,
  PKKPdf,
  PKP3df,
  sPKiKP,
  pPKiKP,
  PKKSbc,
  pPKPbc,
  sPKPbc,
  PKSdf,
  SKKSac_B,
  SKPab,
  SKS2ac,
  pPKPab,
  P7KPdf,
  SKiKP,
  SKKSdf,
  P3KPbc_B,
  SKPbc,
  PKP3df_B,
  P3KPdf_B,
  PmP,
  SKKP,
  PKPPKP,
  SKKS,
  PP_B,
  PPP_B,
  sP,
  sS,
  SKSSKS,
  PKKP,
  PKKS,
  SSS_B,
  SKS2,
  PKP,
  PKS,
  nNL,
  SP,
  SS,
  SKP,
  SKS,
  PKP2,
  PKP3,
  SSS,
  SS_B,
  PPS_B,
  nP,
  PPP,
  PPS,
  PS,
  PP,
  pS,
  S,
  P,
  pP,
  P3KP,
  P7KP,
  LR,
  LQ,
  P4KP,
  N,
  I,
  L,
  NP,
  NP_1,
  PP_1,
  PS_1,
  SP_1,
  T,
  P5KP,
  tx,
  Tx,
  Sx,
  Px,
  IPx,
  It,
  Is,
  Iw,
  Ix,
  PKhKP,
  H;

  private static final Logger LOGGER = LoggerFactory.getLogger(PhaseType.class);
  private static final ImmutableMap<String, PhaseType> BY_LABEL;
  private final String label;

  /** Construct a phase type whose label matches the enum literal. */
  PhaseType() {
    this.label = this.name();
  }

  /**
   * Construct a phase type whose label is custom. The label should be reasonable.
   *
   * @param label The custom label
   */
  PhaseType(String label) {
    this.label = label;
  }

  static {
    HashMap<String, PhaseType> hashMapValues = new HashMap<>();
    for (PhaseType phaseType : values()) {
      hashMapValues.put(phaseType.label, phaseType);
    }
    BY_LABEL = ImmutableMap.copyOf(hashMapValues);
  }

  /**
   * Converts the String representation to an enum
   *
   * @param label String to convert
   * @return {@link PhaseType} of input string
   */
  public static PhaseType valueOfLabel(String label) {
    if (!containsType(label)) {
      LOGGER.warn("PhaseType mapping does not exist for input string '{}'", label);
    }

    return BY_LABEL.get(label);
  }

  /**
   * Validates the String matches a {@link PhaseType} enum
   *
   * @param type String to validate
   * @return True if the string matches a valid enum, false otherwise
   */
  public static boolean containsType(String type) {
    type = Objects.requireNonNullElse(type, "");
    return BY_LABEL.containsKey(type);
  }

  /**
   * The String representation of the enum object
   *
   * @return Enums string representation
   */
  @JsonValue
  public String getLabel() {
    return label;
  }

  /**
   * Identifies the final phase of the {@link PhaseType} instance
   *
   * @return The final {@link PhaseType}, or UNKNWON if not identified
   */
  public PhaseType getFinalPhase() {
    int diff = this.name().lastIndexOf("P") - this.name().lastIndexOf("S");

    if (diff == 0) {
      return UNKNOWN;
    } else if (diff > 0) {
      return P;
    } else {
      return S;
    }
  }
}
