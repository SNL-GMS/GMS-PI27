package gms.shared.signalfeaturemeasurement.api.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.stationdefinition.coi.station.Station;

/** Value class that holds {@link Station}s and {@link AmplitudeMeasurementType}s */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AmplitudeMeasurementConditioningTemplateRequest(
    ImmutableList<Station> stations,
    ImmutableList<AmplitudeMeasurementType> amplitudeMeasurementTypes) {

  /** Constructor needed for null checks */
  public AmplitudeMeasurementConditioningTemplateRequest {
    Preconditions.checkNotNull(stations);
    Preconditions.checkNotNull(amplitudeMeasurementTypes);
  }
}
