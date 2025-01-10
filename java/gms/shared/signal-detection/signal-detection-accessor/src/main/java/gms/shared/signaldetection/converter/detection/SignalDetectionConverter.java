package gms.shared.signaldetection.converter.detection;

import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.database.connector.config.SignalDetectionBridgeDefinition;
import gms.shared.signaldetection.repository.utils.SignalDetectionComponents;
import gms.shared.signaldetection.repository.utils.SignalDetectionIdUtility;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SignalDetectionConverter {

  private final SignalDetectionHypothesisConverter signalDetectionHypothesisConverter;
  private final SignalDetectionIdUtility signalDetectionIdUtility;
  private final List<WorkflowDefinitionId> orderedStages;
  private final Map<WorkflowDefinitionId, String> databaseAccountByStage;

  @Autowired
  public SignalDetectionConverter(
      SignalDetectionHypothesisConverter signalDetectionHypothesisConverter,
      SignalDetectionIdUtility signalDetectionIdUtility,
      SignalDetectionBridgeDefinition signalDetectionBridgeDefinition) {
    this.signalDetectionHypothesisConverter = signalDetectionHypothesisConverter;
    this.signalDetectionIdUtility = signalDetectionIdUtility;
    this.orderedStages = signalDetectionBridgeDefinition.getOrderedStages();
    this.databaseAccountByStage = signalDetectionBridgeDefinition.getDatabaseAccountByStage();
  }

  // for testing purposes
  private SignalDetectionConverter(
      SignalDetectionHypothesisConverter signalDetectionHypothesisConverter,
      SignalDetectionIdUtility signalDetectionIdUtility,
      List<WorkflowDefinitionId> orderedStages,
      Map<WorkflowDefinitionId, String> databaseAccountByStage) {
    this.signalDetectionHypothesisConverter = signalDetectionHypothesisConverter;
    this.signalDetectionIdUtility = signalDetectionIdUtility;
    this.orderedStages = orderedStages;
    this.databaseAccountByStage = databaseAccountByStage;
  }

  /**
   * Create {@link SignalDetectionConverter} instance using {@link
   * SignalDetectionHypothesisConverter} to create the hypotheses needed for a {@link
   * SignalDetection} object
   *
   * @param signalDetectionHypothesisConverter {@link SignalDetectionHypothesisConverter}
   * @return {@link SignalDetectionConverter}
   */
  public static SignalDetectionConverter create(
      SignalDetectionHypothesisConverter signalDetectionHypothesisConverter,
      SignalDetectionIdUtility signalDetectionIdUtility,
      List<WorkflowDefinitionId> orderedStages,
      Map<WorkflowDefinitionId, String> databaseAccountByStage) {

    Objects.requireNonNull(signalDetectionHypothesisConverter);
    Objects.requireNonNull(signalDetectionIdUtility);
    Objects.requireNonNull(orderedStages);
    Objects.requireNonNull(databaseAccountByStage);

    return new SignalDetectionConverter(
        signalDetectionHypothesisConverter,
        signalDetectionIdUtility,
        orderedStages,
        databaseAccountByStage);
  }

  /**
   * Convert method definition for converting legacy DB to COI objects for SignalDetection.
   *
   * @param signalDetectionComponents the {@link SignalDetectionComponents} object that contains
   *     necessary information for creation of {@link SignalDetection}s
   * @return a SignalDetection object
   */
  public Optional<SignalDetection> convert(SignalDetectionComponents signalDetectionComponents) {

    Objects.requireNonNull(signalDetectionComponents);
    Objects.requireNonNull(signalDetectionComponents.getCurrentArrival());
    Objects.requireNonNull(signalDetectionComponents.getPreviousArrival());
    Objects.requireNonNull(signalDetectionComponents.getCurrentStage());
    Objects.requireNonNull(signalDetectionComponents.getCurrentAssocs());
    Objects.requireNonNull(signalDetectionComponents.getPreviousAssocs());
    Objects.requireNonNull(signalDetectionComponents.getAmplitudeDaos());
    Objects.requireNonNull(signalDetectionComponents.getStation());
    Objects.requireNonNull(signalDetectionComponents.getMonitoringOrganization());

    ArrivalDao currentArrival = signalDetectionComponents.getCurrentArrival();
    Optional<ArrivalDao> previousArrival = signalDetectionComponents.getPreviousArrival();

    long arid = currentArrival.getId();
    UUID detectionId = signalDetectionIdUtility.getOrCreateSignalDetectionIdfromArid(arid);

    List<Optional<SignalDetectionHypothesis>> possibleHypotheses = new ArrayList<>();
    var currentStage = signalDetectionComponents.getCurrentStage();
    var previousStageOptional = signalDetectionComponents.getPreviousStage();

    if (previousStageOptional.isPresent() && orderedStages.contains(previousStageOptional.get())) {

      if (previousArrival.isPresent() && previousArrival.get().getId() == arid) {

        // add SDH based on previous stage arrival
        String legacyDatabaseAccountId = databaseAccountByStage.get(previousStageOptional.get());
        possibleHypotheses.add(
            signalDetectionHypothesisConverter.convertToEntityReference(
                legacyDatabaseAccountId, detectionId, previousArrival.get()));

        // add all SDH based on Assocs with same arid as previous arrival
        possibleHypotheses.addAll(
            signalDetectionComponents.getPreviousAssocs().stream()
                .filter(assocDao -> assocDao.getId().getArrivalId() == arid)
                .map(
                    assocDao ->
                        signalDetectionHypothesisConverter.convertToEntityReference(
                            legacyDatabaseAccountId, detectionId, previousArrival.get(), assocDao))
                .toList());
      }

      // only add SDH based on current Arrival if there was no arrival in previous stage
      // or no assocs in current stage
      // or iphase differs from arrival in previous stage
      if (previousArrival.isEmpty()
          || signalDetectionComponents.getCurrentAssocs().isEmpty()
          || !previousArrival.get().getPhase().equals(currentArrival.getPhase())) {

        possibleHypotheses.add(
            signalDetectionHypothesisConverter.convertToEntityReference(
                databaseAccountByStage.get(currentStage), detectionId, currentArrival));
      }

    } else {

      // add arrival based SDH for first stage
      possibleHypotheses.add(
          signalDetectionHypothesisConverter.convertToEntityReference(
              databaseAccountByStage.get(currentStage), detectionId, currentArrival));
    }

    // now add all SDHs based on assocs for current stage
    possibleHypotheses.addAll(
        signalDetectionComponents.getCurrentAssocs().stream()
            .filter(assocDao -> assocDao.getId().getArrivalId() == arid)
            .map(
                assocDao ->
                    signalDetectionHypothesisConverter.convertToEntityReference(
                        databaseAccountByStage.get(currentStage),
                        detectionId,
                        currentArrival,
                        assocDao))
            .toList());

    List<SignalDetectionHypothesis> hypotheses =
        possibleHypotheses.stream().flatMap(Optional::stream).toList();

    return Optional.ofNullable(
        SignalDetection.from(
            detectionId,
            Optional.of(
                SignalDetection.Data.builder()
                    .setStation(signalDetectionComponents.getStation())
                    .setMonitoringOrganization(
                        signalDetectionComponents.getMonitoringOrganization())
                    .setSignalDetectionHypotheses(hypotheses)
                    .build())));
  }
}
