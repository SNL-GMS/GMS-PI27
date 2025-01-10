package gms.shared.signaldetection.coi.detection;

import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.testfixture.WaveformTestFixtures;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/** Test {@link WaveformAndFilterDefinition} creation */
class WaveformAndFilterDefinitionTest {

  @Test
  void testWafdNoWaveform() {
    var builder = WaveformAndFilterDefinition.builder();
    Assertions.assertThrows(
        NullPointerException.class,
        () -> {
          builder.setWaveform(null);
        });
  }

  @Test
  void testWafdNoFilter() {
    ChannelSegment<Waveform> waveform =
        WaveformTestFixtures.singleStationEpochStart100RandomSamples();
    FilterDefinition nullFd = null;
    FilterDefinitionUsage nullFdu = null;

    Assertions.assertDoesNotThrow(
        () -> {
          WaveformAndFilterDefinition.builder()
              .setWaveform(waveform)
              // FilterDefinition and FilterDefinitionUsage are set to Optional.empty() by default
              .build();
        },
        "The filter definition and filter definition usages are allowed to be empty");

    Assertions.assertDoesNotThrow(
        () -> {
          WaveformAndFilterDefinition.builder()
              .setWaveform(waveform)
              .setFilterDefinition(nullFd)
              .setFilterDefinitionUsage(nullFdu)
              .build();
        },
        "The filter definition and filter definition usages are allowed to be null");
  }

  @Test
  void testWafdSerialization() {
    ChannelSegment<Waveform> waveform =
        WaveformTestFixtures.singleStationEpochStart100RandomSamples();

    LinearFilterDescription desc =
        LinearFilterDescription.from(
            Optional.empty(),
            Optional.empty(),
            true,
            FilterType.LINEAR,
            Optional.of(0.7),
            Optional.of(2.0),
            48,
            false,
            PassBandType.BAND_PASS,
            LinearFilterType.FIR_HAMMING,
            Optional.empty());
    FilterDefinition fd = FilterDefinition.from("test definition", Optional.empty(), desc);
    FilterDefinitionUsage fdu = FilterDefinitionUsage.DETECTION;

    var wafdFromValues =
        WaveformAndFilterDefinition.builder()
            .setWaveform(waveform)
            .setFilterDefinition(fd)
            .setFilterDefinitionUsage(fdu)
            .build();

    var wafdFromOptionals =
        WaveformAndFilterDefinition.builder()
            .setWaveform(waveform)
            .setFilterDefinition(Optional.of(fd))
            .setFilterDefinitionUsage(Optional.of(fdu))
            .build();

    JsonTestUtilities.assertSerializes(wafdFromValues, WaveformAndFilterDefinition.class);
    JsonTestUtilities.assertSerializes(wafdFromOptionals, WaveformAndFilterDefinition.class);
  }
}
