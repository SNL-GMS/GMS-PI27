package gms.shared.signaldetection.coi.detection;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.core.JsonProcessingException;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SignalDetectionHypothesisReferenceTest {

  @Test
  void testSerialization() throws JsonProcessingException {
    final var id1 = UUID.fromString("10000000-100-0000-1000-100000000111");
    final var id2 = UUID.fromString("10000000-100-0000-1000-100000000112");
    final var signalDetectionHypothesisId = SignalDetectionHypothesisId.from(id1, id2);
    final var signalDetectionHypothesisReference =
        SignalDetectionHypothesisReference.builder().setId(signalDetectionHypothesisId).build();
    final var mapper = ObjectMappers.jsonMapper();
    assertEquals(
        signalDetectionHypothesisReference,
        mapper.readValue(
            mapper.writeValueAsString(signalDetectionHypothesisReference),
            SignalDetectionHypothesisReference.class));
  }
}
