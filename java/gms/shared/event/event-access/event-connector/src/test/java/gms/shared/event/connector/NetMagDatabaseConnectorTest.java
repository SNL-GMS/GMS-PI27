package gms.shared.event.connector;

import static gms.shared.event.coi.EventTestFixtures.ORIGIN_DAO_ALL_TYPES;
import static gms.shared.event.coi.EventTestFixtures.ORIGIN_DAO_NULL_MB;
import static gms.shared.event.coi.EventTestFixtures.ORIGIN_DAO_NULL_MB_ID;
import static org.assertj.core.api.Assertions.assertThat;

import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.dao.NetMagDao;
import jakarta.persistence.EntityManagerFactory;
import java.time.Instant;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class NetMagDatabaseConnectorTest extends DatabaseConnectorTest<NetMagDatabaseConnector> {

  private static final int ORIGIN_ID = 1111;

  private static final NetMagDao.Builder EXPECTED_NETMAG_DAO_BUILDER =
      new NetMagDao.Builder()
          .withOriginId(ORIGIN_ID)
          .withMagnitudeType("bb")
          .withNumberOfStations(10)
          .withMagnitudeUncertainty(1)
          .withAuthor("AUTH")
          .withCommentId(1234)
          .withLoadDate(Instant.parse("1980-04-23T13:49:00.00Z"));

  @Override
  protected NetMagDatabaseConnector getDatabaseConnector(
      EntityManagerFactory entityManagerFactory) {
    return new NetMagDatabaseConnector(entityManagerFactory);
  }

  @Test
  void testFindByOrid() {
    assertThat(databaseConnector.findNetMagByOrid(ORIGIN_ID))
        .containsExactly(
            EXPECTED_NETMAG_DAO_BUILDER
                .withMagnitudeId(1)
                .withNetwork("AA")
                .withEventId(2222)
                .withMagnitudeType("BB")
                .withMagnitude(1.0)
                .build(),
            EXPECTED_NETMAG_DAO_BUILDER
                .withMagnitudeId(2)
                .withNetwork("BB")
                .withEventId(1111)
                .withMagnitudeType("AA")
                .withMagnitude(2.0)
                .build());
  }

  @Test
  void testFindByOridMissing() {
    assertThat(databaseConnector.findNetMagByOrid(99999999)).isEmpty();
  }

  @Test
  void testFindNetMagByOriginDaoAllTypesPresent() {
    var magnitudeTypeToNetMag = databaseConnector.findNetMagByOriginDao(ORIGIN_DAO_ALL_TYPES);
    assertThat(magnitudeTypeToNetMag)
        .containsOnlyKeys(MagnitudeType.MB, MagnitudeType.MS, MagnitudeType.ML);
    Assertions.assertEquals(
        EventTestFixtures.MB_ID, magnitudeTypeToNetMag.get(MagnitudeType.MB).getMagnitudeId());
    Assertions.assertEquals(
        EventTestFixtures.MS_ID, magnitudeTypeToNetMag.get(MagnitudeType.MS).getMagnitudeId());
    Assertions.assertEquals(
        EventTestFixtures.ML_ID, magnitudeTypeToNetMag.get(MagnitudeType.ML).getMagnitudeId());
  }

  @Test
  void testFindNetMagByOriginInvalidMagnitude() {
    var magnitudeTypeToNetMag = databaseConnector.findNetMagByOriginDao(ORIGIN_DAO_NULL_MB);
    assertThat(magnitudeTypeToNetMag).containsOnlyKeys(MagnitudeType.MS, MagnitudeType.ML);
    Assertions.assertEquals(
        EventTestFixtures.ML_ID, magnitudeTypeToNetMag.get(MagnitudeType.ML).getMagnitudeId());
    Assertions.assertEquals(
        EventTestFixtures.MS_ID, magnitudeTypeToNetMag.get(MagnitudeType.MS).getMagnitudeId());
  }

  @Test
  void testFindNetMagByOriginInvalidId() {
    var magnitudeTypeToNetMag = databaseConnector.findNetMagByOriginDao(ORIGIN_DAO_NULL_MB_ID);
    assertThat(magnitudeTypeToNetMag).containsOnlyKeys(MagnitudeType.MS, MagnitudeType.ML);
    Assertions.assertEquals(
        EventTestFixtures.ML_ID, magnitudeTypeToNetMag.get(MagnitudeType.ML).getMagnitudeId());
    Assertions.assertEquals(
        EventTestFixtures.MS_ID, magnitudeTypeToNetMag.get(MagnitudeType.MS).getMagnitudeId());
  }
}
