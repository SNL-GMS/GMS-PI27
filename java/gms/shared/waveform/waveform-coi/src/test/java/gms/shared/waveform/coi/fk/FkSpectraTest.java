package gms.shared.waveform.coi.fk;

import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.fk.FkWindow;
import gms.shared.stationdefinition.coi.fk.SlownessGrid;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.coi.fk.FkSpectra.Metadata;
import gms.shared.waveform.coi.fk.FkSpectrum.FkAttributes;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class FkSpectraTest {

  private static FkAttributes fkAttributes;
  private static FkSpectrum spectrum;
  private static double[][] arr;
  private static Metadata fkMetadata;

  @BeforeAll
  static void setup() {
    arr = new double[2][2];

    var slowness = DoubleValue.from(1.2, Optional.of(3.2), Units.SECONDS_PER_KILOMETER);
    var receiverToSourceAzimuth = DoubleValue.from(54.3, Optional.of(2.7), Units.RADIANS);

    fkAttributes = new FkSpectrum.FkAttributes(0, slowness, receiverToSourceAzimuth);

    spectrum = new FkSpectrum(arr, arr, 3.14, fkAttributes);

    fkMetadata =
        new Metadata(
            new FkWindow(Duration.ofSeconds(1), Duration.ZERO),
            new SlownessGrid(10, 5),
            PhaseType.PnPn);
  }

  @Test
  void testColumnsRowsNotEqual() {

    var arr2 = new double[2][3];
    var spectrum2 = new FkSpectrum(arr2, arr2, 2.3, fkAttributes);

    var spectraBuilder =
        FkSpectra.builder()
            .withSamples(List.of(spectrum, spectrum2))
            .setFkSpectraMetadata(fkMetadata)
            .setStartTime(Instant.parse("2008-11-10T17:26:44Z"))
            .setSampleRateHz(2);

    assertThrows(IllegalArgumentException.class, () -> spectraBuilder.build());

    var arr3 = new double[3][2];
    var spectrum3 = new FkSpectrum(arr3, arr3, 2.3, fkAttributes);
    var spectraBuilder2 =
        FkSpectra.builder()
            .withSamples(List.of(spectrum, spectrum3))
            .setFkSpectraMetadata(fkMetadata)
            .setStartTime(Instant.parse("2008-11-10T17:26:44Z"))
            .setSampleRateHz(2);

    assertThrows(IllegalArgumentException.class, () -> spectraBuilder2.build());
  }

  @Test
  void testEmptyCollection() {

    var spectraBuilder =
        FkSpectra.builder()
            .setFkSpectraMetadata(fkMetadata)
            .setStartTime(Instant.parse("2008-11-10T17:26:44Z"))
            .setSampleRateHz(2);

    assertThrows(IllegalStateException.class, () -> spectraBuilder.build());
  }

  @Test
  void testSampleCountMismatch() {

    var spectraBuilder =
        FkSpectra.builder()
            .setSampleCount(2)
            .setSamples(List.of(spectrum))
            .setFkSpectraMetadata(fkMetadata)
            .setStartTime(Instant.parse("2008-11-10T17:26:44Z"))
            .setSampleRateHz(2);

    assertThrows(IllegalArgumentException.class, () -> spectraBuilder.build());
  }

  @Test
  void testFkSpectraSerialization() {
    var spectrum2 = new FkSpectrum(arr, arr, 2.3, fkAttributes);

    var spectra =
        FkSpectra.builder()
            .withSamples(List.of(spectrum, spectrum2))
            .setFkSpectraMetadata(fkMetadata)
            .setStartTime(Instant.parse("2008-11-10T17:26:44Z"))
            .setSampleRateHz(2)
            .build();

    JsonTestUtilities.assertSerializes(spectra, FkSpectra.class);
  }

  @Test
  void testFkSpectraSerializationEmptyMetadata() {
    var spectrum2 = new FkSpectrum(arr, arr, 2.3, fkAttributes);

    var spectra =
        FkSpectra.builder()
            .withSamples(List.of(spectrum, spectrum2))
            .setStartTime(Instant.parse("2008-11-10T17:26:44Z"))
            .setSampleRateHz(2)
            .build();

    JsonTestUtilities.assertSerializes(spectra, FkSpectra.class);
  }
}
