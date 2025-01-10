package gms.shared.stationdefinition.coi.utils;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.Orientation;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;

class FieldMapUtilitiesTest {

  @Test
  void testFromFieldMap() {
    final double horizontal = 98.76;
    final double vertical = -3.14;

    final Orientation deserialized =
        FieldMapUtilities.fromFieldMap(
            Map.of("horizontalAngleDeg", horizontal, "verticalAngleDeg", vertical),
            Orientation.class);

    assertNotNull(deserialized);
    assertEquals(Orientation.from(Optional.of(horizontal), Optional.of(vertical)), deserialized);
  }

  @Test
  void testFromFieldMapValidatesParameters() {
    assertAll(
        () ->
            assertThrowsNullPointerException(
                () -> FieldMapUtilities.fromFieldMap(null, Object.class), "fieldMap can't be null"),
        () ->
            assertThrowsNullPointerException(
                () -> FieldMapUtilities.fromFieldMap(Map.of(), null), "outputClass can't be null"));
  }

  @Test
  void testFromFieldMapFailsExpectIllegalArgumentException() {
    Map<String, Object> emptyMap = Map.of();
    assertThrows(
        IllegalArgumentException.class,
        () -> FieldMapUtilities.fromFieldMap(emptyMap, Channel.class));
  }

  @Test
  void testToFieldMap() {
    final double latitude = 10.10;
    final double longitude = 27.72;
    final double depth = 33.41;
    final double elevation = 21;

    final Map<String, Object> fieldMap =
        FieldMapUtilities.toFieldMap(Location.from(latitude, longitude, depth, elevation));

    assertAll(
        () -> assertNotNull(fieldMap),
        () -> assertEquals(4, fieldMap.size()),
        () -> assertEquals(latitude, fieldMap.get("latitudeDegrees")),
        () -> assertEquals(longitude, fieldMap.get("longitudeDegrees")),
        () -> assertEquals(depth, fieldMap.get("depthKm")),
        () -> assertEquals(elevation, fieldMap.get("elevationKm")));
  }

  @Test
  void testToFieldMapFailsExpectIllegalArgumentException() {
    assertThrows(IllegalArgumentException.class, () -> FieldMapUtilities.toFieldMap(1));
  }

  @Test
  void testToFieldMapValidatesParameters() {
    assertThrowsNullPointerException(
        () -> FieldMapUtilities.toFieldMap(null), "object can't be null");
  }

  @Test
  void testRoundTrip() {
    final Station actual =
        FieldMapUtilities.fromFieldMap(
            FieldMapUtilities.toFieldMap(UtilsTestFixtures.STATION), Station.class);
    assertEquals(UtilsTestFixtures.STATION, actual);
  }

  /**
   * Verifies executing the {@link Executable} produces a NullPointerException with the provided
   * message.
   *
   * @param executable {@link Executable} to invoke, not null
   * @param message expected exception message, not null
   */
  private static void assertThrowsNullPointerException(Executable executable, String message) {
    assertEquals(message, assertThrows(NullPointerException.class, executable).getMessage());
  }
}
