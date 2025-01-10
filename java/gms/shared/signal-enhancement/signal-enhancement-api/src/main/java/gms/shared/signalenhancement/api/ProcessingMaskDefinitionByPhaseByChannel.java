package gms.shared.signalenhancement.api;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.google.auto.value.AutoValue;
import gms.shared.stationdefinition.coi.channel.Channel;
import java.util.List;

/** Data container supporting collection of {@link ProcessingMaskPhaseChannelItem}s */
@AutoValue
public abstract class ProcessingMaskDefinitionByPhaseByChannel {

  public abstract List<ProcessingMaskPhaseChannelItem>
      getProcessingMaskDefinitionByPhaseByChannel();

  /**
   * Creates the {@link processingMaskDefinitionByPhaseByChannel} data container from inputs
   *
   * @param processingMaskDefinitionByPhaseByChannel List of {@link ProcessingMaskPhaseChannelItem}
   * @return {@link processingMaskDefinitionByPhaseByChannel} populated list
   */
  @JsonCreator
  @JsonDeserialize(builder = Channel.Builder.class)
  public static ProcessingMaskDefinitionByPhaseByChannel create(
      @JsonProperty("processingMaskDefinitionByPhaseByChannel")
          List<ProcessingMaskPhaseChannelItem> processingMaskDefinitionByPhaseByChannel) {
    return new AutoValue_ProcessingMaskDefinitionByPhaseByChannel(
        processingMaskDefinitionByPhaseByChannel);
  }
}
