package gms.shared.event.analysis;

import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.utilities.test.JsonTestUtilities;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class EventRelocationPredictorDefinitionTest {

  @ParameterizedTest
  @MethodSource("preconditionsArguments")
  void testPreconditions(EventRelocationPredictorDefinition.Builder erpdBuilder) {
    Assertions.assertThrows(IllegalArgumentException.class, () -> erpdBuilder.build());
  }

  private static Stream<Arguments> preconditionsArguments() {
    var erpd =
        EventRelocationPredictorDefinition.builder()
            .setPredictor("predictor")
            .setEarthModel("earth model")
            .build();

    return Stream.of(
        arguments(erpd.toBuilder().setPredictor("     ")),
        arguments(EventRelocationPredictorDefinition.builder(erpd).setEarthModel("")));
  }

  @Test
  void testSerialization() {
    var erpd =
        EventRelocationPredictorDefinition.builder()
            .setPredictor("predictor")
            .setEarthModel("earth model")
            .build();

    JsonTestUtilities.assertSerializes(erpd, EventRelocationPredictorDefinition.class);
  }
}
