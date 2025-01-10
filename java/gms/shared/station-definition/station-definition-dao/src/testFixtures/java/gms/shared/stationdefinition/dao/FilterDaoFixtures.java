package gms.shared.stationdefinition.dao;

import gms.shared.stationdefinition.dao.css.FilterDao;
import java.security.SecureRandom;
import java.time.Instant;

public class FilterDaoFixtures {

  private static final SecureRandom random = new SecureRandom("0xDEADBEEF".getBytes());

  private FilterDaoFixtures() {
    // hide implicit public constructor
  }

  public static final FilterDao linearButterworthBpCausal =
      new FilterDao.Builder()
          .setFilterId(1L)
          .setCompoundFilter('n')
          .setFilterMethod("B")
          .setFilterString("0.1 1.0 1 BP causal")
          .setFilterHash(String.valueOf("0.1 1.0 1 BP causal".hashCode()))
          .setLdDate(Instant.EPOCH)
          .build();

  public static final FilterDao linearButterworthBpNonCausal =
      linearButterworthBpCausal.toBuilder()
          .setFilterId(2L)
          .setFilterString("0.1 1.0 1 BP non-causal")
          .setFilterHash(String.valueOf("0.1 1.0 1 BP non-causal".hashCode()))
          .build();

  public static final FilterDao linearButterworthHpCausal =
      linearButterworthBpCausal.toBuilder()
          .setFilterId(5L)
          .setFilterString("0.1 0.0 1 HP causal")
          .setFilterHash(String.valueOf("0.1 0.0 1 BP causal".hashCode()))
          .build();

  public static final FilterDao linearHammingBpCausal =
      linearButterworthBpCausal.toBuilder().setFilterId(3L).setFilterMethod("H").build();

  public static final String CASCADE_FILTER_STRING_CAUSAL =
      String.format(
          "%s / %s",
          linearButterworthBpCausal.getFilterString(), linearButterworthHpCausal.getFilterString());

  public static final String CASCADE_FILTER_STRING_NON_CAUSAL =
      String.format(
          "%s / %s",
          linearButterworthBpCausal.getFilterString(),
          linearButterworthBpNonCausal.getFilterString());

  public static final String CASCADE_OF_CASCADES_FILTER_STRING =
      String.format("%s / %s", CASCADE_FILTER_STRING_CAUSAL, CASCADE_FILTER_STRING_NON_CAUSAL);

  public static final FilterDao cascadeCausal =
      FilterDaoFixtures.cascadeTemplate()
          .setFilterString(FilterDaoFixtures.CASCADE_FILTER_STRING_CAUSAL)
          .setFilterHash(String.valueOf(FilterDaoFixtures.CASCADE_FILTER_STRING_CAUSAL.hashCode()))
          .build();

  public static final FilterDao cascadeNonCausal =
      FilterDaoFixtures.cascadeTemplate()
          .setFilterString(FilterDaoFixtures.CASCADE_FILTER_STRING_NON_CAUSAL)
          .setFilterHash(
              String.valueOf(FilterDaoFixtures.CASCADE_FILTER_STRING_NON_CAUSAL.hashCode()))
          .build();

  public static final FilterDao cascadeSingleLinear =
      FilterDaoFixtures.cascadeTemplate()
          .setFilterString(linearButterworthBpCausal.getFilterString())
          .setFilterHash(String.valueOf(linearButterworthBpCausal.getFilterString().hashCode()))
          .build();

  public static final FilterDao cascadeSingleCascade =
      FilterDaoFixtures.cascadeTemplate()
          .setFilterString(cascadeCausal.getFilterString())
          .setFilterHash(String.valueOf(cascadeCausal.getFilterString().hashCode()))
          .build();

  public static final FilterDao cascadeOfCascades =
      FilterDaoFixtures.cascadeTemplate()
          .setFilterString(CASCADE_OF_CASCADES_FILTER_STRING)
          .setFilterHash(String.valueOf(CASCADE_OF_CASCADES_FILTER_STRING.hashCode()))
          .build();

  public static FilterDao.Builder cascadeTemplate() {
    return new FilterDao.Builder()
        .setFilterId(random.nextLong())
        .setCompoundFilter('y')
        .setFilterMethod("C")
        .setLdDate(Instant.EPOCH);
  }
}
