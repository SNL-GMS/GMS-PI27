package gms.shared.signalfeaturemeasurement.api.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;

/** Value class that holds {@link AmplitudeMeasurementType}s for requests */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AmplitudeMeasurementTypeRequest(
    ImmutableList<AmplitudeMeasurementType> amplitudeMeasurementTypes) {

  /** Constructor needed for null checks */
  public AmplitudeMeasurementTypeRequest {
    Preconditions.checkNotNull(amplitudeMeasurementTypes);
  }
}
