package gms.shared.signalfeaturemeasurement.coi;

import com.fasterxml.jackson.annotation.JsonValue;
import com.google.common.base.Preconditions;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.stationdefinition.coi.station.Station;
import java.util.List;
import java.util.Map;

/**
 * Value record containing the map of {@link AmplitudeMeasurementType} to List of {@link Station}s
 */
public record StationsByFeatureMeasurementType(
    @JsonValue Map<AmplitudeMeasurementType, List<Station>> data) {

  public StationsByFeatureMeasurementType {

    Preconditions.checkNotNull(data, "Map must not be null");
    data.entrySet()
        .forEach(
            entry ->
                Preconditions.checkArgument(
                    entry.getValue() != null && !entry.getValue().isEmpty(),
                    "Station Lists must not be empty for {}",
                    entry.getKey()));
  }
}
