package gms.shared.event.repository;

import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.EventIdOriginIdKey;
import gms.shared.event.dao.NetMagDao;
import gms.shared.event.dao.OrigerrDao;
import gms.shared.event.utility.processing.EventBridgeDefinition;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class BridgedEhInformationTest {

  private EventBridgeDefinition eventBridgeDefinition =
      EventBridgeDefinition.builder()
          .setDatabaseUrlByStage(Map.of())
          .setPreviousDatabaseUrlByStage(Map.of())
          .setMonitoringOrganization("Monitoring Org")
          .setOrderedStages(
              List.of(
                  WorkflowDefinitionId.from("STAGE_ONE"),
                  WorkflowDefinitionId.from("STAGE_TWO"),
                  WorkflowDefinitionId.from("STAGE_Three")))
          .build();

  @Test
  void testBridgedEhInfoBuilder() {

    Assertions.assertDoesNotThrow(
        () ->
            BridgedEhInformation.builder()
                .setEventStages(new EventStages(eventBridgeDefinition))
                .setOriginDao(EventTestFixtures.DEFAULT_ORIGIN_DAO)
                .setOrigerrDao(EventTestFixtures.DEFAULT_ORIGERR_DAO)
                .setEventControlDao(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
                .setGaTagDao(EventTestFixtures.DEFAULT_REJECTED_GATAG_DAO)
                .setNetMagDaosByType(
                    Map.of(MagnitudeType.MB, EventTestFixtures.DEFAULT_NET_MAG_DAO))
                .setParentEventHypotheses(Set.of())
                .build());
  }

  @Test
  void testBridgedEhInfoBuilderWrongNetMag() {

    var wrongNetMag =
        NetMagDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_NET_MAG_DAO)
            .withOriginId(EventTestFixtures.DEFAULT_NET_MAG_DAO.getOriginId() + 1)
            .build();
    var bridgeBuilder =
        BridgedEhInformation.builder()
            .setEventStages(new EventStages(eventBridgeDefinition))
            .setOriginDao(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .setOrigerrDao(EventTestFixtures.DEFAULT_ORIGERR_DAO)
            .setEventControlDao(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .setGaTagDao(EventTestFixtures.DEFAULT_REJECTED_GATAG_DAO)
            .setNetMagDaosByType(Map.of(MagnitudeType.MB, wrongNetMag))
            .setParentEventHypotheses(Set.of());
    Assertions.assertThrows(IllegalStateException.class, bridgeBuilder::build);
  }

  @Test
  void testBridgedEhInfoBuilderWrongNEventControlData() {

    var wrongEventControlDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withEventIdOriginIdKey(
                new EventIdOriginIdKey.Builder()
                    .withOriginId(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO.getOriginId() + 1)
                    .withEventId(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO.getEventId())
                    .build())
            .build();
    var bridgeBuilder =
        BridgedEhInformation.builder()
            .setEventStages(new EventStages(eventBridgeDefinition))
            .setOriginDao(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .setOrigerrDao(EventTestFixtures.DEFAULT_ORIGERR_DAO)
            .setEventControlDao(wrongEventControlDao)
            .setGaTagDao(EventTestFixtures.DEFAULT_REJECTED_GATAG_DAO)
            .setNetMagDaosByType(Map.of(MagnitudeType.MB, EventTestFixtures.DEFAULT_NET_MAG_DAO))
            .setParentEventHypotheses(Set.of());
    Assertions.assertThrows(IllegalStateException.class, bridgeBuilder::build);
  }

  @Test
  void testBridgedEhInfoBuilderWrongOrigErr() {

    var wrongOrigErr =
        OrigerrDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ORIGERR_DAO)
            .withOriginId(EventTestFixtures.DEFAULT_ORIGIN_DAO.getOriginId() + 1)
            .build();
    var bridgeBuilder =
        BridgedEhInformation.builder()
            .setEventStages(new EventStages(eventBridgeDefinition))
            .setOriginDao(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .setOrigerrDao(wrongOrigErr)
            .setEventControlDao(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .setGaTagDao(EventTestFixtures.DEFAULT_REJECTED_GATAG_DAO)
            .setNetMagDaosByType(Map.of(MagnitudeType.MB, EventTestFixtures.DEFAULT_NET_MAG_DAO))
            .setParentEventHypotheses(Set.of());
    Assertions.assertThrows(IllegalStateException.class, bridgeBuilder::build);
  }
}
