package gms.shared.fk.plugin.algorithms;

import static gms.shared.fk.plugin.algorithms.util.FkTestUtilities.compareArrays;
import static gms.shared.fk.testfixtures.FkTestFixtures.DEFINITION;
import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_CHANNEL_SEGMENTS;
import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_FKS;
import static gms.shared.waveform.testfixture.FkTestFixtures.DETRENDED_CHANNEL_SEGMENTS;
import static gms.shared.waveform.testfixture.FkTestFixtures.GAP_CHANNEL_SEGMENT;
import static gms.shared.waveform.testfixture.FkTestFixtures.GAP_FKS;
import static gms.shared.waveform.testfixture.FkTestFixtures.NORMALIZED_FKS;
import static gms.shared.waveform.testfixture.FkTestFixtures.RELATIVE_POSITIONS;
import static gms.shared.waveform.testfixture.FkTestFixtures.RELATIVE_POSITION_MAP;
import static gms.shared.waveform.testfixture.FkTestFixtures.TEST_FREQ_BINS_EVEN;
import static gms.shared.waveform.testfixture.FkTestFixtures.TEST_FREQ_BINS_ODD;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.RelativePosition;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.FkSpectrum;
import gms.shared.waveform.coi.Waveform;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class CaponFkSpectrumAlgorithmTest {

  @Test
  void testBuildValidation() {

    var emptyMap = new HashMap<Channel, RelativePosition>();
    assertAll(
        "CaponFkSpectraAlgorithm",
        () ->
            assertThrows(
                NullPointerException.class,
                () -> CaponFkSpectrumAlgorithm.create(null, 2.5, emptyMap)),
        () -> assertNotNull(CaponFkSpectrumAlgorithm.create(DEFINITION, 2.5, emptyMap)));
  }

  @Test
  void testGenerateFkValidation() {
    Map<Channel, RelativePosition> relativePositionsByChannelName =
        Map.of(
            Channel.createEntityReference("ASAR.AS01.BHZ"),
            RelativePosition.from(0.0, 0.0, 0.0),
            Channel.createEntityReference("ASAR.AS02.BHZ"),
            RelativePosition.from(1.0, 1.0, 1.0),
            Channel.createEntityReference("ASAR.AS03.BHZ"),
            RelativePosition.from(2.0, 2.0, 2.0),
            Channel.createEntityReference("ASAR.AS04.BHZ"),
            RelativePosition.from(3.0, 3.0, 3.0),
            Channel.createEntityReference("ASAR.AS05.BHZ"),
            RelativePosition.from(4.0, 4.0, 4.0),
            Channel.createEntityReference("ASAR.AS06.BHZ"),
            RelativePosition.from(5.0, 5.0, 5.0),
            Channel.createEntityReference("ASAR.AS07.BHZ"),
            RelativePosition.from(6.0, 6.0, 6.0));

    FkSpectraDefinition longWindowLengthDefinition =
        FkSpectraDefinition.builder()
            .setUseChannelVerticalOffsets(false)
            .setNormalizeWaveforms(false)
            .setWaveformSampleRateHz(40)
            .setWaveformSampleRateToleranceHz(0.001)
            .setLowFrequencyHz(0)
            .setHighFrequencyHz(20)
            .setSlowCountX(6)
            .setSlowStartXSecPerKm(1.5)
            .setSlowDeltaXSecPerKm(.3)
            .setSlowCountY(6)
            .setSlowStartYSecPerKm(1.5)
            .setSlowDeltaYSecPerKm(.3)
            .setWindowLead(Duration.ZERO)
            .setWindowLength(Duration.ofSeconds(10))
            .setSampleRateHz(40)
            .setMinimumWaveformsForSpectra(2)
            .setPhaseType(PhaseType.P)
            .build();

    CaponFkSpectrumAlgorithm algorithm =
        CaponFkSpectrumAlgorithm.create(
            longWindowLengthDefinition, 3.7, relativePositionsByChannelName);

    List<ChannelSegment<Waveform>> duplicateChannelSegments = new ArrayList<>();
    duplicateChannelSegments.addAll(BASE_CHANNEL_SEGMENTS);
    duplicateChannelSegments.addAll(BASE_CHANNEL_SEGMENTS);

    List<ChannelSegment<Waveform>> emptyList = new ArrayList<>();
    assertAll(
        "GenerateFk",
        () -> assertThrows(NullPointerException.class, () -> algorithm.generateFk(null)),
        () -> assertThrows(IllegalArgumentException.class, () -> algorithm.generateFk(emptyList)),
        () ->
            assertThrows(
                IllegalArgumentException.class,
                () -> algorithm.generateFk(duplicateChannelSegments)),
        () ->
            assertThrows(
                IllegalArgumentException.class, () -> algorithm.generateFk(BASE_CHANNEL_SEGMENTS)));
  }

  @Test
  void testFftFreq() {
    int oddSampleCount = 9;
    int evenSampleCount = 10;
    int deltaFrequency = 1;

    double[] evenFreqBins = CaponFkSpectrumAlgorithm.fftFreq(evenSampleCount, deltaFrequency);
    assertArrayEquals(TEST_FREQ_BINS_EVEN, evenFreqBins);

    double[] oddFreqBins = CaponFkSpectrumAlgorithm.fftFreq(oddSampleCount, deltaFrequency);
    assertArrayEquals(TEST_FREQ_BINS_ODD, oddFreqBins);
  }

  @Test
  void testFindFreqBinIndices() {
    // Overlapping bins
    double lowFrequency = 2;
    double highFrequency = 5;

    int[] expectedEvenIndices = new int[] {2, 3, 4, 5, 6, 7, 8};
    int[] evenFreqBinIndices =
        CaponFkSpectrumAlgorithm.findBinIndices(TEST_FREQ_BINS_EVEN, lowFrequency, highFrequency);

    assertArrayEquals(expectedEvenIndices, evenFreqBinIndices);

    int[] expectedOddIndices = new int[] {2, 3, 4, 5, 6, 7};
    int[] oddFreqBinIndices =
        CaponFkSpectrumAlgorithm.findBinIndices(TEST_FREQ_BINS_ODD, lowFrequency, highFrequency);

    assertArrayEquals(expectedOddIndices, oddFreqBinIndices);

    // Non-overlapping bins
    lowFrequency = 1;
    highFrequency = 3;

    expectedEvenIndices = new int[] {1, 2, 3, 7, 8, 9};
    evenFreqBinIndices =
        CaponFkSpectrumAlgorithm.findBinIndices(TEST_FREQ_BINS_EVEN, lowFrequency, highFrequency);

    assertArrayEquals(expectedEvenIndices, evenFreqBinIndices);

    expectedOddIndices = new int[] {1, 2, 3, 6, 7, 8};
    oddFreqBinIndices =
        CaponFkSpectrumAlgorithm.findBinIndices(TEST_FREQ_BINS_ODD, lowFrequency, highFrequency);

    assertArrayEquals(expectedOddIndices, oddFreqBinIndices);
  }

  @Test
  void testGenerateSingleFk() {
    CaponFkSpectrumAlgorithm algorithm =
        CaponFkSpectrumAlgorithm.create(DEFINITION, 10, RELATIVE_POSITION_MAP);
    Optional<FkSpectrum> possibleSpectrum =
        algorithm.generateSingleFk(
            DETRENDED_CHANNEL_SEGMENTS, RELATIVE_POSITIONS, Instant.EPOCH, Instant.EPOCH);

    assertTrue(possibleSpectrum.isPresent());

    FkSpectrum expectedSpectrum = BASE_FKS.get(0);
    FkSpectrum actualSpectrum = possibleSpectrum.get();

    compareArrays(expectedSpectrum.getPower(), actualSpectrum.getPower());
    compareArrays(expectedSpectrum.getFstat(), actualSpectrum.getFstat());
    assertEquals(expectedSpectrum.getQuality(), actualSpectrum.getQuality());
  }

  @Test
  void testGenerateNormalizedSingleFk() {
    FkSpectraDefinition normalizedDefinition =
        DEFINITION.toBuilder().setNormalizeWaveforms(true).build();

    CaponFkSpectrumAlgorithm algorithm =
        CaponFkSpectrumAlgorithm.create(normalizedDefinition, 10, RELATIVE_POSITION_MAP);
    List<FkSpectrum> fkSpectrumList = algorithm.generateFk(BASE_CHANNEL_SEGMENTS);
    assertEquals(NORMALIZED_FKS.size(), fkSpectrumList.size());

    for (int i = 0; i < NORMALIZED_FKS.size(); i++) {
      FkSpectrum expected = NORMALIZED_FKS.get(i);
      FkSpectrum actual = fkSpectrumList.get(i);

      compareArrays(expected.getPower(), actual.getPower());
      compareArrays(expected.getFstat(), actual.getFstat());
      assertEquals(expected.getQuality(), actual.getQuality());
    }
  }

  @Test
  void testGenerateMultipleFks() {
    CaponFkSpectrumAlgorithm algorithm =
        CaponFkSpectrumAlgorithm.create(DEFINITION, 10, RELATIVE_POSITION_MAP);
    List<FkSpectrum> fkSpectrumList = algorithm.generateFk(BASE_CHANNEL_SEGMENTS);
    assertEquals(BASE_FKS.size(), fkSpectrumList.size());

    for (int i = 0; i < BASE_FKS.size(); i++) {
      FkSpectrum expected = BASE_FKS.get(i);
      FkSpectrum actual = fkSpectrumList.get(i);

      compareArrays(expected.getPower(), actual.getPower());
      compareArrays(expected.getFstat(), actual.getFstat());
      assertEquals(expected.getQuality(), actual.getQuality());
    }
  }

  @Test
  void testMultipleFkFromWaveformWithGaps() {
    FkSpectraDefinition gapFkDefinition =
        DEFINITION.toBuilder()
            .setWindowLength(Duration.ofSeconds(2))
            .setNormalizeWaveforms(false)
            .setSampleRateHz(0.5)
            .build();

    CaponFkSpectrumAlgorithm algorithm =
        CaponFkSpectrumAlgorithm.create(gapFkDefinition, 10, RELATIVE_POSITION_MAP);

    List<ChannelSegment<Waveform>> gapFkChannelSegments = new ArrayList<>();
    gapFkChannelSegments.addAll(BASE_CHANNEL_SEGMENTS);
    gapFkChannelSegments.add(GAP_CHANNEL_SEGMENT);

    List<FkSpectrum> spectrums = algorithm.generateFk(gapFkChannelSegments);

    assertEquals(GAP_FKS.size(), spectrums.size());

    for (int i = 0; i < GAP_FKS.size(); i++) {
      FkSpectrum expected = GAP_FKS.get(i);
      FkSpectrum actual = spectrums.get(i);

      compareArrays(expected.getPower(), actual.getPower());
      compareArrays(expected.getFstat(), actual.getFstat());
      assertEquals(expected.getQuality(), actual.getQuality());
    }
  }

  @Test
  void testMultipleFkFromWaveformWithJitter() {
    List<ChannelSegment<Waveform>> channelSegments = new ArrayList<>(BASE_CHANNEL_SEGMENTS);
    ChannelSegment<Waveform> lastChannelSegment =
        channelSegments.remove(channelSegments.size() - 1);

    Duration samplePeriod = Duration.ofNanos((long) ((1 / 40) * 1E9));
    Duration jitter = samplePeriod.dividedBy(2).minusNanos(10);

    List<Waveform> jitteredWaveforms =
        lastChannelSegment.getTimeseries().stream()
            .map(
                waveform -> {
                  // add one sample to the each end so it doesn't get filtered out for length
                  double[] jitteredSamples = new double[waveform.getSamples().length + 2];
                  System.arraycopy(
                      waveform.getSamples(), 0, jitteredSamples, 1, waveform.getSampleCount());
                  return Waveform.create(
                      waveform.getStartTime().plus(jitter),
                      waveform.getSampleRateHz(),
                      waveform.getSamples());
                })
            .collect(Collectors.toList());

    ChannelSegment<Waveform> jitteredChannelSegment =
        ChannelSegment.from(
            lastChannelSegment.getId().getChannel(),
            lastChannelSegment.getUnits(),
            jitteredWaveforms,
            Instant.EPOCH,
            List.of(),
            Map.of());

    channelSegments.add(jitteredChannelSegment);

    CaponFkSpectrumAlgorithm algorithm =
        CaponFkSpectrumAlgorithm.create(DEFINITION, 10, RELATIVE_POSITION_MAP);
    List<FkSpectrum> spectrumList = algorithm.generateFk(channelSegments);

    assertEquals(BASE_FKS.size(), spectrumList.size());
    for (int i = 0; i < BASE_FKS.size(); i++) {
      FkSpectrum expected = BASE_FKS.get(i);
      FkSpectrum actual = spectrumList.get(i);

      compareArrays(expected.getPower(), actual.getPower());
      compareArrays(expected.getFstat(), actual.getFstat());
      assertEquals(expected.getQuality(), actual.getQuality());
    }
  }

  @Test
  void testMultipleFkFromWaveformOutOfSampleRateTolerance() {
    List<ChannelSegment<Waveform>> channelSegments = new ArrayList<>(BASE_CHANNEL_SEGMENTS);
    ChannelSegment<Waveform> lastChannelSegment = channelSegments.get(channelSegments.size() - 1);

    List<Waveform> slowWaveforms =
        lastChannelSegment.getTimeseries().stream()
            .map(waveform -> Waveform.create(waveform.getStartTime(), 41, waveform.getSamples()))
            .collect(Collectors.toList());

    ChannelSegment<Waveform> slowChannelSegment =
        ChannelSegment.from(
            GAP_CHANNEL_SEGMENT.getId().getChannel(),
            lastChannelSegment.getUnits(),
            slowWaveforms,
            Instant.EPOCH,
            List.of(),
            Map.of());

    channelSegments.add(slowChannelSegment);

    CaponFkSpectrumAlgorithm algorithm =
        CaponFkSpectrumAlgorithm.create(DEFINITION, 10, RELATIVE_POSITION_MAP);
    List<FkSpectrum> spectrumList = algorithm.generateFk(channelSegments);

    assertEquals(BASE_FKS.size(), spectrumList.size());

    for (int i = 0; i < BASE_FKS.size(); i++) {
      FkSpectrum expected = BASE_FKS.get(i);
      FkSpectrum actual = spectrumList.get(i);

      compareArrays(expected.getPower(), actual.getPower());
      compareArrays(expected.getFstat(), actual.getFstat());
      assertEquals(expected.getQuality(), actual.getQuality());
    }
  }
}
