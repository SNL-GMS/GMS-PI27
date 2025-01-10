package gms.shared.event.repository;

import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.ASSOC_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.EVENT_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.EVENT_CONTROL_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.GA_TAG_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.NETMAG_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.ORIGERR_CONNECTOR_TYPE;
import static gms.shared.event.repository.EventBridgeDatabaseConnectorTypes.ORIGIN_CONNECTOR_TYPE;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;

import gms.shared.event.connector.AssocDatabaseConnector;
import gms.shared.event.connector.EventControlDatabaseConnector;
import gms.shared.event.connector.EventDatabaseConnector;
import gms.shared.event.connector.GaTagDatabaseConnector;
import gms.shared.event.connector.NetMagDatabaseConnector;
import gms.shared.event.connector.OriginDatabaseConnector;
import gms.shared.event.connector.OriginErrDatabaseConnector;
import gms.shared.event.repository.config.EventEmfFactory;
import gms.shared.event.utility.processing.EventBridgeDefinition;
import gms.shared.utilities.javautilities.objectmapper.DatabaseLivenessCheck;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import jakarta.persistence.EntityManagerFactory;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EventBridgeDatabaseConnectorsTest {

  @Mock EventEmfFactory emfFactory;

  @Mock EntityManagerFactory entityManagerFactory;

  @Mock DatabaseLivenessCheck oracleLivenessCheck;

  WorkflowDefinitionId stageOneId;
  WorkflowDefinitionId stageTwoId;
  String stageOneName;
  String stageTwoName;
  EventBridgeDefinition eventBridgeDefinition;
  EventBridgeDatabaseConnectors databaseConnectors;

  @BeforeEach
  void init() {
    doReturn(entityManagerFactory).when(emfFactory).createEmf(any(), any());
    doReturn(true).when(oracleLivenessCheck).isLive();

    stageOneId = WorkflowDefinitionId.from("STAGE_ONE");
    stageOneName = stageOneId.getName();
    var stageOneAccount = "stage_one_account";
    stageTwoId = WorkflowDefinitionId.from("STAGE_TWO");
    stageTwoName = stageTwoId.getName();
    var stageTwoAccount = "stage_two_account";

    eventBridgeDefinition =
        EventBridgeDefinition.builder()
            .setMonitoringOrganization("MonitoringOrganization")
            .setOrderedStages(List.of(stageOneId, stageTwoId))
            .setDatabaseUrlByStage(
                Map.of(
                    stageOneId, stageOneAccount,
                    stageTwoId, stageTwoAccount))
            .setPreviousDatabaseUrlByStage(Map.of(stageTwoId, stageOneAccount))
            .build();

    databaseConnectors =
        new EventBridgeDatabaseConnectors(emfFactory, eventBridgeDefinition, oracleLivenessCheck);
  }

  @Test
  void testGetConnectorOrThrow() {

    AssocDatabaseConnector assocDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStageOrThrow(stageOneName, ASSOC_CONNECTOR_TYPE);

    EventDatabaseConnector eventDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStageOrThrow(stageOneName, EVENT_CONNECTOR_TYPE);
    EventControlDatabaseConnector eventControlDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStageOrThrow(
            stageOneName, EVENT_CONTROL_CONNECTOR_TYPE);
    GaTagDatabaseConnector gaTagDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStageOrThrow(stageOneName, GA_TAG_CONNECTOR_TYPE);
    NetMagDatabaseConnector netMagDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStageOrThrow(stageOneName, NETMAG_CONNECTOR_TYPE);
    OriginDatabaseConnector originDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStageOrThrow(stageOneName, ORIGIN_CONNECTOR_TYPE);
    OriginErrDatabaseConnector originErrDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStageOrThrow(stageOneName, ORIGERR_CONNECTOR_TYPE);

    assertAll(
        () -> {
          assertNotNull(assocDatabaseConnector);
          assertNotNull(eventDatabaseConnector);
          assertNotNull(eventControlDatabaseConnector);
          assertNotNull(gaTagDatabaseConnector);
          assertNotNull(netMagDatabaseConnector);
          assertNotNull(originDatabaseConnector);
          assertNotNull(originErrDatabaseConnector);

          var badStage = "BAD_STAGE";
          assertThrows(
              IllegalArgumentException.class,
              () ->
                  databaseConnectors.getConnectorForCurrentStageOrThrow(
                      badStage, EVENT_CONNECTOR_TYPE));
        });
  }

  @Test
  void testGetCurrentStageConnectors() {

    Optional<AssocDatabaseConnector> assocDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStage(stageOneName, ASSOC_CONNECTOR_TYPE);
    Optional<EventDatabaseConnector> eventDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStage(stageOneName, EVENT_CONNECTOR_TYPE);
    Optional<EventControlDatabaseConnector> eventControlDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStage(stageOneName, EVENT_CONTROL_CONNECTOR_TYPE);
    Optional<GaTagDatabaseConnector> gaTagDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStage(stageOneName, GA_TAG_CONNECTOR_TYPE);
    Optional<NetMagDatabaseConnector> netMagDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStage(stageOneName, NETMAG_CONNECTOR_TYPE);
    Optional<OriginDatabaseConnector> originDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStage(stageOneName, ORIGIN_CONNECTOR_TYPE);
    Optional<OriginErrDatabaseConnector> originErrDatabaseConnector =
        databaseConnectors.getConnectorForCurrentStage(stageOneName, ORIGERR_CONNECTOR_TYPE);

    Optional<EventDatabaseConnector> eventDatabaseConnectorForBadStage =
        databaseConnectors.getConnectorForCurrentStage("BAD_STAGE", EVENT_CONNECTOR_TYPE);

    assertAll(
        () -> {
          assertTrue(assocDatabaseConnector.isPresent());
          assertTrue(eventDatabaseConnector.isPresent());
          assertTrue(originDatabaseConnector.isPresent());
          assertTrue(originErrDatabaseConnector.isPresent());
          assertTrue(eventControlDatabaseConnector.isPresent());
          assertTrue(gaTagDatabaseConnector.isPresent());
          assertTrue(netMagDatabaseConnector.isPresent());

          assertTrue(eventDatabaseConnectorForBadStage.isEmpty());
        });
  }

  @Test
  void testGetPreviousStageConnectorOrThrow() {

    AssocDatabaseConnector assocDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStageOrThrow(stageTwoName, ASSOC_CONNECTOR_TYPE);
    EventDatabaseConnector eventDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStageOrThrow(stageTwoName, EVENT_CONNECTOR_TYPE);
    OriginDatabaseConnector originDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStageOrThrow(stageTwoName, ORIGIN_CONNECTOR_TYPE);
    OriginErrDatabaseConnector originErrDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStageOrThrow(
            stageTwoName, ORIGERR_CONNECTOR_TYPE);

    assertAll(
        () -> {
          assertNotNull(assocDatabaseConnector);
          assertNotNull(eventDatabaseConnector);
          assertNotNull(originDatabaseConnector);
          assertNotNull(originErrDatabaseConnector);
        });

    assertAll(
        () -> {
          assertThrows(
              IllegalArgumentException.class,
              () ->
                  databaseConnectors.getConnectorForPreviousStageOrThrow(
                      stageTwoName, EVENT_CONTROL_CONNECTOR_TYPE));
          assertThrows(
              IllegalArgumentException.class,
              () ->
                  databaseConnectors.getConnectorForPreviousStageOrThrow(
                      stageTwoName, GA_TAG_CONNECTOR_TYPE));
          assertThrows(
              IllegalArgumentException.class,
              () ->
                  databaseConnectors.getConnectorForPreviousStageOrThrow(
                      stageTwoName, NETMAG_CONNECTOR_TYPE));

          var badStage = "BAD_STAGE";
          assertThrows(
              IllegalArgumentException.class,
              () ->
                  databaseConnectors.getConnectorForPreviousStageOrThrow(
                      badStage, EVENT_CONNECTOR_TYPE));
        });
  }

  @Test
  void testGetPreviousStageConnectors() {

    Optional<AssocDatabaseConnector> assocDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStage(stageTwoName, ASSOC_CONNECTOR_TYPE);
    Optional<EventDatabaseConnector> eventDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStage(stageTwoName, EVENT_CONNECTOR_TYPE);
    Optional<EventControlDatabaseConnector> eventControlDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStage(stageTwoName, EVENT_CONTROL_CONNECTOR_TYPE);
    Optional<GaTagDatabaseConnector> gaTagDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStage(stageTwoName, GA_TAG_CONNECTOR_TYPE);
    Optional<NetMagDatabaseConnector> netMagDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStage(stageTwoName, NETMAG_CONNECTOR_TYPE);
    Optional<OriginDatabaseConnector> originDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStage(stageTwoName, ORIGIN_CONNECTOR_TYPE);
    Optional<OriginErrDatabaseConnector> originErrDatabaseConnector =
        databaseConnectors.getConnectorForPreviousStage(stageTwoName, ORIGERR_CONNECTOR_TYPE);

    Optional<EventDatabaseConnector> eventDatabaseConnectorForBadStage =
        databaseConnectors.getConnectorForPreviousStage("BAD_STAGE", EVENT_CONNECTOR_TYPE);

    assertAll(
        () -> {
          assertTrue(assocDatabaseConnector.isPresent());
          assertTrue(eventDatabaseConnector.isPresent());
          assertTrue(originDatabaseConnector.isPresent());
          assertTrue(originErrDatabaseConnector.isPresent());

          assertTrue(eventControlDatabaseConnector.isEmpty());
          assertTrue(gaTagDatabaseConnector.isEmpty());
          assertTrue(netMagDatabaseConnector.isEmpty());

          assertTrue(eventDatabaseConnectorForBadStage.isEmpty());
        });
  }

  @Test
  void testConnectorExistsForPreviousStage() {

    assertAll(
        () -> {
          assertTrue(
              databaseConnectors.connectorExistsForPreviousStage(
                  stageTwoName, ASSOC_CONNECTOR_TYPE));
          assertTrue(
              databaseConnectors.connectorExistsForPreviousStage(
                  stageTwoName, EVENT_CONNECTOR_TYPE));
          assertTrue(
              databaseConnectors.connectorExistsForPreviousStage(
                  stageTwoName, ORIGIN_CONNECTOR_TYPE));
          assertTrue(
              databaseConnectors.connectorExistsForPreviousStage(
                  stageTwoName, ORIGERR_CONNECTOR_TYPE));

          assertFalse(
              databaseConnectors.connectorExistsForPreviousStage(
                  stageTwoName, EVENT_CONTROL_CONNECTOR_TYPE));
          assertFalse(
              databaseConnectors.connectorExistsForPreviousStage(
                  stageTwoName, GA_TAG_CONNECTOR_TYPE));
          assertFalse(
              databaseConnectors.connectorExistsForPreviousStage(
                  stageTwoName, NETMAG_CONNECTOR_TYPE));

          assertFalse(
              databaseConnectors.connectorExistsForPreviousStage(
                  "BAD_STAGE", EVENT_CONNECTOR_TYPE));
        });
  }
}
