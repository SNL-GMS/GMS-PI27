package gms.shared.stationdefinition.dao.util;

import gms.shared.stationdefinition.dao.FilterDaoFixtures;
import gms.shared.stationdefinition.dao.FilterGroupDaoFixtures;
import java.util.List;

public class FilterDataNodeFixtures {

  private FilterDataNodeFixtures() {
    // hide implicit public constructor
  }

  // ------ Misc
  public static final FilterDataNode lbBPcNode =
      FilterDataNode.builder().setFilterRecord(FilterDaoFixtures.linearButterworthBpCausal).build();

  public static final FilterDataNode LbHPcNode =
      FilterDataNode.builder().setFilterRecord(FilterDaoFixtures.linearButterworthHpCausal).build();

  public static final FilterDataNode cascadeCausal_LbHPcChild_node3 =
      LbHPcNode.toBuilder()
          .setFilterGroup(FilterGroupDaoFixtures.cascadeCausal_LbHPcChild_seq3)
          .build();

  // ----- Cascade Causal Tree
  public static final FilterDataNode cascadeCausal_LbBPcChild_node1 =
      lbBPcNode.toBuilder()
          .setFilterGroup(FilterGroupDaoFixtures.cascadeCausal_LbBPcChild_seq1)
          .build();

  public static final FilterDataNode cascadeCausal_LbHPcChild_node2 =
      LbHPcNode.toBuilder()
          .setFilterGroup(FilterGroupDaoFixtures.cascadeCausal_LbHPcChild_seq2)
          .build();

  public static final FilterDataNode cascadeCausalTree =
      FilterDataNode.builder()
          .setFilterRecord(FilterDaoFixtures.cascadeCausal)
          // Reordering here to ensure that end result accurately sorts by sequence
          .setChildFilters(List.of(cascadeCausal_LbHPcChild_node2, cascadeCausal_LbBPcChild_node1))
          .build();

  // ------ Cascade Non-Causal Tree
  public static final FilterDataNode cascadeNonCausal_LbBPcChild_node1 =
      FilterDataNode.builder()
          .setFilterRecord(FilterDaoFixtures.linearButterworthBpCausal)
          .setFilterGroup(FilterGroupDaoFixtures.cascadeNonCausal_LbBPcChild_seq1)
          .build();

  public static final FilterDataNode cascadeNonCausal_LbBPncChild_node2 =
      FilterDataNode.builder()
          .setFilterRecord(FilterDaoFixtures.linearButterworthBpNonCausal)
          .setFilterGroup(FilterGroupDaoFixtures.cascadeNonCausal_LbBPncChild_seq2)
          .build();

  public static final FilterDataNode cascadeNonCausalTree =
      FilterDataNode.builder()
          .setFilterRecord(FilterDaoFixtures.cascadeNonCausal)
          // Reordering here to ensure that end result accurately sorts by sequence
          .setChildFilters(
              List.of(cascadeNonCausal_LbBPncChild_node2, cascadeNonCausal_LbBPcChild_node1))
          .build();
}
