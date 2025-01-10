package gms.shared.signalenhancement.coi.fk;

import com.google.common.base.Preconditions;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.fk.FkSpectraParameters;
import gms.shared.stationdefinition.coi.fk.FkWindow;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.Collection;

/** Contains parameters used for the Fk spectra and spectrum calculations */
public record FkSpectraTemplate(
    FkWindow fkSpectraWindow,
    Station station,
    PhaseType phaseType,
    Collection<Channel> inputChannels,
    FkSpectraParameters fkSpectraParameters) {

  public FkSpectraTemplate {

    Preconditions.checkNotNull(fkSpectraWindow);
    Preconditions.checkNotNull(station);
    Preconditions.checkNotNull(phaseType);
    Preconditions.checkNotNull(inputChannels);
    Preconditions.checkNotNull(fkSpectraParameters);
  }

  public Builder toBuilder() {
    return new Builder(this);
  }

  public static final class Builder {

    FkWindow fkSpectraWindow;
    Station station;
    PhaseType phaseType;
    Collection<Channel> inputChannels;
    FkSpectraParameters fkSpectraParameters;

    public Builder() {}

    private Builder(FkSpectraTemplate source) {
      this.fkSpectraWindow = source.fkSpectraWindow;
      this.station = source.station;
      this.phaseType = source.phaseType;
      this.inputChannels = source.inputChannels;
      this.fkSpectraParameters = source.fkSpectraParameters;
    }

    public Builder setFkSpectraWindow(FkWindow fkSpectraWindow) {
      this.fkSpectraWindow = fkSpectraWindow;
      return this;
    }

    public Builder setStation(Station station) {
      this.station = station;
      return this;
    }

    public Builder setPhaseType(PhaseType phaseType) {
      this.phaseType = phaseType;
      return this;
    }

    public Builder setInputChannels(Collection<Channel> inputChannels) {
      this.inputChannels = inputChannels;
      return this;
    }

    public Builder setFkSpectraParameters(FkSpectraParameters fkSpectraParameters) {
      this.fkSpectraParameters = fkSpectraParameters;
      return this;
    }

    public FkSpectraTemplate build() {
      return new FkSpectraTemplate(
          fkSpectraWindow, station, phaseType, inputChannels, fkSpectraParameters);
    }
  }
}
