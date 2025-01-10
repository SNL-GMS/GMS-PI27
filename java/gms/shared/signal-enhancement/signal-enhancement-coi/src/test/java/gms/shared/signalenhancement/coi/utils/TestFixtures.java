package gms.shared.signalenhancement.coi.utils;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import gms.shared.signalenhancement.coi.filter.FilterList;
import gms.shared.signalenhancement.coi.filter.FilterListEntry;
import gms.shared.signalenhancement.coi.filter.WorkflowDefinitionIdStringPair;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Filter fixtures used for tests and signal enhancement configuration */
public class TestFixtures {

  private TestFixtures() {}

  public static final String SEISMIC = "SEISMIC";
  public static final String LONG_PERIOD = "LONG-PERIOD";
  public static final String HYDRO = "HYDRO";

  public static final String HAM_FIR_BP_0_70_2_00_HZ = "HAM FIR BP 0.70-2.00 Hz";
  public static final String HAM_FIR_BP_1_00_3_00_HZ = "HAM FIR BP 1.00-3.00 Hz";
  public static final String HAM_FIR_BP_4_00_8_00_HZ = "HAM FIR BP 4.00-8.00 Hz";
  public static final String HAM_FIR_BP_0_40_3_50_HZ = "HAM FIR BP 0.40-3.50 Hz";
  public static final String CASCADE_FILTER_1 = "Cascade Filter 1";
  public static final String CASCADE_FILTER_2 = "Cascade Filter 2";
  public static final String CASCADE_FILTER_3 = "Cascade Filter 3";
  public static final String UNFILTERED = "Unfiltered";

  public static final ImmutableMap<String, Boolean> FILTER_ENTRY_NAME_TO_HOT_KEY_CYCLE_MAP =
      getFilterEntryNameToHotKeyCycleMap();

  public static final FilterListEntry FILTER_LIST_ENTRY =
      FilterListEntry.from(
          true, null, null, FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);

  public static final List<FilterListEntry> FILTER_LIST_ENTRY_LIST = List.of(FILTER_LIST_ENTRY);

  // ------- Workflow Definintion Ids and Pairs -------
  private static final WorkflowDefinitionId AL1_EVENT_REVIEW =
      WorkflowDefinitionId.from("AL1 Event Review");
  private static final WorkflowDefinitionId AL2_EVENT_REVIEW =
      WorkflowDefinitionId.from("AL2 Event Review");
  private static final WorkflowDefinitionId AL1_SCAN = WorkflowDefinitionId.from("AL1 Scan");
  private static final WorkflowDefinitionId AL2_SCAN = WorkflowDefinitionId.from("AL2 Scan");

  private static final WorkflowDefinitionIdStringPair SEISMIC_WORKFLOW_PAIR =
      WorkflowDefinitionIdStringPair.create(AL1_EVENT_REVIEW, SEISMIC);
  private static final WorkflowDefinitionIdStringPair LONG_PERIOD_WORKFLOW_PAIR =
      WorkflowDefinitionIdStringPair.create(AL2_EVENT_REVIEW, LONG_PERIOD);
  private static final WorkflowDefinitionIdStringPair HYDRO_WORKFLOW_PAIR =
      WorkflowDefinitionIdStringPair.create(AL1_SCAN, HYDRO);
  private static final WorkflowDefinitionIdStringPair SEISMIC_AL2_WORKFLOW_PAIR =
      WorkflowDefinitionIdStringPair.create(AL2_SCAN, SEISMIC);
  public static final List<WorkflowDefinitionIdStringPair> WORKFLOW_PAIR_LIST =
      List.of(
          SEISMIC_WORKFLOW_PAIR,
          LONG_PERIOD_WORKFLOW_PAIR,
          HYDRO_WORKFLOW_PAIR,
          SEISMIC_AL2_WORKFLOW_PAIR);

  private static final FilterListEntry UNFILTERED_FILTER_LIST_ENTRY =
      FilterListEntry.from(true, true, null, null);
  private static final FilterListEntry DETECTION_FILTER_LIST_ENTRY =
      FilterListEntry.from(false, null, FilterDefinitionUsage.DETECTION, null);
  private static final FilterListEntry ONSET_FILTER_LIST_ENTRY =
      FilterListEntry.from(false, null, FilterDefinitionUsage.ONSET, null);
  private static final FilterListEntry FK_FILTER_LIST_ENTRY =
      FilterListEntry.from(false, null, FilterDefinitionUsage.FK, null);
  private static final FilterListEntry CASCADE_FILTER_1_LIST_ENTRY =
      FilterListEntry.from(true, null, null, FilterDefinitionTestFixtures.CASCADE__CAUSAL);
  private static final FilterListEntry CASCADE_FILTER_2_LIST_ENTRY =
      FilterListEntry.from(false, null, null, FilterDefinitionTestFixtures.CASCADE__NON_CAUSAL);

