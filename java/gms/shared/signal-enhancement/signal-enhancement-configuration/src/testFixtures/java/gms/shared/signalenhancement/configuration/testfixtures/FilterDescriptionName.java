package gms.shared.signalenhancement.configuration.testfixtures;

import java.util.Arrays;

public enum FilterDescriptionName {
  HAM_FIR_BP_0_70_2_00_HZ_DESCRIPTION("HAM FIR 0.7 2.0 48 BP causal Description"),
  HAM_FIR_BP_1_00_3_00_HZ_DESCRIPTION("HAM FIR 1.0 3.0 48 BP causal Description"),
  HAM_FIR_BP_4_00_8_00_HZ_DESCRIPTION("HAM FIR 4.0 8.0 48 BP causal Description"),
  HAM_FIR_BP_0_40_3_50_HZ_DESCRIPTION("HAM FIR 0.4 3.5 48 BP causal Description"),
  HAM_FIR_BP_0_50_4_00_HZ_DESCRIPTION("HAM FIR 0.5 4.0 48 BP causal Description"),
  HAM_FIR_BP_0_50_4_00_HZ_NON_CAUSAL_DESCRIPTION("HAM FIR 0.5 4.0 48 BP non-causal Description"),
  HAM_FIR_BP_2_00_5_00_HZ_DESCRIPTION("HAM FIR 2.0 5.0 48 BP causal Description"),
  HAM_FIR_BP_1_50_3_00_HZ_DESCRIPTION("HAM FIR 1.5 3.0 48 BP causal Description"),
  HAM_FIR_BP_1_00_5_00_HZ_DESCRIPTION("HAM FIR 1.0 5.0 48 BP causal Description"),
  HAM_FIR_BP_0_50_2_50_HZ_DESCRIPTION("HAM FIR 0.5 2.5 48 BP causal Description"),
  HAM_FIR_BP_1_50_3_50_HZ_NON_CAUSAL_DESCRIPTION("HAM FIR 1.5 3.5 48 BP non-causal Description"),
  HAM_FIR_BP_1_70_3_20_HZ_NON_CAUSAL_DESCRIPTION("HAM FIR 1.7 3.2 48 BP non-causal Description"),
  HAM_FIR_LP_4_20_HZ_NON_CAUSAL_DESCRIPTION("HAM FIR 0.0 4.2 48 LP non-causal Description"),
  HAM_FIR_BP_0_50_1_50_HZ_NON_CAUSAL_DESCRIPTION("HAM FIR 0.5 1.5 48 BP non-causal Description"),
  HAM_FIR_BP_2_00_4_00_HZ_DESCRIPTION("HAM FIR 2.0 4.0 48 BP causal Description"),
  HAM_FIR_HP_0_30_HZ_DESCRIPTION("HAM FIR 0.3 0.0 48 HP causal Description"),
  BW_IIR_LP_0_0_4_2_1_HZ_NON_CAUSAL_DESCRIPTION("0.0 4.2 1 LP non-causal Description"),
  BW_IIR_HP_0_3_0_0_2_HZ_CAUSAL_DESCRIPTION("0.3 0.0 2 HP causal Description"),
  BW_IIR_BR_4_09_4_39_4_HZ_NON_CAUSAL_DESCRIPTION("4.09 4.39 4 BR non-causal Description"),
  BW_IIR_BP_4_0_8_0_3_HZ_CAUSAL_DESCRIPTION("4.0 8.0 3 BP causal Description"),
  BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL_DESCRIPTION("2.0 5.0 3 BP causal Description"),
  BW_IIR_BP_2_0_4_0_4_HZ_CAUSAL_DESCRIPTION("2.0 4.0 4 BP causal Description"),
  BW_IIR_BP_1_7_3_2_3_HZ_NON_CAUSAL_DESCRIPTION("1.7 3.2 3 BP non-causal Description"),
  BW_IIR_BP_1_5_3_0_3_HZ_CAUSAL_DESCRIPTION("1.5 3.0 3 BP causal Description"),
  BW_IIR_BP_1_0_5_0_3_HZ_CAUSAL_DESCRIPTION("1.0 5.0 3 BP causal Description"),
  BW_IIR_BP_1_0_3_0_3_HZ_CAUSAL_DESCRIPTION("1.0 3.0 3 BP causal Description"),
  BW_IIR_BP_0_7_2_0_3_HZ_CAUSAL_DESCRIPTION("0.7 2.0 3 BP causal Description"),
  BW_IIR_BP_0_5_4_0_3_HZ_NON_CAUSAL_DESCRIPTION("0.5 4.0 3 BP non-causal Description"),
  BW_IIR_BP_0_5_4_0_3_HZ_CAUSAL_DESCRIPTION("0.5 4.0 3 BP causal Description"),
  BW_IIR_BP_0_5_2_5_3_HZ_CAUSAL_DESCRIPTION("0.5 2.5 3 BP causal Description"),
  BW_IIR_BP_0_5_1_5_3_HZ_NON_CAUSAL_DESCRIPTION("0.5 1.5 3 BP non-causal Description"),
  BW_IIR_BP_0_4_3_5_3_HZ_CAUSAL_DESCRIPTION("0.4 3.5 3 BP causal Description"),
  BW_IIR_BP_1_5_3_5_3_HZ_NON_CAUSAL_DESCRIPTION("1.5 3.5 3 BP non-causal Description"),
  BW_IIR_BP_0_4_0_6_3_HZ_CAUSAL_DESCRIPTION("0.4 0.6 3 BP causal Description"),
  BW_IIR_BP_0_9_1_1_3_HZ_CAUSAL_DESCRIPTION("0.9 1.1 3 BP causal Description"),
  BW_IIR_BP_1_4_1_6_3_HZ_CAUSAL_DESCRIPTION("1.4 1.6 3 BP causal Description"),
  BW_IIR_BP_1_9_2_1_3_HZ_CAUSAL_DESCRIPTION("1.9 2.1 3 BP causal Description"),
  BW_IIR_BR_2_0_4_5_3_HZ_CAUSAL_DESCRIPTION("2.0 4.5 3 BR causal Description"),
  BW_IIR_BP_2_4_2_6_3_HZ_CAUSAL_DESCRIPTION("2.4 2.6 3 BP causal Description"),
  BW_IIR_BP_2_9_3_1_3_HZ_CAUSAL_DESCRIPTION("2.9 3.1 3 BP causal Description"),
  BW_IIR_BP_3_4_3_6_3_HZ_CAUSAL_DESCRIPTION("3.4 3.6 3 BP causal Description"),
  BW_IIR_BP_3_9_4_1_3_HZ_CAUSAL_DESCRIPTION("3.9 4.1 3 BP causal Description"),
  BW_IIR_BP_4_4_4_6_3_HZ_CAUSAL_DESCRIPTION("4.4 4.6 3 BP causal Description"),
  BW_IIR_BP_4_9_5_1_3_HZ_CAUSAL_DESCRIPTION("4.9 5.1 3 BP causal Description");

  private final String filterDescription;

  FilterDescriptionName(String filterDescription) {
    this.filterDescription = filterDescription;
  }

  public String getFilterDescription() {
    return filterDescription;
  }

  public static FilterDescriptionName fromString(String filterDescriptionName) {
    return Arrays.stream(FilterDescriptionName.values())
        .filter(v -> v.filterDescription.equalsIgnoreCase(filterDescriptionName))
        .findFirst()
        .orElseThrow(
            () ->
                new IllegalArgumentException(
                    String.format("Unsupported Filter Description: %s", filterDescriptionName)));
  }

  @Override
  public String toString() {
    return filterDescription;
  }
}
