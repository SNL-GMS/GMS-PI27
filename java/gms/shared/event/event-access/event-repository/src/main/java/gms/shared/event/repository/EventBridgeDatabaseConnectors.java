package gms.shared.event.repository;

import gms.shared.event.connector.ArInfoDatabaseConnector;
import gms.shared.event.connector.AssocDatabaseConnector;
import gms.shared.event.connector.EventControlDatabaseConnector;
import gms.shared.event.connector.EventDatabaseConnector;
import gms.shared.event.connector.GaTagDatabaseConnector;
import gms.shared.event.connector.NetMagDatabaseConnector;
import gms.shared.event.connector.OriginDatabaseConnector;
import gms.shared.event.connector.OriginErrDatabaseConnector;
import gms.shared.event.connector.StaMagDatabaseConnector;
import gms.shared.event.repository.config.EventEmfFactory;
import gms.shared.event.utility.processing.EventBridgeDefinition;
import gms.shared.utilities.bridge.database.connector.BridgedDatabaseConnectors;
import gms.shared.utilities.javautilities.objectmapper.DatabaseLivenessCheck;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** Establishes database connectors for the event bridge */
@Component
public class EventBridgeDatabaseConnectors extends BridgedDatabaseConnectors {

  private static final Logger LOGGER = LoggerFactory.getLogger(EventBridgeDatabaseConnectors.class);
  private static final String DEBUG_MSG_CURRENT_STAGE =
      "Adding Event Database 'gms_event' info of input stage [{}] for current stage [{}],"
          + " JDBC URL [{}]";
  private static final String WARN_MSG_CURRENT_STAGE =
      "No URL mapping found for stage [{}], verify configuration is correct.";
  private static final String DEBUG_MSG_PREVIOUS_STAGE =
      "Adding Event Database 'gms_event_prev' info of input stage [{}] for previous stage [{}],"
          + " JDBC URL [{}]";
  private static final String WARN_MSG_PREVIOUS_STAGE =
      "No URL mapping found for stage [{}]. Verify configuration is correct"
          + " if this stage is expected to have a previous stage DB.";

  @Autowired
  public EventBridgeDatabaseConnectors(
      EventEmfFactory emfFactory,
      EventBridgeDefinition eventBridgeDefinition,
      DatabaseLivenessCheck livenessCheck) {

    if (!livenessCheck.isLive()) {
      LOGGER.info("Could not establish database liveness.  Exiting.");
      System.exit(1);
    }
    LOGGER.info("Connection to database successful");

    // create first batch of current stage database connectors
    eventBridgeDefinition
        .getDatabaseUrlByStage()
        .keySet()
        .forEach(
            (WorkflowDefinitionId stage) -> {
              var stageName = stage.getName();
              Optional.ofNullable(eventBridgeDefinition.getDatabaseUrlByStage().get(stage))
                  .ifPresentOrElse(
                      (String databaseUrl) -> {
                        addCurrentStageConnectors(emfFactory, databaseUrl, stageName);
                        LOGGER.debug(DEBUG_MSG_CURRENT_STAGE, stage, stageName, databaseUrl);
                      },
                      () -> LOGGER.warn(WARN_MSG_CURRENT_STAGE, stage));
              Optional.ofNullable(eventBridgeDefinition.getPreviousDatabaseUrlByStage().get(stage))
                  .ifPresentOrElse(
                      (String databaseUrl) -> {
                        addPreviousStageConnectors(emfFactory, databaseUrl, stageName);
                        LOGGER.debug(DEBUG_MSG_PREVIOUS_STAGE, stage, stageName, databaseUrl);
                      },
                      () -> LOGGER.warn(WARN_MSG_PREVIOUS_STAGE, stage));
            });
  }

  private void addCurrentStageConnectors(
      EventEmfFactory emfFactory, String databaseUrl, String stageName) {

    var currentStageEntityManagerFactory = emfFactory.createEmf(databaseUrl, "gms_event");

    addConnectorForCurrentStage(
        stageName, new EventDatabaseConnector(currentStageEntityManagerFactory));
    addConnectorForCurrentStage(
        stageName, new EventControlDatabaseConnector(currentStageEntityManagerFactory));
    addConnectorForCurrentStage(
        stageName, new OriginDatabaseConnector(currentStageEntityManagerFactory));
    addConnectorForCurrentStage(
        stageName, new OriginErrDatabaseConnector(currentStageEntityManagerFactory));
    addConnectorForCurrentStage(
        stageName, new GaTagDatabaseConnector(currentStageEntityManagerFactory));
    addConnectorForCurrentStage(
        stageName, new AssocDatabaseConnector(currentStageEntityManagerFactory));
    addConnectorForCurrentStage(
        stageName, new NetMagDatabaseConnector(currentStageEntityManagerFactory));
    addConnectorForCurrentStage(
        stageName, new StaMagDatabaseConnector(currentStageEntityManagerFactory));
    addConnectorForCurrentStage(
        stageName, new ArInfoDatabaseConnector(currentStageEntityManagerFactory));
  }

  private void addPreviousStageConnectors(
      EventEmfFactory emfFactory, String databaseUrl, String stageName) {

    var previousStageEntityManagerFactory = emfFactory.createEmf(databaseUrl, "gms_event_prev");

    addConnectorForPreviousStage(
        stageName, new EventDatabaseConnector(previousStageEntityManagerFactory));
    addConnectorForPreviousStage(
        stageName, new OriginDatabaseConnector(previousStageEntityManagerFactory));
    addConnectorForPreviousStage(
        stageName, new OriginErrDatabaseConnector(previousStageEntityManagerFactory));
    addConnectorForPreviousStage(
        stageName, new AssocDatabaseConnector(previousStageEntityManagerFactory));
  }

  @Override
  public <T> Class<?> getClassForConnector(T databaseConnector) {

    Class<?> connectorClass;
    if (databaseConnector instanceof ArInfoDatabaseConnector) {
      connectorClass = ArInfoDatabaseConnector.class;
    } else if (databaseConnector instanceof AssocDatabaseConnector) {
      connectorClass = AssocDatabaseConnector.class;
    } else if (databaseConnector instanceof EventDatabaseConnector) {
      connectorClass = EventDatabaseConnector.class;
    } else if (databaseConnector instanceof EventControlDatabaseConnector) {
      connectorClass = EventControlDatabaseConnector.class;
    } else if (databaseConnector instanceof GaTagDatabaseConnector) {
      connectorClass = GaTagDatabaseConnector.class;
    } else if (databaseConnector instanceof NetMagDatabaseConnector) {
      connectorClass = NetMagDatabaseConnector.class;
    } else if (databaseConnector instanceof OriginDatabaseConnector) {
      connectorClass = OriginDatabaseConnector.class;
    } else if (databaseConnector instanceof OriginErrDatabaseConnector) {
      connectorClass = OriginErrDatabaseConnector.class;
    } else if (databaseConnector instanceof StaMagDatabaseConnector) {
      connectorClass = StaMagDatabaseConnector.class;
    } else {
      throw new IllegalArgumentException(
          String.format(
              "Connector type [%s] has not been registered in %s",
              databaseConnector.getClass().getSimpleName(), this.getClass().getSimpleName()));
    }
    return connectorClass;
  }
}
