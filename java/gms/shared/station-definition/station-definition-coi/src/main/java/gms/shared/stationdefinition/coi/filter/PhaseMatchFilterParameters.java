package gms.shared.stationdefinition.coi.filter;

import com.google.auto.value.AutoBuilder;
import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.EventLocation;
import gms.shared.stationdefinition.coi.channel.Location;

public record PhaseMatchFilterParameters(Location location, EventLocation eventLocation) {

  public PhaseMatchFilterParameters {
    Preconditions.checkNotNull(location);
    Preconditions.checkNotNull(eventLocation);
  }

  public static PhaseMatchFilterParameters.Builder builder() {
    return new AutoBuilder_PhaseMatchFilterParameters_Builder();
  }

  public static PhaseMatchFilterParameters.Builder builder(PhaseMatchFilterParameters parameters) {
    return new AutoBuilder_PhaseMatchFilterParameters_Builder(parameters);
  }

  public PhaseMatchFilterParameters.Builder toBuilder() {
    return new AutoBuilder_PhaseMatchFilterParameters_Builder(this);
  }

  @AutoBuilder
  public interface Builder {
    Builder setLocation(Location location);

    Builder setEventLocation(EventLocation eventLocation);

    default PhaseMatchFilterParameters build() {
      return autoBuild();
    }

    PhaseMatchFilterParameters autoBuild();
  }
}
