package gms.testtools.mocksignaldetection;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import java.util.List;
import org.junit.jupiter.api.Test;

class ChannelSegmentCreatorTest {

  @Test
  void testChannelSegmentCreator() {
    var cs = ChannelSegmentCreator.create();
    assertNotNull(cs);
  }

  @Test
  void testModifySegments() {
    var cs = ChannelSegmentCreator.create();
    List<ChannelSegment<? extends Timeseries>> segments = cs.modifyChannelSegments(List.of());

    assertNotNull(segments);
  }

  @Test
  void testNullSignalDetectionsParam() {
    var cs = ChannelSegmentCreator.create();

    Exception exception =
        assertThrows(
            NullPointerException.class,
            () -> {
              var segments = cs.modifyChannelSegments(null);
            });

    String expectedMessage = "signalDetections may not be null";
    String actualMessage = exception.getMessage();

    assertTrue(actualMessage.contains(expectedMessage));
  }
}
