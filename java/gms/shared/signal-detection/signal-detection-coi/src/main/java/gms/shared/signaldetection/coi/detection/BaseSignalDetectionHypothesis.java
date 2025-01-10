package gms.shared.signaldetection.coi.detection;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.google.common.collect.ImmutableSet;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.Optional;

abstract class BaseSignalDetectionHypothesis {

  public abstract SignalDetectionHypothesisId getId();

  @JsonUnwrapped
  @JsonProperty(access = JsonProperty.Access.READ_ONLY)
  public abstract Optional<? extends BaseSignalDetectionHypothesis.Data> getData();

  abstract static class Data {

    public abstract String getMonitoringOrganization();

    public abstract Station getStation();

    @JsonProperty("parentSignalDetectionHypothesis")
    abstract SignalDetectionHypothesisReference getParentSignalDetectionHypothesisReference();

    public abstract boolean isDeleted();

    public abstract ImmutableSet<FeatureMeasurement<?>> getFeatureMeasurements();
  }
}
