package gms.shared.event.connector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import com.google.common.collect.Multimaps;
import gms.shared.event.dao.MagnitudeIdAmplitudeIdStationNameKey;
import gms.shared.event.dao.StaMagDao;
import gms.shared.signaldetection.dao.css.AridOridKey;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.signaldetection.dao.css.enums.DefiningFlag;
import jakarta.persistence.EntityManagerFactory;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class StaMagDatabaseConnectorTest extends DatabaseConnectorTest<StaMagDatabaseConnector> {

  private static final MagnitudeIdAmplitudeIdStationNameKey.Builder magIdAmpIdStaNameKeyBuilder =
      new MagnitudeIdAmplitudeIdStationNameKey.Builder().withAmplitudeId(2).withStationName("AA");

  private static final int ORIGIN_ID = 11111;
  private static final int ARID_ID = 3;

  private static final StaMagDao.Builder EXPECTED_STAMAG_DAO_BUILDER =
      new StaMagDao.Builder()
          .withArrivalId(3)
          .withOriginId(ORIGIN_ID)
          .withEventId(1111)
          .withPhaseType("P")
          .withDelta(1.0)
          .withMagnitudeType("bb")
          .withMagnitude(1)
          .withMagnitudeUncertainty(1)
          .withMagnitudeResidual(1)
          .withMagnitudeDefining(DefiningFlag.DEFAULT_DEFINING)
          .withMagnitudeModel("model")
          .withAuthor("me")
          .withCommentId(12)
          .withLoadDate(Instant.parse("1980-04-23T13:49:00.00Z"));

  @Override
  protected StaMagDatabaseConnector getDatabaseConnector(
      EntityManagerFactory entityManagerFactory) {
    return new StaMagDatabaseConnector(entityManagerFactory);
  }

  @Test
  void testFindByOrid() {
    assertThat(databaseConnector.findStaMagByOrid(ORIGIN_ID))
        .containsExactly(
            EXPECTED_STAMAG_DAO_BUILDER
                .withMagnitudeIdAmplitudeIdStationNameKey(
                    magIdAmpIdStaNameKeyBuilder.withMagnitudeId(1).build())
                .build(),
            EXPECTED_STAMAG_DAO_BUILDER
                .withMagnitudeIdAmplitudeIdStationNameKey(
                    magIdAmpIdStaNameKeyBuilder.withMagnitudeId(2).build())
                .build());
  }

  @Test
  void testFindStaMagByOridAndArid() {
    assertThat(databaseConnector.findStaMagByOridAndArid(ORIGIN_ID, ARID_ID))
        .containsExactly(
            EXPECTED_STAMAG_DAO_BUILDER
                .withMagnitudeIdAmplitudeIdStationNameKey(
                    magIdAmpIdStaNameKeyBuilder.withMagnitudeId(1).build())
                .build(),
            EXPECTED_STAMAG_DAO_BUILDER
                .withMagnitudeIdAmplitudeIdStationNameKey(
                    magIdAmpIdStaNameKeyBuilder.withMagnitudeId(2).build())
                .build());
  }

  @Test
  void testFindByOridMissing() {
    assertThat(databaseConnector.findStaMagByOrid(99999999)).isEmpty();
  }

  @Test
  void testFindStaMagDaosByAssocs() {
    var assocDao1 = Mockito.mock(AssocDao.class);
    var assocDao1Key = new AridOridKey();
    assocDao1Key.setOriginId(11111);
    assocDao1Key.setArrivalId(3);
    when(assocDao1.getId()).thenReturn(assocDao1Key);

    var assocDao2 = Mockito.mock(AssocDao.class);
    var assocDao2Key = new AridOridKey();
    assocDao2Key.setOriginId(1234);
    assocDao2Key.setArrivalId(3456);
    when(assocDao2.getId()).thenReturn(assocDao2Key);

    // this is not in the database!
    var assocDao3 = Mockito.mock(AssocDao.class);
    var assocDao3Key = new AridOridKey();
    assocDao3Key.setOriginId(76575675);
    assocDao3Key.setArrivalId(3);
    when(assocDao3.getId()).thenReturn(assocDao3Key);

    var queriedArInfo =
        databaseConnector.findStaMagDaosByAssocs(
            List.of(assocDao1, assocDao2, assocDao3, assocDao1));
    var queriedArInfoMap =
        Multimaps.index(queriedArInfo, StaMagDatabaseConnector::staMagDaoKeyTransformer);
    assertEquals(3, queriedArInfo.size());
    assertEquals(2, queriedArInfoMap.get(assocDao1Key).size());
    assertEquals(1, queriedArInfoMap.get(assocDao2Key).size());
  }
}
