package gms.shared.waveform.bridge.repository;

import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = CannedProcessingMaskLoader.class)
@DirtiesContext(classMode = ClassMode.AFTER_EACH_TEST_METHOD)
class CannedProcessingMaskLoaderTest {
  private final String defaultConfig = "MULTIPLE";
  private final String eventBeamConfig = "EVENT_BEAM";

  @Autowired CannedProcessingMaskLoader cannedProcessingMaskLoader;

  @Test
  void testGivenDefaultFileThenReturnExpectedDefaultFile() {
    ReflectionTestUtils.setField(
        cannedProcessingMaskLoader, "cannedProcessingMaskConfig", defaultConfig);

    var actualConfig = cannedProcessingMaskLoader.getCannedProcessingMaskConfig();

    Assertions.assertEquals(defaultConfig, actualConfig);
  }

  @Test
  void testGivenEventBeamFileThenReturnExpectedFile() {
    ReflectionTestUtils.setField(
        cannedProcessingMaskLoader, "cannedProcessingMaskConfig", eventBeamConfig);

    var actualConfig = cannedProcessingMaskLoader.getCannedProcessingMaskConfig();

    Assertions.assertEquals(eventBeamConfig, actualConfig);
  }

  @Test
  void testAllCannedChannelsForDefaultProccessingMasks() {
    ReflectionTestUtils.setField(
        cannedProcessingMaskLoader, "cannedProcessingMaskConfig", defaultConfig);

    Map<String, ProcessingOperation> stationOperationMap =
        Map.of(
            "ASAR", ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM,
            "FINES", ProcessingOperation.DISPLAY_FILTER,
            "TORD", ProcessingOperation.SPECTROGRAM,
            "MAW", ProcessingOperation.VIRTUAL_BEAM);

    stationOperationMap.forEach(
        (station, operation) -> {
          var mockChannel = Mockito.mock(Channel.class);

          // Create interesting channel name to excercise parsing out station
          Mockito.when(mockChannel.getName()).thenReturn(station + ".beam.Z/stuff");

          var processingMasks =
              cannedProcessingMaskLoader.loadProcessingMasks(mockChannel, Instant.EPOCH, null);

          Assertions.assertNotNull(processingMasks);
          Assertions.assertEquals(1, processingMasks.size());
          Assertions.assertEquals(
              operation, processingMasks.get(0).getData().get().getProcessingOperation());
          System.err.println(processingMasks.get(0).getData().get().getProcessingOperation());
        });
  }

  @Test
  void testSingletonPerStationForDefaultProccessingMasks() {
    ReflectionTestUtils.setField(
        cannedProcessingMaskLoader, "cannedProcessingMaskConfig", defaultConfig);

    var mockChannel = Mockito.mock(Channel.class);
    Mockito.when(mockChannel.getName()).thenReturn("ASAR.xyz");

    var processingMasks =
        cannedProcessingMaskLoader.loadProcessingMasks(mockChannel, Instant.EPOCH, null);

    Assertions.assertEquals(1, processingMasks.size());

    processingMasks =
        cannedProcessingMaskLoader.loadProcessingMasks(mockChannel, Instant.EPOCH, null);

    Assertions.assertEquals(0, processingMasks.size());
  }

  @Test
  void testAllCannedChannelsForEventBeamProccessingMasks() {
    ReflectionTestUtils.setField(
        cannedProcessingMaskLoader, "cannedProcessingMaskConfig", eventBeamConfig);

    Map<String, ProcessingOperation> eventBeamStationOperationMap =
        Map.of(
            "ASAR", ProcessingOperation.EVENT_BEAM,
            "FINES", ProcessingOperation.EVENT_BEAM,
            "TORD", ProcessingOperation.EVENT_BEAM,
            "MAW", ProcessingOperation.EVENT_BEAM);

    eventBeamStationOperationMap.forEach(
        (station, operation) -> {
          var mockChannel = Mockito.mock(Channel.class);

          // Create interesting channel name to excercise parsing out station
          Mockito.when(mockChannel.getName()).thenReturn(station + ".beam.Z/stuff");

          var processingMasks =
              cannedProcessingMaskLoader.loadProcessingMasks(mockChannel, Instant.EPOCH, null);

          Assertions.assertNotNull(processingMasks);
          Assertions.assertEquals(1, processingMasks.size());
          Assertions.assertEquals(
              operation, processingMasks.get(0).getData().get().getProcessingOperation());
          System.err.println(processingMasks.get(0).getData().get().getProcessingOperation());
        });
  }

  @Test
  void testSingletonPerStationForEventBeamProccessingMasks() {
    ReflectionTestUtils.setField(
        cannedProcessingMaskLoader, "cannedProcessingMaskConfig", eventBeamConfig);

    var mockChannel = Mockito.mock(Channel.class);
    Mockito.when(mockChannel.getName()).thenReturn("ASAR.xyz");

    var processingMasks =
        cannedProcessingMaskLoader.loadProcessingMasks(mockChannel, Instant.EPOCH, null);

    Assertions.assertEquals(1, processingMasks.size());

    processingMasks =
        cannedProcessingMaskLoader.loadProcessingMasks(mockChannel, Instant.EPOCH, null);

    Assertions.assertEquals(0, processingMasks.size());
  }
}
