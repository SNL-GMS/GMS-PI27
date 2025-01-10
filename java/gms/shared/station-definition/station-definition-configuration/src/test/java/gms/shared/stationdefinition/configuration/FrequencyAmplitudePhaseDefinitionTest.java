package gms.shared.stationdefinition.configuration;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.utilities.test.JsonTestUtilities;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FrequencyAmplitudePhaseDefinitionTest {

  @Test
  void testSerialization() throws Exception {
    var fapDef = new FrequencyAmplitudePhaseDefinition(1.0, 100.0, FrequencySamplingMode.LOG, 4000);
    JsonTestUtilities.assertSerializes(fapDef, FrequencyAmplitudePhaseDefinition.class);
  }

  @ParameterizedTest
  @MethodSource("getBadInputArguments")
  void testBadInput(
      double lowBound,
      double highBound,
      FrequencySamplingMode fsm,
      int count,
      Class<? extends Throwable> exceptionClass) {
    assertThrows(
        exceptionClass,
        () -> new FrequencyAmplitudePhaseDefinition(lowBound, highBound, fsm, count));
  }

  private static Stream<Arguments> getBadInputArguments() {
    return Stream.of(
        arguments(-1.0, 100.0, FrequencySamplingMode.LOG, 1000, IllegalArgumentException.class),
        arguments(10.0, 5.0, FrequencySamplingMode.LOG, 1000, IllegalArgumentException.class),
        arguments(1.0, 100.0, null, 1000, NullPointerException.class),
        arguments(1.0, 100.0, FrequencySamplingMode.LOG, -10, IllegalArgumentException.class));
  }
}
