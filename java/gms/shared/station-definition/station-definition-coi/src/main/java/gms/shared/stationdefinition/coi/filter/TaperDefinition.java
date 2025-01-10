package gms.shared.stationdefinition.coi.filter;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import java.time.Duration;

public record TaperDefinition(Duration taperDuration, TaperFunction taperFunction) {

  public TaperDefinition {
    Preconditions.checkNotNull(taperDuration);
    Preconditions.checkNotNull(taperFunction);
  }
}
