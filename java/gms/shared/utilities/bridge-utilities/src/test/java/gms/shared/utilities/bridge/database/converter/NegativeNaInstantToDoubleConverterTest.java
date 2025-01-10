package gms.shared.utilities.bridge.database.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class NegativeNaInstantToDoubleConverterTest
    extends InstantToDoubleConverterTest<NegativeNaInstantToDoubleConverter> {

  @Override
  protected NegativeNaInstantToDoubleConverter getConverter() {
    return new NegativeNaInstantToDoubleConverter();
  }

  @ParameterizedTest
  @MethodSource("convertToDatabaseColumnArguments")
  void testConvertToDatabaseColumnNAValues(Instant providedInput, Double expectedResult) {
    assertEquals(expectedResult, converter.convertToDatabaseColumn(providedInput));
  }

  private static Stream<Arguments> convertToDatabaseColumnArguments() {
    return Stream.of(
        Arguments.arguments(null, NegativeNaInstantToDoubleConverter.NA_VALUE),
        Arguments.arguments(
            NegativeNaInstantToDoubleConverter.NA_TIME,
            NegativeNaInstantToDoubleConverter.NA_VALUE));
  }

  @ParameterizedTest
  @MethodSource("convertToEntityAttributeArguments")
  void testConvertToEntityAttributeNAValues(Double providedInput, Instant expectedResult) {
    assertEquals(expectedResult, converter.convertToEntityAttribute(providedInput));
  }

  private static Stream<Arguments> convertToEntityAttributeArguments() {
    return Stream.of(
        Arguments.arguments(
            NegativeNaInstantToDoubleConverter.NA_VALUE,
            NegativeNaInstantToDoubleConverter.NA_TIME));
  }
}
