package gms.shared.signaldetection.repository;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import gms.shared.emf.staged.EntityManagerFactoriesByStageId;
import gms.shared.signaldetection.database.connector.AmplitudeDatabaseConnector;
import gms.shared.signaldetection.database.connector.AmplitudeDynParsIntDatabaseConnector;
import gms.shared.signaldetection.database.connector.ArrivalDatabaseConnector;
import gms.shared.signaldetection.database.connector.ArrivalDynParsIntDatabaseConnector;
import gms.shared.signaldetection.database.connector.AssocDatabaseConnector;
import gms.shared.signaldetection.database.connector.config.SignalDetectionBridgeDefinition;
import gms.shared.utilities.bridge.database.connector.BridgedDatabaseConnectors;
import gms.shared.utilities.javautilities.objectmapper.DatabaseLivenessCheck;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import jakarta.persistence.EntityManagerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SignalDetectionBridgeDatabaseConnectors extends BridgedDatabaseConnectors {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalDetectionBridgeDatabaseConnectors.class);

  @Autowired
  public SignalDetectionBridgeDatabaseConnectors(
      SignalDetectionBridgeDefinition signalDetectionBridgeDefinition,
      ObjectProvider<AmplitudeDatabaseConnector> amplitudeDatabaseConnectorProvider,
      ObjectProvider<AmplitudeDynParsIntDatabaseConnector> ampDpiDatabaseConnectorProvider,
      ObjectProvider<ArrivalDatabaseConnector> arrivalDatabaseConnectorProvider,
      ObjectProvider<ArrivalDynParsIntDatabaseConnector> arrDpiDatabaseConnectorProvider,
      ObjectProvider<AssocDatabaseConnector> assocDatabaseConnectorProvider,
      EntityManagerFactoriesByStageId emfByStageId,
      DatabaseLivenessCheck databaseLivenessCheck) {
    super();

    if (!databaseLivenessCheck.isLive()) {
      LOGGER.info("Could not establish database liveness.  Exiting.");
      System.exit(1);
    }
    LOGGER.info("Connection to database successful");

    var currentStageEmfMap = emfByStageId.getStageIdEmfMap();

    // Initialize the connectors using signal detection bridge definition and entity manager factory
    // provider
    initializeDatabaseConnectors(
        signalDetectionBridgeDefinition,
        amplitudeDatabaseConnectorProvider,
        ampDpiDatabaseConnectorProvider,
        arrivalDatabaseConnectorProvider,
        arrDpiDatabaseConnectorProvider,
        assocDatabaseConnectorProvider,
        currentStageEmfMap);
  }

  private void initializeDatabaseConnectors(
      SignalDetectionBridgeDefinition signalDetectionBridgeDefinition,
      ObjectProvider<AmplitudeDatabaseConnector> amplitudeDatabaseConnectorProvider,
      ObjectProvider<AmplitudeDynParsIntDatabaseConnector> ampDpiDatabaseConnectorProvider,
      ObjectProvider<ArrivalDatabaseConnector> arrivalDatabaseConnectorProvider,
      ObjectProvider<ArrivalDynParsIntDatabaseConnector> arrDpiDatabaseConnectorProvider,
      ObjectProvider<AssocDatabaseConnector> assocDatabaseConnectorProvider,
      ImmutableMap<WorkflowDefinitionId, EntityManagerFactory> currentStageEmfMap) {

    // loop through ordered stages and create maps of signal detection connectors for
    // current/previous stages
    var orderedStages = signalDetectionBridgeDefinition.getOrderedStages();

    // create current stage database connectors
    orderedStages.forEach(
        (var stageId) -> {
          var ampConnector =
              amplitudeDatabaseConnectorProvider.getObject(currentStageEmfMap.get(stageId));
          var ampDpiConnector =
              ampDpiDatabaseConnectorProvider.getObject(currentStageEmfMap.get(stageId));
          var arrivalConnector =
              arrivalDatabaseConnectorProvider.getObject(currentStageEmfMap.get(stageId));
          var arrDpiConnector =
              arrDpiDatabaseConnectorProvider.getObject(currentStageEmfMap.get(stageId));
          var assocConnector =
              assocDatabaseConnectorProvider.getObject(currentStageEmfMap.get(stageId));

          createStageDatabaseConnectors(
              stageId,
              orderedStages,
              ampConnector,
              ampDpiConnector,
              arrivalConnector,
              arrDpiConnector,
              assocConnector);
        });
  }

  private void createStageDatabaseConnectors(
      WorkflowDefinitionId stageId,
      ImmutableList<WorkflowDefinitionId> orderedStages,
      AmplitudeDatabaseConnector ampConnector,
      AmplitudeDynParsIntDatabaseConnector ampDpiConnector,
      ArrivalDatabaseConnector arrivalConnector,
      ArrivalDynParsIntDatabaseConnector arrDpiConnector,
      AssocDatabaseConnector assocConnector) {
    var stageName = stageId.getName();

    addConnectorForCurrentStage(stageName, ampConnector);
    addConnectorForCurrentStage(stageName, ampDpiConnector);
    addConnectorForCurrentStage(stageName, arrivalConnector);
    addConnectorForCurrentStage(stageName, arrDpiConnector);
    addConnectorForCurrentStage(stageName, assocConnector);

    var ind = orderedStages.indexOf(stageId);

    if (ind < orderedStages.size() - 1) {
      addConnectorForPreviousStage(orderedStages.get(ind + 1).getName(), ampConnector);
      addConnectorForPreviousStage(orderedStages.get(ind + 1).getName(), ampDpiConnector);
      addConnectorForPreviousStage(orderedStages.get(ind + 1).getName(), arrivalConnector);
      addConnectorForPreviousStage(orderedStages.get(ind + 1).getName(), arrDpiConnector);
      addConnectorForPreviousStage(orderedStages.get(ind + 1).getName(), assocConnector);
    }
  }

  @Override
  public <T> Class<?> getClassForConnector(T databaseConnector) {
    Class<?> connectorClass;
    if (databaseConnector instanceof AmplitudeDatabaseConnector) {
      connectorClass = AmplitudeDatabaseConnector.class;
    } else if (databaseConnector instanceof AmplitudeDynParsIntDatabaseConnector) {
      connectorClass = AmplitudeDynParsIntDatabaseConnector.class;
    } else if (databaseConnector instanceof ArrivalDatabaseConnector) {
      connectorClass = ArrivalDatabaseConnector.class;
    } else if (databaseConnector instanceof ArrivalDynParsIntDatabaseConnector) {
      connectorClass = ArrivalDynParsIntDatabaseConnector.class;
    } else if (databaseConnector instanceof AssocDatabaseConnector) {
      connectorClass = AssocDatabaseConnector.class;
    } else {
      throw new IllegalArgumentException(
          String.format(
              "Connector type [%s] has not been registered in %s",
              databaseConnector.getClass().getSimpleName(), this.getClass().getSimpleName()));
    }

    return connectorClass;
  }
}
