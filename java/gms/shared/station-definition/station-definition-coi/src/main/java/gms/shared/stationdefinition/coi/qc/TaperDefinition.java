package gms.shared.stationdefinition.coi.qc;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.utils.TaperFunction;

public record TaperDefinition(int taperLengthSamples, TaperFunction taperFunction) {

  public TaperDefinition {
    Preconditions.checkNotNull(taperFunction);
    Preconditions.checkArgument(taperLengthSamples > 0);
  }
}
