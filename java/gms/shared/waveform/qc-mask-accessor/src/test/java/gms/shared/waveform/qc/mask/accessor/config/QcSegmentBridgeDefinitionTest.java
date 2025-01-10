package gms.shared.waveform.qc.mask.accessor.config;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class QcSegmentBridgeDefinitionTest {

  private static final Duration maxQcSegmentDuration = Duration.ofMillis(400);
  private static final LocalTime seedQcMaskInfoStartTime = LocalTime.NOON;
  private static final Duration seedQcMaskInfoDuration = Duration.ofMillis(500);

  private static final LocalDateTime currDateTime = LocalDateTime.of(2023, 02, 23, 6, 0, 0);
  private static final LocalDateTime prevDateTime = LocalDateTime.of(2023, 02, 22, 6, 0, 0);

  @ParameterizedTest
  @MethodSource("getBuildValidationArguments")
  void testBuildValidation(
      String expectedMessage,
      Duration maxQcSegmentDuration,
      LocalTime seedQcMaskInfoStartTime,
      Duration seedQcMaskInfoDuration) {

    IllegalStateException exception =
        Assertions.assertThrows(
            IllegalStateException.class,
            () ->
                QcSegmentBridgeDefinition.create(
                    maxQcSegmentDuration, seedQcMaskInfoStartTime, seedQcMaskInfoDuration));
    Assertions.assertEquals(expectedMessage, exception.getMessage());
  }

  static Stream<Arguments> getBuildValidationArguments() {
    return Stream.of(
        arguments(
            "Max QcSegment duration cannot be negative",
            Duration.between(currDateTime, prevDateTime),
            seedQcMaskInfoStartTime,
            seedQcMaskInfoDuration),
        arguments(
            "Seed QcMaskInfo duration cannot be negative",
            maxQcSegmentDuration,
            seedQcMaskInfoStartTime,
            Duration.between(currDateTime, prevDateTime)));
  }

  @Test
  void testBuild() {
    QcSegmentBridgeDefinition definition =
        Assertions.assertDoesNotThrow(
            () ->
                QcSegmentBridgeDefinition.create(
                    maxQcSegmentDuration, seedQcMaskInfoStartTime, seedQcMaskInfoDuration));
    assertNotNull(definition);
  }
}
