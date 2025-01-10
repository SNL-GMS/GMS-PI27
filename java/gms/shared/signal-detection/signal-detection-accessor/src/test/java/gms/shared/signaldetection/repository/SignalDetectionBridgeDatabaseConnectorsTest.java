package gms.shared.signaldetection.repository;

import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.AMPLITUDE_CONNECTOR_TYPE;
import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.ARRIVAL_CONNECTOR_TYPE;
import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE;
import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.ASSOC_CONNECTOR_TYPE;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

import com.google.common.collect.ImmutableMap;
import gms.shared.emf.staged.EntityManagerFactoriesByStageId;
import gms.shared.signaldetection.database.connector.AmplitudeDatabaseConnector;
import gms.shared.signaldetection.database.connector.AmplitudeDynParsIntDatabaseConnector;
import gms.shared.signaldetection.database.connector.ArrivalDatabaseConnector;
import gms.shared.signaldetection.database.connector.ArrivalDynParsIntDatabaseConnector;
import gms.shared.signaldetection.database.connector.AssocDatabaseConnector;
import gms.shared.signaldetection.database.connector.config.SignalDetectionBridgeDefinition;
import gms.shared.utilities.bridge.database.connector.DatabaseConnector;
import gms.shared.utilities.bridge.database.connector.DatabaseConnectorType;
import gms.shared.utilities.javautilities.objectmapper.DatabaseLivenessCheck;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import jakarta.persistence.EntityManagerFactory;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

@ExtendWith(MockitoExtension.class)
class SignalDetectionBridgeDatabaseConnectorsTest {

  @Mock EntityManagerFactory entityManagerFactory;

  @Mock ObjectProvider<AmplitudeDatabaseConnector> amplitudeDatabaseConnectorProvider;

  @Mock AmplitudeDatabaseConnector amplitudeDatabaseConnector;

  @Mock ObjectProvider<AmplitudeDynParsIntDatabaseConnector> ampDpiDatabaseConnectorProvider;

  @Mock AmplitudeDynParsIntDatabaseConnector ampDpiDatabaseConnector;

  @Mock ObjectProvider<ArrivalDatabaseConnector> arrivalDatabaseConnectorProvider;

  @Mock ArrivalDatabaseConnector arrivalDatabaseConnector;

  @Mock ObjectProvider<ArrivalDynParsIntDatabaseConnector> arrDpiDatabaseConnectorProvider;

  @Mock ArrivalDynParsIntDatabaseConnector arrDpiDatabaseConnector;

  @Mock ObjectProvider<AssocDatabaseConnector> assocDatabaseConnectorProvider;

  @Mock AssocDatabaseConnector assocDatabaseConnector;

  @Mock Object unknownDatabaseConnector;

  @Mock DatabaseLivenessCheck databaseLivenessCheck;

  private static final WorkflowDefinitionId STAGE_ONE_ID = WorkflowDefinitionId.from("STAGE_ONE");
  private static final WorkflowDefinitionId STAGE_TWO_ID = WorkflowDefinitionId.from("STAGE_TWO");
  private static final String STAGE_ONE_NAME = STAGE_ONE_ID.getName();
  private static final String STAGE_TWO_NAME = STAGE_TWO_ID.getName();
  private static final Duration measuredWaveformLeadDuration = Duration.ofMillis(500);
  private static final Duration measuredWaveformLagDuration = Duration.ofMillis(300);
  private static final DatabaseConnectorType<?> BAD_CONNECTOR_TYPE = () -> Object.class;

  SignalDetectionBridgeDefinition signalDetectionBridgeDefinition;
  SignalDetectionBridgeDatabaseConnectors databaseConnectors;
  ImmutableMap<WorkflowDefinitionId, EntityManagerFactory> stageEmfMap;
  EntityManagerFactoriesByStageId entityManagerFactoriesByStageId;

