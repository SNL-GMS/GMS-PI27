package gms.shared.event.accessor;

import static gms.shared.event.accessor.EventStatusInfoCache.EVENT_STATUS_INFO_CACHE;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mockStatic;

import gms.shared.event.coi.EventStatus;
import gms.shared.event.coi.EventStatusInfo;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.Arrays;
import java.util.Collections;
import java.util.UUID;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.apache.ignite.IgniteCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EventStatusInfoCacheTest {
  private static EventStatusInfoCache eventStatusInfoCache;

  private static final WorkflowDefinitionId stageId = WorkflowDefinitionId.from("test");
  private static final UUID eventId = UUID.fromString("10000000-100-0000-1000-100000000001");
  private static final EventStatusInfo eventStatusInfo =
      EventStatusInfo.from(EventStatus.COMPLETE, Arrays.asList("analyst1"));
  private static final EventStatusInfo emptyEventStatusInfo =
      EventStatusInfo.from(EventStatus.NOT_STARTED, Collections.emptyList());

  @Mock IgniteCache<Pair<WorkflowDefinitionId, UUID>, EventStatusInfo> eventStatusInfoIgniteCache;

  @BeforeEach
  void setUp() {
    eventStatusInfoCache = new EventStatusInfoCache(eventStatusInfoIgniteCache);
  }

  @Test
  void testCreate() {
    try (MockedStatic<IgniteConnectionManager> managerMockedStatic =
        mockStatic(IgniteConnectionManager.class)) {

      managerMockedStatic
          .when(() -> IgniteConnectionManager.getOrCreateCache(EVENT_STATUS_INFO_CACHE))
          .thenReturn(eventStatusInfoIgniteCache);

      assertNotNull(new EventStatusInfoCache());
    }
  }

  @Test
  void testAddEventStatusInfo() {
    assertDoesNotThrow(
        () -> eventStatusInfoCache.addEventStatusInfo(stageId, eventId, eventStatusInfo));
  }

  private static Stream<Arguments> testAddEventStatusInfoNullValues() {
    return Stream.of(
        arguments(null, eventId, eventStatusInfo),
        arguments(stageId, null, eventStatusInfo),
        arguments(stageId, eventId, null));
  }

  @ParameterizedTest
  @MethodSource("testAddEventStatusInfoNullValues")
  void testAddEventStatusInfoNullValuesCoverages(
      WorkflowDefinitionId stageId, UUID eventId, EventStatusInfo eventStatusInfo) {
    assertThrows(
        NullPointerException.class,
        () -> eventStatusInfoCache.addEventStatusInfo(stageId, eventId, eventStatusInfo));
  }

  private static Stream<Arguments> testGetOrCreateEventStatusInfo() {
    return Stream.of(arguments(eventStatusInfo), arguments(emptyEventStatusInfo));
  }

  @ParameterizedTest
  @MethodSource("testGetOrCreateEventStatusInfo")
  void testGetOrCreateEventStatusInfoCoverages(EventStatusInfo cachedEventStatusInfo) {
    if (cachedEventStatusInfo.getEventStatus() == EventStatus.NOT_STARTED) {
      given(eventStatusInfoIgniteCache.get(Pair.of(stageId, eventId))).willReturn(null);
    } else {
      given(eventStatusInfoIgniteCache.get(Pair.of(stageId, eventId)))
          .willReturn(cachedEventStatusInfo);
    }

    var eventStatusInfo = eventStatusInfoCache.getOrCreateEventStatusInfo(stageId, eventId);

    assertNotNull(eventStatusInfo);
    assertEquals(cachedEventStatusInfo, eventStatusInfo);
  }

  private static Stream<Arguments> testGetEventStatusInfoNullValues() {
    return Stream.of(arguments(null, eventId), arguments(stageId, null));
  }

  @ParameterizedTest
  @MethodSource("testGetEventStatusInfoNullValues")
  void testGetOrCreateEventStatusInfoNullValuesCoverages(
      WorkflowDefinitionId stageId, UUID eventId) {
    assertThrows(
        NullPointerException.class,
        () -> eventStatusInfoCache.getOrCreateEventStatusInfo(stageId, eventId));
  }
}
