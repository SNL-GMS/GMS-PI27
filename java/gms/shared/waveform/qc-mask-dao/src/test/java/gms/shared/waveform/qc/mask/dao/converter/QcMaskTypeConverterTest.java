package gms.shared.waveform.qc.mask.dao.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.stationdefinition.dao.css.enums.QcMaskType;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class QcMaskTypeConverterTest {
  private QcMaskTypeConverter converter;

  @BeforeEach
  void setup() {
    converter = new QcMaskTypeConverter();
  }

  @ParameterizedTest
  @MethodSource("getConvertToDatabaseColumnArguments")
  void testConvertToDatabaseColumn(Long expected, QcMaskType qcMaskType) {
    assertEquals(expected, converter.convertToDatabaseColumn(qcMaskType));
  }

  static Stream<Arguments> getConvertToDatabaseColumnArguments() {
    return Stream.of(
        arguments(null, null),
        arguments(0L, QcMaskType.UNPROCESSED),
        arguments(10L, QcMaskType.MISSING),
        arguments(20L, QcMaskType.FLAT),
        arguments(30L, QcMaskType.NOISY),
        arguments(40L, QcMaskType.BAD_SINGLE_POINT),
        arguments(50L, QcMaskType.MULTIPLE_DATA_SPIKE),
        arguments(60L, QcMaskType.SINGLE_DATA_SPIKE),
        arguments(70L, QcMaskType.TOS_SPIKE),
        arguments(100L, QcMaskType.AGGREGATE),
        arguments(200L, QcMaskType.CHANNEL),
        arguments(300L, QcMaskType.ANALYST_DELETED),
        arguments(400L, QcMaskType.ANALYST),
        arguments(500L, QcMaskType.CALIBRATION));
  }

  @ParameterizedTest
  @MethodSource("getConvertToEntityAttributeArguments")
  void testConvertToEntityAttribute(QcMaskType expected, Long dbData) {
    assertEquals(expected, converter.convertToEntityAttribute(dbData));
  }

  static Stream<Arguments> getConvertToEntityAttributeArguments() {
    return Stream.of(
        arguments(null, null),
        arguments(QcMaskType.UNPROCESSED, 0L),
        arguments(QcMaskType.MISSING, 10L),
        arguments(QcMaskType.FLAT, 20L),
        arguments(QcMaskType.NOISY, 30L),
        arguments(QcMaskType.BAD_SINGLE_POINT, 40L),
        arguments(QcMaskType.MULTIPLE_DATA_SPIKE, 50L),
        arguments(QcMaskType.SINGLE_DATA_SPIKE, 60L),
        arguments(QcMaskType.TOS_SPIKE, 70L),
        arguments(QcMaskType.AGGREGATE, 100L),
        arguments(QcMaskType.CHANNEL, 200L),
        arguments(QcMaskType.ANALYST_DELETED, 300L),
        arguments(QcMaskType.ANALYST, 400L),
        arguments(QcMaskType.CALIBRATION, 500L));
  }
}
