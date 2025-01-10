package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.auto.value.AutoValue;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import java.util.List;
import java.util.Map;

/**
 * Data container supporting the grouping of a {@link Channel} and a list of the {@Link
 * ProcessingMaskDefinitionByPhase}
 */
@AutoValue
public abstract class ProcessingMaskPhaseChannelItem {

  public abstract Channel getChannel();

  public abstract Map<PhaseType, List<ProcessingMaskDefinition>>
      getProcessingMaskDefinitionByPhase();

  /**
   * Creates the {@link ProcessingMaskPhaseChannelItem} data container from inputs
   *
   * @param channel {@link Channel} to associated to
   * @param processingMaskDefinitionByPhase List of relevant {@link ProcessingMaskDefinitionByPhase}
   * @return {@link ProcessingMaskPhaseChannelItem} populated data container
   */
  @JsonCreator
  public static ProcessingMaskPhaseChannelItem create(
      @JsonProperty("channel") Channel channel,
      @JsonProperty("processingMaskDefinitionByPhase")
          Map<PhaseType, List<ProcessingMaskDefinition>> processingMaskDefinitionByPhase) {
    return new AutoValue_ProcessingMaskPhaseChannelItem(channel, processingMaskDefinitionByPhase);
  }
}
