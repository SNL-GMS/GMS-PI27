package gms.shared.stationdefinition.coi.channel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class FrequencyAmplitudePhaseTest {

  private UUID testUUID = UUID.nameUUIDFromBytes("test".getBytes());

  @Test
  void testSerialization() {
    JsonTestUtilities.assertSerializes(
        UtilsTestFixtures.fapResponse, FrequencyAmplitudePhase.class);
  }

  @Test
  void testSerializationEntityReference() {
    JsonTestUtilities.assertSerializes(
        FrequencyAmplitudePhase.createEntityReference(testUUID), FrequencyAmplitudePhase.class);
  }

  @Test
  void testFrequencyAmplitudePhaseCreateEntityReferencePresent() {
    Assertions.assertTrue(UtilsTestFixtures.fapResponse.isPresent());
  }

  @Test
  void testFrequencyAmplitudePhaseCreateEntityReferenceNotPresent() {
    FrequencyAmplitudePhase frequencyAmplitudePhase =
        getFrequencyAmplitudePhaseWithOnlyId(testUUID);
    assertFalse(frequencyAmplitudePhase.isPresent());
  }

  @Test
  void testDataBuildValidationIncompleteDataException() {
    var exceptionString = "Either all or none of the FacetedDataClass fields must be populated";
    var freqAmpPhaseDataBuilder =
        FrequencyAmplitudePhase.Data.builder()
            // test missing responses
            .setFrequencies(List.of(20.0));

    var exception =
        assertThrows(IllegalStateException.class, () -> freqAmpPhaseDataBuilder.build());
    assertEquals(exceptionString, exception.getMessage());
  }

  @Test
  void testDataBuildValidationDifferingSizesException() {
    var exceptionString = "The frequency list and the response list must be the same length";
    var freqAmpPhaseDataBuilder =
        FrequencyAmplitudePhase.Data.builder()
            .setFrequencies(List.of(20.0))
            .setAmplitudePhaseResponses(List.of())
            .setNominalCalibration(UtilsTestFixtures.calibration)
            .setNominalSampleRateHz(2.0);

    var exception =
        assertThrows(IllegalArgumentException.class, () -> freqAmpPhaseDataBuilder.build());
    assertEquals(exceptionString, exception.getMessage());
  }

  private FrequencyAmplitudePhase getFrequencyAmplitudePhaseWithOnlyId(UUID id) {
    return FrequencyAmplitudePhase.createEntityReference(id);
  }
}
