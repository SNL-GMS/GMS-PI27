package gms.shared.signaldetection.coi.types;

import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.KeyDeserializer;
import java.io.IOException;

/** Helper class that deserializes {@link FeatureMeasurementType} as a key */
public class FeatureMeasurementTypeKeyDeserializer extends KeyDeserializer {

  @Override
  public FeatureMeasurementType<?> deserializeKey(String string, DeserializationContext dc)
      throws IOException {
    return FeatureMeasurementTypes.getTypeInstance(string)
        .orElseThrow(
            () ->
                JsonMappingException.from(
                    dc,
                    String.format(
                        "Input string %s does not belong to any of the FeatureMeasurementTypes",
                        string)));
  }
}
