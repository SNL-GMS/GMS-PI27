package gms.utilities.waveformreader;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.Arrays;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FormatCodeTest {

  @ParameterizedTest
  @MethodSource("fcFromStringArguments")
  void testFcFromString(String code, FormatCode formatCode) {
    final FormatCode result = FormatCode.fcFromString(code);

    assertNotNull(result);
    assertEquals(formatCode, result);
  }

  private static Stream<Arguments> fcFromStringArguments() {
    return Arrays.stream(FormatCode.values()).map(f -> Arguments.arguments(f.getCode(), f));
  }
}
