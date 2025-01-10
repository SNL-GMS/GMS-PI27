package gms.shared.utilities.bridge.database.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class PositiveNaInstantToDoubleConverterTest
    extends InstantToDoubleConverterTest<PositiveNaInstantToDoubleConverter> {

  @Override
  protected PositiveNaInstantToDoubleConverter getConverter() {
    return new PositiveNaInstantToDoubleConverter();
  }

  @ParameterizedTest
  @MethodSource("convertToDatabaseColumnArguments_NA_Values")
  void testConvertToDatabaseColumnNAValues(Instant providedInput, Double expectedResult) {
    assertEquals(expectedResult, converter.convertToDatabaseColumn(providedInput));
  }

  private static Stream<Arguments> convertToDatabaseColumnArguments_NA_Values() {
    return Stream.of(
        Arguments.arguments(null, PositiveNaInstantToDoubleConverter.NA_VALUE),
        Arguments.arguments(
            PositiveNaInstantToDoubleConverter.NA_TIME,
            PositiveNaInstantToDoubleConverter.NA_VALUE));
  }

  @ParameterizedTest
  @MethodSource("convertToEntityAttributeArguments_NA_Values")
  void testConvertToEntityAttributeNAValues(Double providedInput, Instant expectedResult) {
    assertEquals(expectedResult, converter.convertToEntityAttribute(providedInput));
  }

  private static Stream<Arguments> convertToEntityAttributeArguments_NA_Values() {
    return Stream.of(
        Arguments.arguments(
            PositiveNaInstantToDoubleConverter.NA_VALUE,
            PositiveNaInstantToDoubleConverter.NA_TIME));
  }
}
