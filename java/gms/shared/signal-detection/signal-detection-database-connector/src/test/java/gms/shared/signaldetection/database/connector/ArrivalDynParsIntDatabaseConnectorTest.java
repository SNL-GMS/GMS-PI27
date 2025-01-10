package gms.shared.signaldetection.database.connector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.signaldetection.dao.css.ArrivalDynParsIntDao;
import jakarta.persistence.EntityManagerFactory;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class ArrivalDynParsIntDatabaseConnectorTest
    extends SignalDetectionDbTest<ArrivalDynParsIntDatabaseConnector> {

  private static final long ARID_1 = 2001032;
  private static final long ARID_2 = 2001033;
  private static final long BAD_ARID = 9999999;

  @Override
  protected ArrivalDynParsIntDatabaseConnector getRepository(
      EntityManagerFactory entityManagerFactory) {
    return new ArrivalDynParsIntDatabaseConnector(entityManagerFactory);
  }

  @Test
  void testFindArrivalDynParsIntsByIds() {

    var resultsByArid =
        repository
            .findArrivalDynParsIntsByIds(
                List.of(ARID_1, ARID_2, BAD_ARID),
                List.of("DETECT", "MEASURE"),
                List.of("LEAD", "LAG"))
            .stream()
            .collect(
                Collectors.groupingBy(
                    adpi -> ((ArrivalDynParsIntDao) adpi).getArrivalDynParsIntKey().getArid()));

    assertAll(
        () -> assertTrue(resultsByArid.containsKey(ARID_1)),
        () -> assertTrue(resultsByArid.containsKey(ARID_2)),
        () -> assertFalse(resultsByArid.containsKey(BAD_ARID)));

    var adpis1 = resultsByArid.get(ARID_1);
    assertNotNull(adpis1);
    assertAll(
        () -> assertEquals(2, adpis1.size()),
        () ->
            assertThat(
                    adpis1.stream()
                        .map(adpi -> adpi.getArrivalDynParsIntKey().getParamName())
                        .collect(Collectors.toList()))
                .containsExactlyInAnyOrderElementsOf(List.of("LEAD", "LAG")),
        () ->
            assertThat(
                    adpis1.stream()
                        .map(adpi -> adpi.getArrivalDynParsIntKey().getGroupName())
                        .collect(Collectors.toList()))
                .containsExactlyInAnyOrderElementsOf(List.of("DETECT", "MEASURE")));

    var adpis2 = resultsByArid.get(ARID_2);
    assertNotNull(adpis2);
    assertEquals(1, adpis2.size());

    var adpi2 = adpis2.get(0);
    assertAll(
        () -> assertEquals("LAG", adpi2.getArrivalDynParsIntKey().getParamName()),
        () -> assertEquals("DETECT", adpi2.getArrivalDynParsIntKey().getGroupName()));
  }

  @Test
  void testFindFilterAdpisByIds() {

    assertTrue(repository.findFilterAdpisByIds(Collections.emptyList()).isEmpty());

    var resultsByArid =
        repository.findFilterAdpisByIds(List.of(ARID_1, ARID_2, BAD_ARID)).stream()
            .collect(
                Collectors.groupingBy(
                    adpi -> ((ArrivalDynParsIntDao) adpi).getArrivalDynParsIntKey().getArid()));

    assertAll(
        () -> assertTrue(resultsByArid.containsKey(ARID_1)),
        () -> assertTrue(resultsByArid.containsKey(ARID_2)),
        () -> assertFalse(resultsByArid.containsKey(BAD_ARID)));

    var adpis1 = resultsByArid.get(ARID_1);
    assertNotNull(adpis1);
    assertAll(
        () -> assertEquals(3, adpis1.size()),
        () ->
            assertTrue(
                adpis1.stream()
                    .map(adpi -> adpi.getArrivalDynParsIntKey().getParamName())
                    .allMatch(paramName -> paramName.equals("FILTERID"))),
        () ->
            assertThat(
                    adpis1.stream()
                        .map(adpi -> adpi.getArrivalDynParsIntKey().getGroupName())
                        .collect(Collectors.toList()))
                .containsExactlyInAnyOrderElementsOf(List.of("DETECT", "FK", "ONSET")));

    var adpis2 = resultsByArid.get(ARID_2);
    assertNotNull(adpis2);
    assertAll(
        () -> assertEquals(2, adpis2.size()),
        () ->
            assertTrue(
                adpis2.stream()
                    .map(adpi -> adpi.getArrivalDynParsIntKey().getParamName())
                    .allMatch(paramName -> paramName.equals("FILTERID"))),
        () ->
            assertThat(
                    adpis2.stream()
                        .map(adpi -> adpi.getArrivalDynParsIntKey().getGroupName())
                        .collect(Collectors.toList()))
                .containsExactlyInAnyOrderElementsOf(List.of("DETECT", "FK")));
  }

  @Test
  void testInvalidArgsReturnNoResults() {
    assertAll(
        () ->
            assertTrue(
                repository
                    .findArrivalDynParsIntsByIds(
                        Collections.emptyList(), List.of("FK"), List.of("LEAD"))
                    .isEmpty()),
        () ->
            assertTrue(
                repository
                    .findArrivalDynParsIntsByIds(List.of(ARID_1), List.of("NOPE"), List.of("LEAD"))
                    .isEmpty()),
        () ->
            assertTrue(
                repository
                    .findArrivalDynParsIntsByIds(List.of(ARID_1), List.of("FK"), List.of("NOPE"))
                    .isEmpty()),
        () -> assertTrue(repository.findFilterAdpisByIds(Collections.emptyList()).isEmpty()));
  }
}
