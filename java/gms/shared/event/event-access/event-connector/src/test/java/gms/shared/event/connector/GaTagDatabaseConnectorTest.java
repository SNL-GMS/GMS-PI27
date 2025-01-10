package gms.shared.event.connector;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.dao.GaTagDao;
import jakarta.persistence.EntityManagerFactory;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class GaTagDatabaseConnectorTest extends DatabaseConnectorTest<GaTagDatabaseConnector> {

  @Override
  protected GaTagDatabaseConnector getDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    return new GaTagDatabaseConnector(entityManagerFactory);
  }

  private static Stream<Arguments> buildGaTagDatabaseConnectorPreconditions() {

    return Stream.of(
        arguments(null, "processState", 1, NullPointerException.class),
        arguments("", "processState", 1, IllegalArgumentException.class),
        arguments("objectType", null, 1, NullPointerException.class),
        arguments("objectType", "", 1, IllegalArgumentException.class));
  }

  @ParameterizedTest
  @MethodSource("buildGaTagDatabaseConnectorPreconditions")
  void testBuildGaTagDatabaseConnectorPreconditions(
      String objectType, String processState, long evid, Class<Throwable> expectedExceptionClass) {
    assertThrows(
        expectedExceptionClass,
        () ->
            databaseConnector.findGaTagByObjectTypeProcessStateAndEvid(
                objectType, processState, evid));
  }

  private static Stream<Arguments> buildGaTagDatabaseConnectorPreconditionsBatched() {

    return Stream.of(
        arguments(null, List.of("processState"), List.of(1), NullPointerException.class),
        arguments(List.of(), List.of("processState"), List.of(1), IllegalArgumentException.class),
        arguments(List.of(""), List.of("processState"), List.of(1), IllegalArgumentException.class),
        arguments(List.of("objectType"), null, List.of(1), NullPointerException.class),
        arguments(List.of("objectType"), List.of(), List.of(1), IllegalArgumentException.class),
        arguments(List.of("objectType"), List.of(""), List.of(1), IllegalArgumentException.class));
  }

  @ParameterizedTest
  @MethodSource("buildGaTagDatabaseConnectorPreconditionsBatched")
  void testBuildGaTagsDatabaseConnectorPreconditionsBatched(
      List<String> objectTypes,
      List<String> processStates,
      List<Long> evids,
      Class<Throwable> expectedExceptionClass) {
    assertThrows(
        expectedExceptionClass,
        () ->
            databaseConnector.findGaTagsByObjectTypesProcessStatesAndEvids(
                objectTypes, processStates, evids));
  }

  @Test
  void testFindArrivalAnalystRejectedGaTagByEvid() {
    var expectedObjectType = "a";
    var expectedProcessState = "analyst_rejected";
    long expectedEvid = 999;
    var expectedGaTagDao =
        GaTagDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_GATAG_DAO)
            .withObjectType(expectedObjectType)
            .withProcessState(expectedProcessState)
            .withRejectedArrivalOriginEvid(expectedEvid)
            .withId(12345)
            .withAuthor("AUTH")
            .withTime(0.0)
            .withLoadDate(Instant.EPOCH)
            .build();

    var queriedGaTagDaos =
        databaseConnector.findGaTagByObjectTypeProcessStateAndEvid(
            "a", "analyst_rejected", expectedEvid);
    assertFalse(queriedGaTagDaos.isEmpty());
    assertEquals(1, queriedGaTagDaos.size());
    assertEquals(expectedGaTagDao, queriedGaTagDaos.get(0));
  }

  @Test
  void testFindGaTagsByObjectTypesProcessStatesAndEvids() {
    var defaultGaTagDao = EventTestFixtures.DEFAULT_GATAG_DAO;

    var expectedGaTagDao1 =
        GaTagDao.Builder.initializeFromInstance(defaultGaTagDao)
            .withObjectType("a")
            .withProcessState("analyst_rejected")
            .withRejectedArrivalOriginEvid(999)
            .withId(12345)
            .withAuthor("AUTH")
            .withTime(0.0)
            .withLoadDate(Instant.EPOCH)
            .build();

    var expectedGaTagDao2 =
        GaTagDao.Builder.initializeFromInstance(defaultGaTagDao)
            .withObjectType("a")
            .withProcessState("invalid")
            .withRejectedArrivalOriginEvid(456)
            .withId(1234567)
            .withAuthor("AUTH")
            .withTime(0.0)
            .withLoadDate(Instant.EPOCH)
            .build();

    var expectedGaTagDao3 =
        GaTagDao.Builder.initializeFromInstance(defaultGaTagDao)
            .withObjectType("b")
            .withProcessState("invalid")
            .withRejectedArrivalOriginEvid(999)
            .withId(1234568)
            .withAuthor("AUTH")
            .withTime(0.0)
            .withLoadDate(Instant.EPOCH)
            .build();

    var expectedGaTagDao4 =
        GaTagDao.Builder.initializeFromInstance(defaultGaTagDao)
            .withObjectType("b")
            .withProcessState("invalid")
            .withRejectedArrivalOriginEvid(456)
            .withId(1234569)
            .withAuthor("AUTH")
            .withTime(0.0)
            .withLoadDate(Instant.EPOCH)
            .build();

    var objectTypes = List.of("a", "b");
    var processStates = List.of("analyst_rejected", "invalid");
    var evids = List.of(999L, 456L);

    var queriedGaTagDaos =
        databaseConnector.findGaTagsByObjectTypesProcessStatesAndEvids(
            objectTypes, processStates, evids);
    assertFalse(queriedGaTagDaos.isEmpty());
    assertEquals(4, queriedGaTagDaos.size());
    assertTrue(queriedGaTagDaos.contains(expectedGaTagDao1));
    assertTrue(queriedGaTagDaos.contains(expectedGaTagDao2));
    assertTrue(queriedGaTagDaos.contains(expectedGaTagDao3));
    assertTrue(queriedGaTagDaos.contains(expectedGaTagDao4));
  }

  @Test
  void testFindArrivalAnalystRejectedGaTagByEvidNoGaTag() {
    assertTrue(
        databaseConnector
            .findGaTagByObjectTypeProcessStateAndEvid("a", "analyst_rejected", 1234)
            .isEmpty());
  }
}