  @BeforeEach
  void init() {

    // initialize db connectors
    doReturn(amplitudeDatabaseConnector).when(amplitudeDatabaseConnectorProvider).getObject(any());
    doReturn(ampDpiDatabaseConnector).when(ampDpiDatabaseConnectorProvider).getObject(any());
    doReturn(arrivalDatabaseConnector).when(arrivalDatabaseConnectorProvider).getObject(any());
    doReturn(arrDpiDatabaseConnector).when(arrDpiDatabaseConnectorProvider).getObject(any());
    doReturn(assocDatabaseConnector).when(assocDatabaseConnectorProvider).getObject(any());

    // set the signal detection bridge definition for database accounts by stage
    String stageOneAccount = "stage_one_account";
    String stageTwoAccount = "stage_two_account";
    String monitoringOrganization = "MonitoringOrganization";
    signalDetectionBridgeDefinition =
        SignalDetectionBridgeDefinition.builder()
            .setMonitoringOrganization(monitoringOrganization)
            .setOrderedStages(List.of(STAGE_ONE_ID, STAGE_TWO_ID))
            .setDatabaseAccountByStage(
                Map.of(
                    STAGE_ONE_ID, stageOneAccount,
                    STAGE_TWO_ID, stageTwoAccount))
            .setMeasuredWaveformLagDuration(measuredWaveformLagDuration)
            .setMeasuredWaveformLeadDuration(measuredWaveformLeadDuration)
            .build();

    stageEmfMap =
        ImmutableMap.of(
            STAGE_ONE_ID, entityManagerFactory,
            STAGE_TWO_ID, entityManagerFactory);

    entityManagerFactoriesByStageId =
        EntityManagerFactoriesByStageId.builder().setStageIdEmfMap(stageEmfMap).build();

    when(databaseLivenessCheck.isLive()).thenReturn(true);

    databaseConnectors =
        new SignalDetectionBridgeDatabaseConnectors(
            signalDetectionBridgeDefinition,
            amplitudeDatabaseConnectorProvider,
            ampDpiDatabaseConnectorProvider,
            arrivalDatabaseConnectorProvider,
            arrDpiDatabaseConnectorProvider,
            assocDatabaseConnectorProvider,
            entityManagerFactoriesByStageId,
            databaseLivenessCheck);
  }

  @Test
  void testGetClassForConnectorThrowsOnUnknown() {
    assertThrows(
        IllegalArgumentException.class,
        () -> databaseConnectors.getClassForConnector(unknownDatabaseConnector));
  }

  @ParameterizedTest
  @MethodSource("currentStageConnectorTestSource")
  void testGetConnectorForCurrentStage(
      String stageName,
      DatabaseConnectorType<DatabaseConnector> connectorType,
      Optional<Class<? extends DatabaseConnector>> connectorClassOpt) {
    connectorClassOpt.ifPresentOrElse(
        connectorClass -> {
          var connector = databaseConnectors.getConnectorForCurrentStage(stageName, connectorType);
          assertTrue(connectorClass.isAssignableFrom(connector.orElseThrow().getClass()));
        },
        () ->
            assertFalse(
                databaseConnectors
                    .getConnectorForCurrentStage(stageName, connectorType)
                    .isPresent()));
  }

  @ParameterizedTest
  @MethodSource("currentStageConnectorTestSource")
  void testGetConnectorForCurrentStageOrThrow(
      String stageName,
      DatabaseConnectorType<DatabaseConnector> connectorType,
      Optional<Class<? extends DatabaseConnector>> connectorClassOpt) {
    connectorClassOpt.ifPresentOrElse(
        connectorClass -> {
          var connector =
              assertDoesNotThrow(
                  () ->
                      databaseConnectors.getConnectorForCurrentStageOrThrow(
                          stageName, connectorType));
          assertNotNull(connector);
          assertTrue(connectorClass.isAssignableFrom(connector.getClass()));
        },
        () ->
            assertThrows(
                IllegalArgumentException.class,
                () ->
                    databaseConnectors.getConnectorForCurrentStageOrThrow(
                        stageName, connectorType)));
  }

