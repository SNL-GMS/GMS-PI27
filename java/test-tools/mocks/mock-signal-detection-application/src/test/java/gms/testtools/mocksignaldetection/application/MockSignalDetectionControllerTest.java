package gms.testtools.mocksignaldetection.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectReader;
import gms.shared.signaldetection.api.request.DetectionsWithSegmentsByStationsAndTimeRequest;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class MockSignalDetectionControllerTest {

  private final ObjectReader jsonReader = ObjectMappers.jsonReader();

  private MockSignalDetectionController controller;

  @BeforeEach
  public void testSetup() {
    controller = MockSignalDetectionController.create();
  }

  @Test
  void testServiceInterface() throws IOException {
    var sd =
        MockSignalDetectionControllerTest.class
            .getClassLoader()
            .getResource("signal-detection-request.json");

    var request = jsonReader.readValue(sd, DetectionsWithSegmentsByStationsAndTimeRequest.class);

    var endTime = Instant.now();
    var newRequest =
        DetectionsWithSegmentsByStationsAndTimeRequest.create(
            request.getStations(),
            endTime.minus(60L, ChronoUnit.MINUTES),
            endTime,
            request.getStageId(),
            request.getExcludedSignalDetections());

    var response = controller.findDetectionsWithSegmentsByStationsAndTime(newRequest);
    assertNotNull(response);
    assertEquals(response.getChannelSegments().size(), response.getSignalDetections().size());
  }

  @Test
  void testServiceInterfaceRequestNull() {
    Exception exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> controller.findDetectionsWithSegmentsByStationsAndTime(null));

    String expectedMessage = "Request parameter may not be null";
    String actualMessage = exception.getMessage();

    assertTrue(actualMessage.contains(expectedMessage));
  }
}
