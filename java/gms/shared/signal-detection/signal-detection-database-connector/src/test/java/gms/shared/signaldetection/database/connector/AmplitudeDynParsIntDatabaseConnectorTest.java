package gms.shared.signaldetection.database.connector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.signaldetection.dao.css.AmplitudeDynParsIntDao;
import jakarta.persistence.EntityManagerFactory;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class AmplitudeDynParsIntDatabaseConnectorTest
    extends SignalDetectionDbTest<AmplitudeDynParsIntDatabaseConnector> {

  private static final long AMPID_0 = 2001020;
  private static final long AMPID_1 = 2001021;
  private static final long AMPID_2 = 2001022;
  private static final long AMPID_3 = 2001023;

  private static final long AMPID_4 = 2001030;
  private static final long AMPID_5 = 2001031;
  private static final long AMPID_6 = 2001032;
  private static final long BAD_AMPID = 9999999;

  @Override
  protected AmplitudeDynParsIntDatabaseConnector getRepository(
      EntityManagerFactory entityManagerFactory) {
    return new AmplitudeDynParsIntDatabaseConnector(entityManagerFactory);
  }

  @Test
  void testFindAmplitudeDynParsIntsByIds() {

    var daosByAmpid =
        repository
            .findAmplitudeDynParsIntsByIds(
                List.of(AMPID_0, AMPID_1, AMPID_2, AMPID_3, BAD_AMPID),
                List.of("DETECT", "MEASURE"),
                List.of("LEAD", "LAG"))
            .stream()
            .collect(
                Collectors.groupingBy(
                    adpi ->
                        ((AmplitudeDynParsIntDao) adpi).getAmplitudeDynParsIntKey().getAmpid()));

    assertAll(
        () -> assertTrue(daosByAmpid.containsKey(AMPID_0)),
        () -> assertTrue(daosByAmpid.containsKey(AMPID_1)),
        () -> assertTrue(daosByAmpid.containsKey((AMPID_3))),
        () -> assertFalse(daosByAmpid.containsKey(AMPID_2)),
        () -> assertFalse(daosByAmpid.containsKey(BAD_AMPID)));

    var adpis0 = daosByAmpid.get(AMPID_0);
    assertNotNull(adpis0);
    assertAll(
        () -> assertEquals(2, adpis0.size()),
        () ->
            assertThat(
                    adpis0.stream()
                        .map(adpi -> adpi.getAmplitudeDynParsIntKey().getParamName())
                        .collect(Collectors.toList()))
                .containsExactlyInAnyOrderElementsOf(List.of("LEAD", "LAG")),
        () ->
            assertThat(
                    adpis0.stream()
                        .map(adpi -> adpi.getAmplitudeDynParsIntKey().getGroupName())
                        .collect(Collectors.toList()))
                .containsExactlyInAnyOrderElementsOf(List.of("DETECT", "MEASURE")));

    var adpis1 = daosByAmpid.get(AMPID_1);
    assertNotNull(adpis1);
    assertEquals(1, adpis1.size());

    var adpi2 = adpis1.get(0);
    assertAll(
        () -> assertEquals("LAG", adpi2.getAmplitudeDynParsIntKey().getParamName()),
        () -> assertEquals("DETECT", adpi2.getAmplitudeDynParsIntKey().getGroupName()));
  }

  @Test
  void testFindFilterAdpisByIds() {

    assertTrue(repository.findFilterAdpisByIds(Collections.emptyList()).isEmpty());

    var filteredDaoKeyByAmpid =
        repository
            .findFilterAdpisByIds(
                List.of(AMPID_0, AMPID_1, AMPID_2, AMPID_4, AMPID_5, AMPID_6, BAD_AMPID))
            .stream()
            .map(ampidDao -> ampidDao.getAmplitudeDynParsIntKey())
            .collect(Collectors.toList());

    assertAll(
        () -> assertEquals(3, filteredDaoKeyByAmpid.size()),
        () ->
            assertTrue(
                filteredDaoKeyByAmpid.stream()
                    .map(ampidDaoKey -> ampidDaoKey.getGroupName())
                    .allMatch(groupName -> groupName.equals("MEASURE"))),
        () ->
            assertTrue(
                filteredDaoKeyByAmpid.stream()
                    .map(ampidDaoKey -> ampidDaoKey.getParamName())
                    .allMatch(paramName -> paramName.equals("FILTERID"))));
  }

  @ParameterizedTest
  @MethodSource("findAmplitudeDynParsIntByIds_EmptyInvalidArgsSource")
  void testFindAmplitudeDynParsIntsByIdsInvalidArgsReturnNoResults(
      List<Long> ampids, List<String> groupNames, List<String> paramNames) {

    assertTrue(repository.findAmplitudeDynParsIntsByIds(ampids, groupNames, paramNames).isEmpty());
  }

  private static Stream<Arguments> findAmplitudeDynParsIntByIds_EmptyInvalidArgsSource() {
    return Stream.of(
        Arguments.arguments(Collections.emptyList(), List.of("FK"), List.of("LEAD")),
        Arguments.arguments(List.of(AMPID_0), List.of("NOPE"), List.of("LEAD")),
        Arguments.arguments(List.of(AMPID_1), List.of("FK"), List.of("NOPE")),
        Arguments.arguments(List.of(AMPID_1), Collections.emptyList(), List.of("LEAD")),
        Arguments.arguments(List.of(AMPID_1), List.of("DETECT"), Collections.emptyList()));
  }

  @Test
  void testFindFilterAdpisByIdsInvalidArgsReturnNoResults() {

    assertTrue(repository.findFilterAdpisByIds(Collections.emptyList()).isEmpty());
  }
}
