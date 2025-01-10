package gms.shared.signaldetection.database.connector;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.utilities.bridge.database.connector.DatabaseConnectorException;
import gms.shared.utilities.bridge.database.converter.NegativeNaInstantToDoubleConverter;
import jakarta.persistence.EntityManagerFactory;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class ArrivalDatabaseConnectorTest extends SignalDetectionDbTest<ArrivalDatabaseConnector> {
  private static final Instant START = Instant.now();
  private static final Instant END = Instant.now().plusSeconds(30);
  private static final Duration ZERO_DURATION = Duration.ZERO;
  private static final String STATION = "ASAR";
  private static final long ARID = 1L;

  @Override
  protected ArrivalDatabaseConnector getRepository(EntityManagerFactory entityManagerFactory) {
    return new ArrivalDatabaseConnector(entityManagerFactory);
  }

  @Test
  void testFindArrivalByAridPresent() {
    Optional<ArrivalDao> possibleArrival = repository.findArrivalByArid(59210057L);
    possibleArrival.ifPresentOrElse(
        arrival -> assertEquals(59210057L, arrival.getId()), () -> fail());
  }

  @Test
  void testFindArrivalByAridAbsent() {
    Optional<ArrivalDao> possibleArrival = repository.findArrivalByArid(17);
    assertTrue(possibleArrival.isEmpty());
  }

  @Test
  void testFindArrivalsByAridsAridsInput() {
    List<Long> arids = List.of(59210057L, 59210202L, 59210470L);

    final List<ArrivalDao> arrivalDaos = repository.findArrivalsByArids(arids);
    arrivalDaos.forEach(dao -> System.out.println(dao.toString()));

    assertNotNull(arrivalDaos);

    assertEquals(arids.size(), arrivalDaos.size());
    arrivalDaos.forEach(arrivalDao -> assertTrue(arids.contains(arrivalDao.getId())));
  }

  @Test
  void testFindArrivalsByAridsNullAridsInputEmptyResult() {
    assertErrorThrown(
        NullPointerException.class,
        ArrivalDatabaseConnector.EMPTY_ARID_LIST_ERROR,
        () -> repository.findArrivalsByArids(null));
  }

  @Test
  void testFindArrivalsByAridsEmptyAridsInputEmptyResult() {
    final List<ArrivalDao> arrivalDaos = repository.findArrivalsByArids(List.of());

    assertNotNull(arrivalDaos);
    assertTrue(arrivalDaos.isEmpty());
  }

  @Test
  void testFindArrivalsByStationNamesAridsAndTimeRangeStationNamesAridsTimeRangeInput()
      throws DatabaseConnectorException {
    // create time variables for time range query
    final Instant time =
        new NegativeNaInstantToDoubleConverter().convertToEntityAttribute(1274385713.0);
    Instant offdate = time.plusSeconds(600);
    Duration deltaTime = Duration.ofSeconds(60);
    List<String> stationNames = List.of("AKASG", "ASAR", "MKAR");

    // Test expects to have arids: [59210058, 59210059, 59210061, 59210057]
    List<Long> excludedArids = List.of(59210058L);

    final List<ArrivalDao> arrivalDaos =
        repository.findArrivals(stationNames, excludedArids, time, offdate, deltaTime, deltaTime);

    assertNotNull(arrivalDaos);
    assertEquals(3, arrivalDaos.size());
    arrivalDaos.forEach(
        arr -> assertTrue(stationNames.contains(arr.getArrivalKey().getStationCode())));
    arrivalDaos.forEach(arr -> assertFalse(excludedArids.contains(arr.getId())));
  }

  @Test
  void testFindArrivalsByStationNamesAridsAndTimeRangeNullStationListInputEmptyResult() {
    assertErrorThrown(
        NullPointerException.class,
        ArrivalDatabaseConnector.EMPTY_STATION_NAME_LIST_ERROR,
        () -> repository.findArrivals(null, List.of(), START, END, ZERO_DURATION, ZERO_DURATION));
  }

  @Test
  void testFindArrivalsByStationNamesAridsAndTimeRangeEmptyStationListInputEmptyResult() {
    final List<ArrivalDao> arrivalDaos =
        repository.findArrivals(List.of(), List.of(), START, END, ZERO_DURATION, ZERO_DURATION);

    assertNotNull(arrivalDaos);
    assertTrue(arrivalDaos.isEmpty());
  }

  @Test
  void testFindArrivalsByStationNamesAridsAndTimeRangeNullAridListInputEmptyResult() {
    assertErrorThrown(
        NullPointerException.class,
        ArrivalDatabaseConnector.EMPTY_EXCLUDED_ARID_LIST_ERROR,
        () ->
            repository.findArrivals(
                List.of(STATION), null, START, END, ZERO_DURATION, ZERO_DURATION));
  }

  @Test
  void testFindArrivalsByStationNamesAridsAndTimeRangeEmptyAridListInputEmptyResult() {
    final List<ArrivalDao> arrivalDaos =
        repository.findArrivals(
            List.of(STATION), List.of(), START, END, ZERO_DURATION, ZERO_DURATION);

    assertNotNull(arrivalDaos);
    assertTrue(arrivalDaos.isEmpty());
  }

  @Test
  void testFindArrivalsByStationNamesAridsAndTimeRangeNullStartTimeInputEmptyResult() {
    assertErrorThrown(
        NullPointerException.class,
        ArrivalDatabaseConnector.MISSING_START_TIME_ERROR,
        () ->
            repository.findArrivals(
                List.of(STATION), List.of(ARID), null, END, ZERO_DURATION, ZERO_DURATION));
  }

  @Test
  void testFindArrivalsByStationNamesAridsAndTimeRangeNullEndTimeInputEmptyResult() {
    assertErrorThrown(
        NullPointerException.class,
        ArrivalDatabaseConnector.MISSING_END_TIME_ERROR,
        () ->
            repository.findArrivals(
                List.of(STATION), List.of(ARID), START, null, ZERO_DURATION, ZERO_DURATION));
  }

  @Test
  void testFindArrivalsByStationNamesAridsAndTimeRangeNullLeadDeltaEmptyResult() {
    assertErrorThrown(
        NullPointerException.class,
        ArrivalDatabaseConnector.MISSING_LEAD_DELTA_ERROR,
        () ->
            repository.findArrivals(
                List.of(STATION), List.of(ARID), START, END, null, ZERO_DURATION));
  }

  @Test
  void testFindArrivalsByStationNamesAridsAndTimeRangeNullLagDeltaEmptyResult() {
    assertErrorThrown(
        NullPointerException.class,
        ArrivalDatabaseConnector.MISSING_LAG_DELTA_ERROR,
        () ->
            repository.findArrivals(
                List.of(STATION), List.of(ARID), START, END, ZERO_DURATION, null));
  }

  @ParameterizedTest
  @MethodSource("findArrivalsArgumentsSupplier")
  void testFindArrivalsBadInputs(
      Class<Exception> exceptionClass,
      List<String> stationNames,
      List<Long> excludedArids,
      Instant startTime,
      Instant endTime,
      Duration timeDelta,
      String errorMessage) {
    assertThrows(
        exceptionClass,
        () ->
            repository.findArrivals(
                stationNames, excludedArids, startTime, endTime, timeDelta, timeDelta),
        errorMessage);
  }

  static Stream<Arguments> findArrivalsArgumentsSupplier() {
    final Instant timeRangeBoundary = Instant.parse("2000-05-20T00:00:00Z");
    final Collection<String> stationNames = List.of(STATION);
    final Collection<Long> arids = List.of(ARID);
    return Stream.of(
        arguments(
            NullPointerException.class,
            stationNames,
            arids,
            null,
            timeRangeBoundary,
            ZERO_DURATION,
            ArrivalDatabaseConnector.MISSING_START_TIME_ERROR),
        arguments(
            NullPointerException.class,
            stationNames,
            arids,
            timeRangeBoundary,
            null,
            ZERO_DURATION,
            ArrivalDatabaseConnector.MISSING_END_TIME_ERROR),
        arguments(
            IllegalArgumentException.class,
            stationNames,
            arids,
            timeRangeBoundary.plusSeconds(10),
            timeRangeBoundary,
            ZERO_DURATION,
            ArrivalDatabaseConnector.START_NOT_BEFORE_END_TIME_ERROR),
        arguments(
            IllegalArgumentException.class,
            stationNames,
            arids,
            timeRangeBoundary,
            timeRangeBoundary.minusSeconds(10),
            ZERO_DURATION,
            ArrivalDatabaseConnector.START_NOT_BEFORE_END_TIME_ERROR));
  }

  @Test
  void testFindArrivalsByTimeRangeTimeRangeInput() throws DatabaseConnectorException {
    // create time variables for time range query
    final Instant time =
        new NegativeNaInstantToDoubleConverter().convertToEntityAttribute(1595389700.025);
    Instant offdate = time.plusSeconds(300);

    final List<ArrivalDao> arrivalDaos = repository.findArrivalsByTimeRange(time, offdate);

    assertNotNull(arrivalDaos);
    assertEquals(3, arrivalDaos.size());
  }

  @ParameterizedTest
  @MethodSource("findArrivalsByTimeRangeArgumentsSupplier")
  void testFindArrivalsByTimeRangeBadInputs(
      Class<Exception> exceptionClass, Instant startTime, Instant endTime, String errorMessage) {
    assertThrows(
        exceptionClass, () -> repository.findArrivalsByTimeRange(startTime, endTime), errorMessage);
  }

  static Stream<Arguments> findArrivalsByTimeRangeArgumentsSupplier() {
    final Instant timeRangeBoundary = Instant.parse("2000-05-20T00:00:00Z");
    return Stream.of(
        arguments(
            NullPointerException.class,
            null,
            timeRangeBoundary,
            ArrivalDatabaseConnector.MISSING_START_TIME_ERROR),
        arguments(
            NullPointerException.class,
            timeRangeBoundary,
            null,
            ArrivalDatabaseConnector.MISSING_END_TIME_ERROR),
        arguments(
            IllegalArgumentException.class,
            timeRangeBoundary.plusSeconds(10),
            timeRangeBoundary,
            ArrivalDatabaseConnector.START_NOT_BEFORE_END_TIME_ERROR),
        arguments(
            IllegalArgumentException.class,
            timeRangeBoundary,
            timeRangeBoundary.minusSeconds(10),
            ArrivalDatabaseConnector.START_NOT_BEFORE_END_TIME_ERROR));
  }
}
