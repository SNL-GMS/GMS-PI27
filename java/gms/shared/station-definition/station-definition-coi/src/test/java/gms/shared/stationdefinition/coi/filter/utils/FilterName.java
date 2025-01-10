package gms.shared.stationdefinition.coi.filter.utils;

import java.util.Arrays;

/** Filter name class for resolving all signal enhancement filters from processing configuration */
public enum FilterName {
  HAM_FIR_BP_0_40_3_50_HZ("HAM FIR BP 0.40-3.50 Hz"),
  HAM_FIR_BP_0_50_1_50_HZ("HAM FIR BP 0.50-1.50 Hz"),
  HAM_FIR_BP_0_50_2_50_HZ("HAM FIR BP 0.50-2.50 Hz"),
  HAM_FIR_BP_0_50_4_00_HZ_NON_CAUSAL("HAM FIR BP 0.50-4.00 HZ non causal"),
  HAM_FIR_BP_0_50_4_00_HZ("HAM FIR BP 0.50-4.00 Hz"),
  HAM_FIR_BP_0_70_2_00_HZ("HAM FIR BP 0.70-2.00 Hz"),
  HAM_FIR_BP_1_00_3_00_HZ("HAM FIR BP 1.00-3.00 Hz"),
  HAM_FIR_BP_1_00_5_00_HZ("HAM FIR BP 1.00-5.00 Hz"),
  HAM_FIR_BP_1_50_3_00_HZ("HAM FIR BP 1.50-3.00 Hz"),
  HAM_FIR_BP_1_50_3_50_HZ("HAM FIR BP 1.50-3.50 Hz"),
  HAM_FIR_BP_1_70_3_20_HZ("HAM FIR BP 1.70-3.20 Hz"),
  HAM_FIR_BP_2_00_4_00_HZ("HAM FIR BP 2.00-4.00 Hz"),
  HAM_FIR_BP_2_00_5_00_HZ("HAM FIR BP 2.00-5.00 Hz"),
  HAM_FIR_BP_4_00_8_00_HZ("HAM FIR BP 4.00-8.00 Hz"),
  HAM_FIR_HP_0_30_HZ("HAM FIR HP 0.30 Hz"),
  HAM_FIR_LP_4_20_HZ("HAM FIR LP 4.20 Hz"),
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
  BW_IIR_BP_1_5_3_5_3_HZ_NON_CAUSAL("1.5 3.5 3 BP non-causal");

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
