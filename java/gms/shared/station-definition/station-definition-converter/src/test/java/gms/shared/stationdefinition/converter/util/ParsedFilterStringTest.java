package gms.shared.stationdefinition.converter.util;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class ParsedFilterStringTest {

  @ParameterizedTest
  @MethodSource("filterStringSource")
  void testParsedFilterString(
      String filterString, Optional<Class<? extends Throwable>> expectedException) {
    expectedException.ifPresentOrElse(
        exception ->
            Assertions.assertThrows(exception, () -> ParsedFilterString.create(filterString)),
        () -> Assertions.assertDoesNotThrow(() -> ParsedFilterString.create(filterString)));
  }

  private static Stream<Arguments> filterStringSource() {
    return Stream.of(
        Arguments.arguments("0.0 1.0 1 BP causal", Optional.empty()),
        Arguments.arguments(" 0.0 1.0 1 BP causal", Optional.empty()),
        Arguments.arguments("0.0 1.0 1 BP causal ", Optional.empty()),
        Arguments.arguments("0.0  1.0  1  BP  causal", Optional.empty()),
        Arguments.arguments("2 1.0 1 BP causal", Optional.empty()),
        Arguments.arguments("0.0 1 1 BP causal", Optional.empty()),
        Arguments.arguments("0.0 1.0 1 BR causal", Optional.empty()),
        Arguments.arguments("0.0 1.0 1 BP non-causal", Optional.empty()),
        Arguments.arguments(null, Optional.of(NullPointerException.class)),
        Arguments.arguments("", Optional.of(IllegalArgumentException.class)),
        Arguments.arguments("NOPE 1.0 1 BP causal", Optional.of(NumberFormatException.class)),
        Arguments.arguments("0.0 NOPE 1 BP causal", Optional.of(NumberFormatException.class)),
        Arguments.arguments("0.0 1.0 NOPE BP causal", Optional.of(NumberFormatException.class)),
        Arguments.arguments("0.0 1.0 1 NOPE causal", Optional.of(IllegalArgumentException.class)),
        Arguments.arguments("0.0 1.0 1 BP NOPE", Optional.of(IllegalArgumentException.class)),
        Arguments.arguments("not enough values", Optional.of(IllegalArgumentException.class)),
        Arguments.arguments(
            "hey you got too many values", Optional.of(IllegalArgumentException.class)));
  }

  @Test
  void testReserializeRawFilterString() {
    var low = 0.0;
    var high = 1.0;
    var order = 1;
    var bpType = PassBandType.BAND_PASS;
    var causalString = "causal";
    var happyFilterString =
        String.format("%f %f %d %s %s", low, high, order, bpType.getValue(), causalString);
    var parsedString =
        ParsedFilterString.create(
            ParsedFilterString.create("0.0 1.0 1 BP causal").toFilterString());

    assertAll(
        "Re-serialized filter string, when deserialized, should contain all values originally"
            + " declared in input string",
        () -> assertEquals(low, parsedString.getLowFrequencyHz()),
        () -> assertEquals(high, parsedString.getHighFrequencyHz()),
        () -> assertEquals(order, parsedString.getOrder()),
        () -> assertEquals(bpType, parsedString.getPassBandType()),
        () -> assertTrue(parsedString.toFilterString().contains(causalString)));
  }
}
