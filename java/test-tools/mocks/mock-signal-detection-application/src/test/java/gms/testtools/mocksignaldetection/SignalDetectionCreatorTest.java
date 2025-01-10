package gms.testtools.mocksignaldetection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.stationdefinition.coi.station.Station;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class SignalDetectionCreatorTest {

  @Test
  void testSignalDetectionCreator() {
    var sd = SignalDetectionCreator.create();
    assertNotNull(sd);
  }

  @Test
  void testModifyDetections() {
    var sd = SignalDetectionCreator.create();

    var startTime = Instant.now();
    var endTime = startTime.plus(10, ChronoUnit.MINUTES);
    var arces = Station.builder().setName("ARCES").build();

    var detections = sd.createDerivedChannelDetections(startTime, endTime, List.of(arces));

    assertNotNull(detections);
    assertEquals(detections.get(0).getStation().getName(), arces.getName());
  }

  @Test
  void testNullStartTime() {
    var sd = SignalDetectionCreator.create();

    var startTime = Instant.now();
    var endTime = startTime.plus(5, ChronoUnit.SECONDS);
    var arces = Station.builder().setName("ARCES").build();

    var stations = new ArrayList<Station>();
    stations.add(arces);

    Exception exception =
        assertThrows(
            NullPointerException.class,
            () -> {
              var detections = sd.createDerivedChannelDetections(null, endTime, stations);
            });

    String expectedMessage = "startTime may not be null";
    String actualMessage = exception.getMessage();

    assertTrue(actualMessage.contains(expectedMessage));
  }

  @Test
  void testNullEndTime() {
    var sd = SignalDetectionCreator.create();

    var startTime = Instant.now();
    var arces = Station.builder().setName("ARCES").build();

    var stations = new ArrayList<Station>();
    stations.add(arces);

    Exception exception =
        assertThrows(
            NullPointerException.class,
            () -> {
              var detections = sd.createDerivedChannelDetections(startTime, null, stations);
            });

    String expectedMessage = "endTime may not be null";
    String actualMessage = exception.getMessage();

    assertTrue(actualMessage.contains(expectedMessage));
  }

  @Test
  void testNullStations() {
    var sd = SignalDetectionCreator.create();

    var startTime = Instant.now();
    var endTime = startTime.plus(5, ChronoUnit.SECONDS);

    Exception exception =
        assertThrows(
            NullPointerException.class,
            () -> {
              var detections = sd.createDerivedChannelDetections(startTime, endTime, null);
            });

    String expectedMessage = "stations may not be null";
    String actualMessage = exception.getMessage();

    assertTrue(actualMessage.contains(expectedMessage));
  }
}