  private static Stream<Arguments> currentStageConnectorTestSource() {
    return Stream.of(
        Arguments.arguments(
            STAGE_ONE_NAME,
            AMPLITUDE_CONNECTOR_TYPE,
            Optional.of(AMPLITUDE_CONNECTOR_TYPE.getConnectorClass())),
        Arguments.arguments(
            STAGE_ONE_NAME,
            ARRIVAL_CONNECTOR_TYPE,
            Optional.of(ARRIVAL_CONNECTOR_TYPE.getConnectorClass())),
        Arguments.arguments(
            STAGE_ONE_NAME,
            ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE,
            Optional.of(ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE.getConnectorClass())),
        Arguments.arguments(
            STAGE_ONE_NAME,
            ASSOC_CONNECTOR_TYPE,
            Optional.of(ASSOC_CONNECTOR_TYPE.getConnectorClass())),
        Arguments.arguments("BAD STAGE", BAD_CONNECTOR_TYPE, Optional.empty()));
  }

  @ParameterizedTest
  @MethodSource("previousStageConnectorTestSource")
  void testGetConnectorForPreviousStage(
      String stageName,
      DatabaseConnectorType<DatabaseConnector> connectorType,
      Optional<Class<? extends DatabaseConnector>> connectorClassOpt) {
    connectorClassOpt.ifPresentOrElse(
        connectorClass -> {
          assertTrue(databaseConnectors.connectorExistsForPreviousStage(stageName, connectorType));
          var connector = databaseConnectors.getConnectorForPreviousStage(stageName, connectorType);
          assertTrue(connectorClass.isAssignableFrom(connector.orElseThrow().getClass()));
        },
        () -> {
          assertFalse(databaseConnectors.connectorExistsForPreviousStage(stageName, connectorType));
          assertFalse(
              databaseConnectors
                  .getConnectorForPreviousStage(stageName, connectorType)
                  .isPresent());
        });
  }

  @ParameterizedTest
  @MethodSource("previousStageConnectorTestSource")
  void testGetConnectorForPreviousStageOrThrow(
      String stageName,
      DatabaseConnectorType<DatabaseConnector> connectorType,
      Optional<Class<? extends DatabaseConnector>> connectorClassOpt) {
    connectorClassOpt.ifPresentOrElse(
        connectorClass -> {
          assertTrue(databaseConnectors.connectorExistsForPreviousStage(stageName, connectorType));
          var connector =
              assertDoesNotThrow(
                  () ->
                      databaseConnectors.getConnectorForPreviousStageOrThrow(
                          stageName, connectorType));
          assertNotNull(connector);
          assertTrue(connectorClass.isAssignableFrom(connector.getClass()));
        },
        () -> {
          assertFalse(databaseConnectors.connectorExistsForPreviousStage(stageName, connectorType));
          assertThrows(
              IllegalArgumentException.class,
              () ->
                  databaseConnectors.getConnectorForPreviousStageOrThrow(stageName, connectorType));
        });
  }

  private static Stream<Arguments> previousStageConnectorTestSource() {
    return Stream.of(
        Arguments.arguments(
            STAGE_TWO_NAME,
            AMPLITUDE_CONNECTOR_TYPE,
            Optional.of(AMPLITUDE_CONNECTOR_TYPE.getConnectorClass())),
        Arguments.arguments(
            STAGE_TWO_NAME,
            ARRIVAL_CONNECTOR_TYPE,
            Optional.of(ARRIVAL_CONNECTOR_TYPE.getConnectorClass())),
        Arguments.arguments(
            STAGE_TWO_NAME,
            ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE,
            Optional.of(ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE.getConnectorClass())),
        Arguments.arguments(
            STAGE_TWO_NAME,
            ASSOC_CONNECTOR_TYPE,
            Optional.of(ASSOC_CONNECTOR_TYPE.getConnectorClass())),
        Arguments.arguments("BAD STAGE", BAD_CONNECTOR_TYPE, Optional.empty()));
  }
}
