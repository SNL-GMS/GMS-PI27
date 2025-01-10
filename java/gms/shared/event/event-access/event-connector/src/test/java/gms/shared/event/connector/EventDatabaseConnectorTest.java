package gms.shared.event.connector;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.event.dao.EventDao;
import jakarta.persistence.EntityManagerFactory;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class EventDatabaseConnectorTest extends DatabaseConnectorTest<EventDatabaseConnector> {

  @Override
  protected EventDatabaseConnector getDatabaseConnector(EntityManagerFactory entityManagerFactory) {
    return new EventDatabaseConnector(entityManagerFactory);
  }

  @Test
  void testFindEventById() {

    var expectedEventDao =
        new EventDao.Builder()
            .withEventId(1)
            .withEventName("EventOne")
            .withPreferredOrigin(1)
            .withAuthor("Something")
            .withCommentId(1)
            .withLoadDate(Instant.ofEpochMilli(1619185740000L))
            .build();

    var queriedEventDaoOpt = databaseConnector.findEventById(1);

    assertTrue(queriedEventDaoOpt.isPresent());
    assertEquals(expectedEventDao, queriedEventDaoOpt.get());
    assertEquals(expectedEventDao.toString(), queriedEventDaoOpt.get().toString());
    assertEquals(expectedEventDao.hashCode(), queriedEventDaoOpt.get().hashCode());
  }

  @Test
  void testFindEventByIdNoEvent() {

    assertFalse(databaseConnector.findEventById(99).isPresent());
  }

  @Test
  void testFindEventsByTime() {

    var queriedEventDaos =
        databaseConnector.findEventsByTime(
            Instant.ofEpochSecond(10001), Instant.ofEpochSecond(10002));
    assertEquals(2, queriedEventDaos.size());

    // test inclusive bounds
    queriedEventDaos =
        databaseConnector.findEventsByTime(
            Instant.ofEpochSecond(10005), Instant.ofEpochSecond(10003));

    assertEquals(1, queriedEventDaos.size());
    assertEquals(5, queriedEventDaos.get(0).getEventId());
  }

  @Test
  void testFindEventIdsByArids() {
    var arids = List.of(2L, 1L);
    var queriedEventIds = databaseConnector.findEventIdsByArids(arids);
    assertEquals(2, queriedEventIds.size());

    assertEquals(1111, queriedEventIds.get(0));
  }

  @Test
  void testIsPreferredByOriginId() {
    long orid = 42342342341L;
    var query = databaseConnector.isPreferred(orid);
    assertTrue(query);
  }

  @Test
  void testIsNotPreferredByOriginId() {
    long orid = 11111L;
    var query = databaseConnector.isPreferred(orid);
    assertFalse(query);
  }

  @Test
  void testIsPreferredForEmptyQuery() {
    long orid = 111115739923902L;
    var query = databaseConnector.isPreferred(orid);
    assertTrue(query);
  }
}
