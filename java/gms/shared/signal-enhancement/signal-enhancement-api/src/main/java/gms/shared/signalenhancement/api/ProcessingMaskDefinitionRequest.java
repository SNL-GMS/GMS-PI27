package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Represents the request object sent to services containing the information needed to resolve
 * definitions.
 */
@AutoValue
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class ProcessingMaskDefinitionRequest {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(ProcessingMaskDefinitionRequest.class);

  public abstract Set<ProcessingOperation> getProcessingOperations();

  public abstract Set<Channel> getChannels();

  public abstract Set<PhaseType> getPhaseTypes();

  @JsonIgnore
  public abstract Set<String> getInvalidProcessingOperations();

  @JsonIgnore
  public abstract Set<String> getInvalidPhaseTypes();

  /**
   * Creates the {@link ProcessingMaskDefinitionRequest} from inputs
   *
   * @param processingOperations {@link ProcessingOperation}s associated with request
   * @param channels {@link Channel}s associated with request
   * @param phaseTypes {@link PhaseType} labels associated with request
   * @return {@link ProcessingMaskDefinitionRequest} populated object
   */
  @JsonCreator
  public static ProcessingMaskDefinitionRequest create(
      @JsonProperty("processingOperations") Collection<String> processingOperations,
      @JsonProperty("channels") Set<Channel> channels,
      @JsonProperty("phaseTypes") Collection<String> phaseTypes) {

    var validPhaseTypes = EnumSet.noneOf(PhaseType.class);
    var invalidPhaseTypes = new HashSet<String>();

    phaseTypes.stream()
        .forEach(
            (String phaseLabel) -> {
              if (PhaseType.containsType(phaseLabel)) {
                validPhaseTypes.add(PhaseType.valueOfLabel(phaseLabel));
              } else {
                LOGGER.warn("Invalid phase type in request body: {}", phaseLabel);
                invalidPhaseTypes.add(phaseLabel);
              }
            });

    var validProcessingOperations = EnumSet.noneOf(ProcessingOperation.class);
    var invalidProcessingOperations = new HashSet<String>();

    processingOperations.stream()
        .forEach(
            (String opLabel) -> {
              if (ProcessingOperation.containsOperation(opLabel)) {
                validProcessingOperations.add(ProcessingOperation.valueOf(opLabel));
              } else {
                LOGGER.warn("Invalid processing operation in request body: {}", opLabel);
                invalidProcessingOperations.add(opLabel);
              }
            });

    return new AutoValue_ProcessingMaskDefinitionRequest(
        EnumSet.copyOf(validProcessingOperations),
        channels,
        EnumSet.copyOf(validPhaseTypes),
        Set.copyOf(invalidProcessingOperations),
        Set.copyOf(invalidPhaseTypes));
  }
}
