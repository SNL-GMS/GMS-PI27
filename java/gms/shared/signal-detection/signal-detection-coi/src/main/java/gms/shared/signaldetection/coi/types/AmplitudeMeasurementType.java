package gms.shared.signaldetection.coi.types;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.google.auto.value.AutoValue;
import gms.shared.signaldetection.coi.values.AmplitudeMeasurementValue;

/** {@link FeatureMeasurementType} for {@link AmplitudeMeasurementValue} */
@AutoValue
public abstract class AmplitudeMeasurementType
    implements FeatureMeasurementType<AmplitudeMeasurementValue> {

  @JsonCreator
  public static AmplitudeMeasurementType from(String featureMeasurementTypeName) {
    return new AutoValue_AmplitudeMeasurementType(featureMeasurementTypeName);
  }

  @Override
  public Class<AmplitudeMeasurementValue> getMeasurementValueType() {
    return AmplitudeMeasurementValue.class;
  }

  @Override
  public int compareTo(FeatureMeasurementType<AmplitudeMeasurementValue> amplitudeMeasurementType) {
    return this.getFeatureMeasurementTypeName()
        .compareTo(amplitudeMeasurementType.getFeatureMeasurementTypeName());
  }
}
