package gms.shared.event.coi;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Instant;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class LocationRestraintTest {

  private static final LocationRestraint DEFAULT_UNRESTRAINED = LocationRestraint.free();

  @ParameterizedTest
  @MethodSource("locationRestraintValidationProvider")
  void testLocationRestraintValidation(
      RestraintType depthRestraintType,
      DepthRestraintReason depthRestraintReason,
      Double depthRestraintKm,
      RestraintType positionRestraintType,
      Double latitudeRestraintDegrees,
      Double longitudeRestraintDegrees,
      RestraintType timeRestraintType,
      Instant timeRestraint,
      boolean shouldFail) {

    var locationRestraintBuilder =
        LocationRestraint.builder()
            .setDepthRestraintType(depthRestraintType)
            .setDepthRestraintReason(depthRestraintReason)
            .setDepthRestraintKm(depthRestraintKm)
            .setPositionRestraintType(positionRestraintType)
            .setLatitudeRestraintDegrees(latitudeRestraintDegrees)
            .setLongitudeRestraintDegrees(longitudeRestraintDegrees)
            .setTimeRestraintType(timeRestraintType)
            .setTimeRestraint(timeRestraint);

    if (shouldFail) {
      assertThrows(IllegalStateException.class, locationRestraintBuilder::build);
    } else {
      assertDoesNotThrow(locationRestraintBuilder::build);
    }
  }

  private static Stream<Arguments> locationRestraintValidationProvider() {
    return Stream.of(
        // Depth Restraint
        Arguments.arguments(
            RestraintType.FIXED,
            DepthRestraintReason.FIXED_AT_SURFACE,
            1.0,
            DEFAULT_UNRESTRAINED.getPositionRestraintType(),
            null,
            null,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            false),
        Arguments.arguments(
            RestraintType.FIXED,
            null,
            1.0,
            DEFAULT_UNRESTRAINED.getPositionRestraintType(),
            null,
            null,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            true),
        Arguments.arguments(
            RestraintType.FIXED,
            DepthRestraintReason.FIXED_AT_SURFACE,
            null,
            DEFAULT_UNRESTRAINED.getPositionRestraintType(),
            null,
            null,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            true),
        Arguments.arguments(
            RestraintType.UNRESTRAINED,
            null,
            null,
            DEFAULT_UNRESTRAINED.getPositionRestraintType(),
            null,
            null,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            false),
        Arguments.arguments(
            RestraintType.UNRESTRAINED,
            DepthRestraintReason.FIXED_AT_SURFACE,
            null,
            DEFAULT_UNRESTRAINED.getPositionRestraintType(),
            null,
            null,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            true),
        Arguments.arguments(
            RestraintType.UNRESTRAINED,
            null,
            1.0,
            DEFAULT_UNRESTRAINED.getPositionRestraintType(),
            null,
            null,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            true),

        // Position Restraint
        Arguments.arguments(
            DEFAULT_UNRESTRAINED.getDepthRestraintType(),
            null,
            null,
            RestraintType.FIXED,
            1.0,
            1.0,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            false),
        Arguments.arguments(
            DEFAULT_UNRESTRAINED.getDepthRestraintType(),
            null,
            null,
            RestraintType.FIXED,
            null,
            1.0,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            true),
        Arguments.arguments(
            DEFAULT_UNRESTRAINED.getDepthRestraintType(),
            null,
            null,
            RestraintType.FIXED,
            1.0,
            null,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            true),
        Arguments.arguments(
            DEFAULT_UNRESTRAINED.getDepthRestraintType(),
            null,
            null,
            RestraintType.UNRESTRAINED,
            null,
            null,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            false),
        Arguments.arguments(
            DEFAULT_UNRESTRAINED.getDepthRestraintType(),
            null,
            null,
            RestraintType.UNRESTRAINED,
            1.0,
            null,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            true),
        Arguments.arguments(
            DEFAULT_UNRESTRAINED.getDepthRestraintType(),
            null,
            null,
            RestraintType.UNRESTRAINED,
            null,
            1.0,
            DEFAULT_UNRESTRAINED.getTimeRestraintType(),
            null,
            true),

        // Time Restraint
        Arguments.arguments(
            DEFAULT_UNRESTRAINED.getDepthRestraintType(),
            null,
            null,
            DEFAULT_UNRESTRAINED.getPositionRestraintType(),
            null,
            null,
            RestraintType.FIXED,
            Instant.EPOCH,
            false),
        Arguments.arguments(
            DEFAULT_UNRESTRAINED.getDepthRestraintType(),
            null,
            null,
            DEFAULT_UNRESTRAINED.getPositionRestraintType(),
            null,
            null,
            RestraintType.FIXED,
            null,
            true),
        Arguments.arguments(
            DEFAULT_UNRESTRAINED.getDepthRestraintType(),
            null,
            null,
            DEFAULT_UNRESTRAINED.getPositionRestraintType(),
            null,
            null,
            RestraintType.UNRESTRAINED,
            null,
            false),
        Arguments.arguments(
            DEFAULT_UNRESTRAINED.getDepthRestraintType(),
            null,
            null,
            DEFAULT_UNRESTRAINED.getPositionRestraintType(),
            null,
            null,
            RestraintType.UNRESTRAINED,
            Instant.EPOCH,
            true));
  }

  @Test
  void testBuilderWithDefaults() {
    assertEquals(RestraintType.UNRESTRAINED, DEFAULT_UNRESTRAINED.getDepthRestraintType());
    assertTrue(DEFAULT_UNRESTRAINED.getDepthRestraintReason().isEmpty());
    assertTrue(DEFAULT_UNRESTRAINED.getDepthRestraintKm().isEmpty());

    assertEquals(RestraintType.UNRESTRAINED, DEFAULT_UNRESTRAINED.getPositionRestraintType());
    assertTrue(DEFAULT_UNRESTRAINED.getLatitudeRestraintDegrees().isEmpty());
    assertTrue(DEFAULT_UNRESTRAINED.getLongitudeRestraintDegrees().isEmpty());

    assertEquals(RestraintType.UNRESTRAINED, DEFAULT_UNRESTRAINED.getTimeRestraintType());
    assertTrue(DEFAULT_UNRESTRAINED.getTimeRestraint().isEmpty());
  }

  @Test
  void testSerialization() {
    JsonTestUtilities.assertSerializes(DEFAULT_UNRESTRAINED, LocationRestraint.class);
  }
}
