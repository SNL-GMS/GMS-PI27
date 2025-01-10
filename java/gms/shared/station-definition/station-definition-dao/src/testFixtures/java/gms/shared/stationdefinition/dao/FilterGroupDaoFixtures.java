package gms.shared.stationdefinition.dao;

import gms.shared.stationdefinition.dao.css.FilterGroupDao;
import gms.shared.stationdefinition.dao.css.FilterGroupKey;
import java.time.Instant;

public class FilterGroupDaoFixtures {

  private FilterGroupDaoFixtures() {
    // hide implicit public constructor
  }

  public static final FilterGroupDao cascadeCausal_LbBPcChild_seq1 =
      FilterGroupDaoFixtures.filterGroupTemplate()
          .setFilterGroupKey(
              new FilterGroupKey.Builder()
                  .setParentFilterId(FilterDaoFixtures.cascadeCausal.getFilterId())
                  .setChildFilterDao(FilterDaoFixtures.linearButterworthBpCausal)
                  .setChildSequence(1)
                  .build())
          .build();

  public static final FilterGroupDao cascadeCausal_LbHPcChild_seq2 =
      FilterGroupDaoFixtures.filterGroupTemplate()
          .setFilterGroupKey(
              new FilterGroupKey.Builder()
                  .setParentFilterId(FilterDaoFixtures.cascadeCausal.getFilterId())
                  .setChildFilterDao(FilterDaoFixtures.linearButterworthHpCausal)
                  .setChildSequence(2)
                  .build())
          .build();

  public static final FilterGroupDao cascadeCausal_LbHPcChild_seq3 =
      FilterGroupDaoFixtures.filterGroupTemplate()
          .setFilterGroupKey(
              new FilterGroupKey.Builder()
                  .setParentFilterId(FilterDaoFixtures.cascadeCausal.getFilterId())
                  .setChildFilterDao(FilterDaoFixtures.linearButterworthHpCausal)
                  .setChildSequence(3)
                  .build())
          .build();

  public static final FilterGroupDao cascadeNonCausal_LbBPcChild_seq1 =
      cascadeCausal_LbBPcChild_seq1.toBuilder()
          .setFilterGroupKey(
              cascadeCausal_LbBPcChild_seq1.getFilterGroupKey().toBuilder()
                  .setParentFilterId(FilterDaoFixtures.cascadeNonCausal.getFilterId())
                  .build())
          .build();

  public static final FilterGroupDao cascadeNonCausal_LbBPncChild_seq2 =
      FilterGroupDaoFixtures.filterGroupTemplate()
          .setFilterGroupKey(
              new FilterGroupKey.Builder()
                  .setParentFilterId(FilterDaoFixtures.cascadeNonCausal.getFilterId())
                  .setChildFilterDao(FilterDaoFixtures.linearButterworthBpNonCausal)
                  .setChildSequence(2)
                  .build())
          .build();

  public static final FilterGroupDao cascadeSingle_LbBPcChild_seq1 =
      FilterGroupDaoFixtures.filterGroupTemplate()
          .setFilterGroupKey(
              new FilterGroupKey.Builder()
                  .setParentFilterId(FilterDaoFixtures.cascadeSingleLinear.getFilterId())
                  .setChildFilterDao(FilterDaoFixtures.linearButterworthBpCausal)
                  .setChildSequence(1)
                  .build())
          .build();

  public static final FilterGroupDao cascadeSingle_CcChild_seq1 =
      FilterGroupDaoFixtures.filterGroupTemplate()
          .setFilterGroupKey(
              new FilterGroupKey.Builder()
                  .setParentFilterId(FilterDaoFixtures.cascadeSingleCascade.getFilterId())
                  .setChildFilterDao(FilterDaoFixtures.cascadeCausal)
                  .setChildSequence(1)
                  .build())
          .build();

  public static final FilterGroupDao cascadeOfCascades_cc_seq1 =
      FilterGroupDaoFixtures.filterGroupTemplate()
          .setFilterGroupKey(
              new FilterGroupKey.Builder()
                  .setParentFilterId(FilterDaoFixtures.cascadeOfCascades.getFilterId())
                  .setChildFilterDao(FilterDaoFixtures.cascadeCausal)
                  .setChildSequence(1)
                  .build())
          .build();

  public static final FilterGroupDao cascadeOfCascades_cnc_seq2 =
      cascadeOfCascades_cc_seq1.toBuilder()
          .setFilterGroupKey(
              cascadeOfCascades_cc_seq1.getFilterGroupKey().toBuilder()
                  .setChildFilterDao(FilterDaoFixtures.cascadeNonCausal)
                  .setChildSequence(2)
                  .build())
          .build();

  public static FilterGroupDao.Builder filterGroupTemplate() {
    return new FilterGroupDao.Builder().setLdDate(Instant.EPOCH).setChildFunction('?');
  }
}