  // custom filter list entries
  private static final FilterListEntry FIR1 =
      getFilterListEntry(true, FilterDefinitionTestFixtures.H__LP__0_0__4_2__48__NON_CAUSAL);
  private static final FilterListEntry FIR2 =
      getFilterListEntry(true, FilterDefinitionTestFixtures.H__HP__0_3__0_0__48__CAUSAL);
  private static final FilterListEntry FIR3 =
      getFilterListEntry(false, FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL);

  // lists of custom filter list entries
  private static final List<FilterListEntry> SEISMIC_FILTER_LIST_ENTRIES =
      List.of(
          UNFILTERED_FILTER_LIST_ENTRY,
          DETECTION_FILTER_LIST_ENTRY,
          ONSET_FILTER_LIST_ENTRY,
          FK_FILTER_LIST_ENTRY,
          FIR1,
          FIR2,
          CASCADE_FILTER_1_LIST_ENTRY);
  private static final List<FilterListEntry> LONG_PERIOD_FILTER_LIST_ENTRIES =
      List.of(
          UNFILTERED_FILTER_LIST_ENTRY,
          DETECTION_FILTER_LIST_ENTRY,
          ONSET_FILTER_LIST_ENTRY,
          FK_FILTER_LIST_ENTRY,
          FIR2,
          FIR3,
          CASCADE_FILTER_2_LIST_ENTRY);
  private static final List<FilterListEntry> HYDRO_FILTER_LIST_ENTRIES =
      List.of(
          UNFILTERED_FILTER_LIST_ENTRY,
          DETECTION_FILTER_LIST_ENTRY,
          ONSET_FILTER_LIST_ENTRY,
          FK_FILTER_LIST_ENTRY,
          FIR1,
          FIR3,
          CASCADE_FILTER_1_LIST_ENTRY);

  // ------- Filter List -------
  public static final FilterList SEISMIC_FILTER_LIST =
      FilterList.from(SEISMIC, 0, ImmutableList.copyOf(SEISMIC_FILTER_LIST_ENTRIES));
  public static final FilterList LONG_PERIOD_FILTER_LIST =
      FilterList.from(LONG_PERIOD, 1, ImmutableList.copyOf(LONG_PERIOD_FILTER_LIST_ENTRIES));
  public static final FilterList HYDRO_FILTER_LIST =
      FilterList.from(HYDRO, 2, ImmutableList.copyOf(HYDRO_FILTER_LIST_ENTRIES));

  public static final List<FilterList> DEFAULT_FILTER_LIST =
      List.of(SEISMIC_FILTER_LIST, LONG_PERIOD_FILTER_LIST, HYDRO_FILTER_LIST);

  /**
   * Create filter using specified parameters
   *
   * @param hotKey boolean hotkey
   * @param filterName filter name
   * @param comments filter comments
   * @param lowFreq low freq val
   * @param highFreq high freq val
   * @param bCoefficients b filter coefficients
   * @return {@link FilterListEntry}
   */
  private static FilterListEntry getFilterListEntry(
      boolean hotKey, FilterDefinition filterDefinition) {
    return FilterListEntry.from(hotKey, null, null, filterDefinition);
  }

  private static ImmutableMap<String, Boolean> getFilterEntryNameToHotKeyCycleMap() {
    Map<String, Boolean> defaultFilterEntries = new LinkedHashMap<>();
    defaultFilterEntries.put(UNFILTERED, true);
    defaultFilterEntries.put(HAM_FIR_BP_0_70_2_00_HZ, true);
    defaultFilterEntries.put(HAM_FIR_BP_1_00_3_00_HZ, true);
    defaultFilterEntries.put(HAM_FIR_BP_4_00_8_00_HZ, true);
    defaultFilterEntries.put(FilterDefinitionUsage.DETECTION.name(), false);
    defaultFilterEntries.put(FilterDefinitionUsage.FK.name(), false);
    defaultFilterEntries.put(FilterDefinitionUsage.ONSET.name(), false);
    defaultFilterEntries.put(CASCADE_FILTER_1, true);
    defaultFilterEntries.put(CASCADE_FILTER_2, false);
    defaultFilterEntries.put(CASCADE_FILTER_3, true);

    return ImmutableMap.copyOf(defaultFilterEntries);
  }
}
