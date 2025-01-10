package gms.shared.signalenhancement.configuration.testfixtures;

import java.util.Arrays;

/** Filter name class for resolving all signal enhancement filters from processing configuration */
public enum FilterName {
  HAM_FIR_BP_0_70_2_00_HZ("HAM FIR 0.7 2.0 48 BP causal"),
  HAM_FIR_BP_1_00_3_00_HZ("HAM FIR 1.0 3.0 48 BP causal"),
  HAM_FIR_BP_4_00_8_00_HZ("HAM FIR 4.0 8.0 48 BP causal"),
  HAM_FIR_BP_0_40_3_50_HZ("HAM FIR 0.4 3.5 48 BP causal"),
  HAM_FIR_BP_0_50_4_00_HZ("HAM FIR 0.5 4.0 48 BP causal"),
  HAM_FIR_BP_0_50_4_00_HZ_NON_CAUSAL("HAM FIR 0.5 4.0 48 BP non-causal"),
  HAM_FIR_BP_2_00_5_00_HZ("HAM FIR 2.0 5.0 48 BP causal"),
  HAM_FIR_BP_1_50_3_00_HZ("HAM FIR 1.5 3.0 48 BP causal"),
  HAM_FIR_BP_1_00_5_00_HZ("HAM FIR 1.0 5.0 48 BP causal"),
  HAM_FIR_BP_0_50_2_50_HZ("HAM FIR 0.5 2.5 48 BP causal"),
  HAM_FIR_BP_1_50_3_50_HZ_NON_CAUSAL("HAM FIR 1.5 3.5 48 BP non-causal"),
  HAM_FIR_BP_1_70_3_20_HZ_NON_CAUSAL("HAM FIR 1.7 3.2 48 BP non-causal"),
  HAM_FIR_LP_4_20_HZ_NON_CAUSAL("HAM FIR 0.0 4.2 48 LP non-causal"),
  HAM_FIR_BP_0_50_1_50_HZ_NON_CAUSAL("HAM FIR 0.5 1.5 48 BP non-causal"),
  HAM_FIR_BP_2_00_4_00_HZ("HAM FIR 2.0 4.0 48 BP causal"),
  HAM_FIR_HP_0_30_HZ("HAM FIR 0.3 0.0 48 HP causal"),
  BW_IIR_LP_0_0_4_2_1_HZ_NON_CAUSAL("0.0 4.2 1 LP non-causal"),
  BW_IIR_HP_0_3_0_0_2_HZ_CAUSAL("0.3 0.0 2 HP causal"),
  BW_IIR_BR_4_09_4_39_4_HZ_NON_CAUSAL("4.09 4.39 4 BR non-causal"),
  BW_IIR_BP_4_0_8_0_3_HZ_CAUSAL("4.0 8.0 3 BP causal"),
  BW_IIR_BP_2_0_5_0_3_HZ_CAUSAL("2.0 5.0 3 BP causal"),
  BW_IIR_BP_2_0_4_0_4_HZ_CAUSAL("2.0 4.0 4 BP causal"),
  BW_IIR_BP_1_7_3_2_3_HZ_NON_CAUSAL("1.7 3.2 3 BP non-causal"),
  BW_IIR_BP_1_5_3_0_3_HZ_CAUSAL("1.5 3.0 3 BP causal"),
  BW_IIR_BP_1_0_5_0_3_HZ_CAUSAL("1.0 5.0 3 BP causal"),
  BW_IIR_BP_1_0_3_0_3_HZ_CAUSAL("1.0 3.0 3 BP causal"),
  BW_IIR_BP_0_7_2_0_3_HZ_CAUSAL("0.7 2.0 3 BP causal"),
  BW_IIR_BP_0_5_4_0_3_HZ_NON_CAUSAL("0.5 4.0 3 BP non-causal"),
  BW_IIR_BP_0_5_4_0_3_HZ_CAUSAL("0.5 4.0 3 BP causal"),
  BW_IIR_BP_0_5_2_5_3_HZ_CAUSAL("0.5 2.5 3 BP causal"),
  BW_IIR_BP_0_5_1_5_3_HZ_NON_CAUSAL("0.5 1.5 3 BP non-causal"),
  BW_IIR_BP_0_4_3_5_3_HZ_CAUSAL("0.4 3.5 3 BP causal"),
  BW_IIR_BP_1_5_3_5_3_HZ_NON_CAUSAL("1.5 3.5 3 BP non-causal"),
  BW_IIR_BP_0_4_0_6_3_HZ_CAUSAL("0.4 0.6 3 BP causal"),
  BW_IIR_BP_0_9_1_1_3_HZ_CAUSAL("0.9 1.1 3 BP causal"),
  BW_IIR_BP_1_4_1_6_3_HZ_CAUSAL("1.4 1.6 3 BP causal"),
  BW_IIR_BP_1_9_2_1_3_HZ_CAUSAL("1.9 2.1 3 BP causal"),
  BW_IIR_BR_2_0_4_5_3_HZ_CAUSAL("2.0 4.5 3 BR causal"),
  BW_IIR_BP_2_4_2_6_3_HZ_CAUSAL("2.4 2.6 3 BP causal"),
  BW_IIR_BP_2_9_3_1_3_HZ_CAUSAL("2.9 3.1 3 BP causal"),
  BW_IIR_BP_3_4_3_6_3_HZ_CAUSAL("3.4 3.6 3 BP causal"),
  BW_IIR_BP_3_9_4_1_3_HZ_CAUSAL("3.9 4.1 3 BP causal"),
  BW_IIR_BP_4_4_4_6_3_HZ_CAUSAL("4.4 4.6 3 BP causal"),
  BW_IIR_BP_4_9_5_1_3_HZ_CAUSAL("4.9 5.1 3 BP causal");

  private final String filter;

  FilterName(String filter) {
    this.filter = filter;
  }

  public String getFilter() {
    return filter;
  }

  public static FilterName fromString(String filterName) {
    return Arrays.stream(FilterName.values())
        .filter(v -> v.filter.equalsIgnoreCase(filterName))
        .findFirst()
        .orElseThrow(
            () ->
                new IllegalArgumentException(String.format("Unsupported Filter: %s", filterName)));
  }

  @Override
  public String toString() {
    return filter;
  }
}
