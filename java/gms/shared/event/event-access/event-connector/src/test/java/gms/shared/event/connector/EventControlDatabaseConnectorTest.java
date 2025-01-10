package gms.shared.event.connector;

import static org.assertj.core.api.Assertions.assertThat;

import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.EventIdOriginIdKey;
import jakarta.persistence.EntityManagerFactory;
import java.time.Instant;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@Tag("component")
class EventControlDatabaseConnectorTest
    extends DatabaseConnectorTest<EventControlDatabaseConnector> {

  private static final EventControlDao EXPECTED_EVENT_CONTROL =
      new EventControlDao.Builder()
          .withEventIdOriginIdKey(
              new EventIdOriginIdKey.Builder().withOriginId(11111).withEventId(1111).build())
          .withPreferredLocation("L")
          .withConstrainOriginTime(true)
          .withConstrainLatLon(true)
          .withConstrainDepth(true)
          .withSourceDependentCorrectionCode(23)
          .withSourceDependentLocationCorrectionRegion("GGGHHHFFFGGG")
          .withIgnoreLargeResidualsInLocation(true)
          .withLocationLargeResidualMultiplier(10)
          .withUseStationSubsetInLocation(true)
          .withUseAllStationsInLocation(true)
          .withUseDistanceVarianceWeighting(true)
          .withUserDefinedDistanceVarianceWeighting(10)
          .withSourceDependentMagnitudeCorrectionRegion("FFFDDDFFFFF")
          .withIgnoreLargeResidualsInMagnitude(true)
          .withMagnitudeLargeResidualMultiplier(10)
          .withUseStationSubsetInMagnitude(true)
          .withUseAllStationsInMagnitude(true)
          .withMbMinimumDistance(10)
          .withMbMaximumDistance(10)
          .withMagnitudeModel("FDFDFDFDFDFDF")
          .withEllipseSemiaxisConversionFactor(10)
          .withEllipseDepthTimeConversionFactor(10)
          .withLoadDate(Instant.ofEpochSecond(325345740))
          .build();

  @Override
  protected EventControlDatabaseConnector getDatabaseConnector(
      EntityManagerFactory entityManagerFactory) {
    return new EventControlDatabaseConnector(entityManagerFactory);
  }

  @Test
  void testFindByIds() {
    assertThat(
            databaseConnector.findByEventIdOriginId(
                EXPECTED_EVENT_CONTROL.getEventId(), EXPECTED_EVENT_CONTROL.getOriginId()))
        .contains(EXPECTED_EVENT_CONTROL);
  }

  @ParameterizedTest
  @CsvSource({"0, 11111", "111, 0", "0, 0"})
  void testFindByIdsMissing(long evid, long orid) {
    assertThat(databaseConnector.findByEventIdOriginId(evid, orid)).isEmpty();
  }
}
