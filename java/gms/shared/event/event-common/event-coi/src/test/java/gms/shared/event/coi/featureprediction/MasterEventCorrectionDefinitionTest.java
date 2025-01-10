package gms.shared.event.coi.featureprediction;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class MasterEventCorrectionDefinitionTest {

  @Test
  void testSerialization() throws JsonProcessingException {

    // Test general serialization
    var eventHypothesis =
        EventHypothesis.createEntityReference(
            EventHypothesis.Id.from(
                UUID.nameUUIDFromBytes("A".getBytes()), UUID.nameUUIDFromBytes("B".getBytes())));
    var correctionDefinition = new MasterEventCorrectionDefinition(eventHypothesis);

    JsonTestUtilities.assertSerializes(correctionDefinition, MasterEventCorrectionDefinition.class);

    // Test that the type of correction appears in the serialized string - theres potential to
    // correctly deserialize
    // if it doesn't, which would cause the check above to pass.
    var serialized = ObjectMappers.jsonWriter().writeValueAsString(correctionDefinition);

    assertTrue(serialized.contains("MASTER_EVENT_CORRECTION"));
  }
}
