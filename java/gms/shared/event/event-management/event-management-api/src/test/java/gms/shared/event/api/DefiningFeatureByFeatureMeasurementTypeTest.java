package gms.shared.event.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.json.JsonMapper;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DefiningFeatureByFeatureMeasurementTypeTest {

  private final String BAD_MEASUREMENT_TYPE = "BAD_MEASUREMENT_TYPE";

  private DefiningFeatureDefinition definingFeatureDefinition;
  private DefiningFeatureByFeatureMeasurementType definingFeatureByFeatureMeasurementType;

  @BeforeEach
  void setup() {
    definingFeatureDefinition = new DefiningFeatureDefinition(true, true, true);

    definingFeatureByFeatureMeasurementType =
        new DefiningFeatureByFeatureMeasurementType(
            Map.of(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2_OR, definingFeatureDefinition));
  }

  @Test
  void testAmplitudeMeasurementType() throws JsonProcessingException {
    JsonTestUtilities.assertSerializes(
        definingFeatureByFeatureMeasurementType, DefiningFeatureByFeatureMeasurementType.class);
  }

  @Test
  void testInvalidInput() throws JsonProcessingException {
    definingFeatureByFeatureMeasurementType =
        new DefiningFeatureByFeatureMeasurementType(
            Map.of(AmplitudeMeasurementType.from(BAD_MEASUREMENT_TYPE), definingFeatureDefinition));

    JsonMapper jsonMapper = ObjectMappers.jsonMapper();
    var serialized = jsonMapper.writeValueAsString(definingFeatureByFeatureMeasurementType);

    var exception =
        Assertions.assertThrows(
            JsonMappingException.class,
            () -> jsonMapper.readValue(serialized, DefiningFeatureByFeatureMeasurementType.class));

    Assertions.assertTrue(
        exception.toString().contains(BAD_MEASUREMENT_TYPE),
        "Error message didn't match expected string");
  }
}
