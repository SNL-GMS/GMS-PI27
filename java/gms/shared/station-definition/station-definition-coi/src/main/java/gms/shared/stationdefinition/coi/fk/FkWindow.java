package gms.shared.stationdefinition.coi.fk;

import com.google.common.base.Preconditions;
import java.time.Duration;

public record FkWindow(Duration duration, Duration lead) {

  public FkWindow {
    Preconditions.checkNotNull(duration);
    Preconditions.checkNotNull(lead);
    Preconditions.checkArgument(
        !duration.isNegative() && !duration.isZero(),
        "Duration of time window must be greater than zero.");
    Preconditions.checkArgument(
        !lead.isNegative(), "Duration of time lead must be greater or equal to zero.");
  }
}
