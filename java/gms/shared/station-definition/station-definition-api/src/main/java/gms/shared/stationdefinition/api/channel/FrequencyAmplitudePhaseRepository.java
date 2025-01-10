package gms.shared.stationdefinition.api.channel;

import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import java.util.UUID;

/** Repository interface for caching a {@link FrequencyAmplitudePhase} */
public interface FrequencyAmplitudePhaseRepository {

  /**
   * Returns a {@link FrequencyAmplitudePhase} object corresponding to the passed {@link UUID}
   *
   * @param id the {@link UUID} of the desired {@link FrequencyAmplitudePhase} object
   * @return the {@link FrequencyAmplitudePhase} corresponding to the passed {@link UUID}
   */
  FrequencyAmplitudePhase findFrequencyAmplitudePhaseById(UUID id);
}
