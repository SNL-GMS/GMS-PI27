package gms.shared.stationdefinition.coi.utils.comparator;

import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import java.io.Serializable;
import java.util.Comparator;

public class FrequencyAmplitudePhaseComparator
    implements Comparator<FrequencyAmplitudePhase>, Serializable {

  @Override
  public int compare(FrequencyAmplitudePhase c1, FrequencyAmplitudePhase c2) {
    return c1.getId().compareTo(c2.getId());
  }
}
