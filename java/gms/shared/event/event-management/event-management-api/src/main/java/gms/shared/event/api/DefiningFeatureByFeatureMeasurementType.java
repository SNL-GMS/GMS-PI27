package gms.shared.event.api;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.google.common.base.Preconditions;
import gms.shared.signaldetection.coi.types.FeatureMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypeKeyDeserializer;
import java.util.Map;

/** Value class that maps {@link FeatureMeasurementType}s to {@link DefiningFeatureDefinition}s */
public record DefiningFeatureByFeatureMeasurementType(
    @JsonDeserialize(keyUsing = FeatureMeasurementTypeKeyDeserializer.class)
        Map<FeatureMeasurementType<?>, DefiningFeatureDefinition>
            definingFeatureByFeatureMeasurementType) {

  /** Constructor needed for null checks */
  public DefiningFeatureByFeatureMeasurementType {
    Preconditions.checkNotNull(
        definingFeatureByFeatureMeasurementType,
        "definingFeatureByFeatureMeasurementType cannot be null");

    Preconditions.checkArgument(
        !definingFeatureByFeatureMeasurementType.isEmpty(),
        "definingFeatureByFeatureMeasurementType cannot be empty");
  }
}
