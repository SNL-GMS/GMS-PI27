package gms.shared.stationdefinition.coi.fk;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.time.Duration;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class FkSpectraParametersTest {

  private static FkWindow fkWindow;
  private static PhaseType phaseType;
  private static SlownessGrid slownessGrid;
  private static Optional<FilterDefinition> filterDefinitionOptional;
  private static FkFrequencyRange fKFrequencyRange;
  private static FkWaveformSampleRate fKWaveformSampleRate;

  @BeforeAll
  static void init() {
    fkWindow = new FkWindow(Duration.ofSeconds(1), Duration.ZERO);
    phaseType = PhaseType.P;
    slownessGrid = new SlownessGrid(8.883, 10);

    filterDefinitionOptional = Optional.of(UtilsTestFixtures.FILTER_DEFINITION);
    fKFrequencyRange = new FkFrequencyRange(3.3, 4.2);
    fKWaveformSampleRate = new FkWaveformSampleRate(4.9, 9.9737);
  }

  @ParameterizedTest
  @MethodSource("getBuildArguments")
  void testIllegalArguments(
      Duration stepDuration, double orientationTol, int minWaveform, double taperPercent) {

    assertThrows(
        IllegalArgumentException.class,
        () ->
            new FkSpectraParameters(
                phaseType,
                filterDefinitionOptional,
                slownessGrid,
                TaperFunction.BLACKMAN,
                fkWindow,
                fKFrequencyRange,
                FkUncertaintyOption.EMPIRICAL,
                fKWaveformSampleRate,
                stepDuration,
                orientationTol,
                minWaveform,
                false,
                true,
                taperPercent));
  }

  static Stream<Arguments> getBuildArguments() {
    return Stream.of(
        arguments(Duration.ofSeconds(-1), 1, 1, 5),
        arguments(Duration.ZERO, 1, 1, 5),
        arguments(Duration.ofSeconds(1), -1, 1, 5),
        arguments(Duration.ofSeconds(1), 360.1, 1, 5),
        arguments(Duration.ofSeconds(1), 1, 0, 5),
        arguments(Duration.ofSeconds(1), 1, 1, -1),
        arguments(Duration.ofSeconds(1), 360.1, 1, 100.1));
  }

  @ParameterizedTest
  @MethodSource("getNullArguments")
  void testNullArguments(
      PhaseType phase,
      SlownessGrid slowness,
      FkWindow fkWindowVal,
      FkFrequencyRange freqRange,
      FkWaveformSampleRate waveformSampleRate,
      Duration spectrumStep) {

    assertThrows(
        NullPointerException.class,
        () ->
            new FkSpectraParameters(
                phase,
                filterDefinitionOptional,
                slowness,
                TaperFunction.BLACKMAN,
                fkWindowVal,
                freqRange,
                FkUncertaintyOption.EMPIRICAL,
                waveformSampleRate,
                spectrumStep,
                1,
                3,
                false,
                true,
                2));
  }

  static Stream<Arguments> getNullArguments() {
    return Stream.of(
        arguments(
            null,
            slownessGrid,
            fkWindow,
            fKFrequencyRange,
            fKWaveformSampleRate,
            Duration.ofSeconds(1)),
        arguments(
            phaseType,
            null,
            fkWindow,
            fKFrequencyRange,
            fKWaveformSampleRate,
            Duration.ofSeconds(1)),
        arguments(
            phaseType,
            slownessGrid,
            null,
            fKFrequencyRange,
            fKWaveformSampleRate,
            Duration.ofSeconds(1)),
        arguments(
            phaseType, slownessGrid, fkWindow, null, fKWaveformSampleRate, Duration.ofSeconds(1)),
        arguments(phaseType, slownessGrid, fkWindow, fKFrequencyRange, null, Duration.ofSeconds(1)),
        arguments(phaseType, slownessGrid, fkWindow, fKFrequencyRange, fKWaveformSampleRate, null));
  }

  @Test
  void testBuilder() {

    var fkParam1 =
        new FkSpectraParameters(
            phaseType,
            filterDefinitionOptional,
            slownessGrid,
            TaperFunction.BLACKMAN,
            fkWindow,
            fKFrequencyRange,
            FkUncertaintyOption.EMPIRICAL,
            fKWaveformSampleRate,
            Duration.ofSeconds(1),
            1,
            3,
            false,
            true,
            2);

    var fkParam2 =
        new FkSpectraParameters.Builder()
            .setPhaseType(phaseType)
            .setPreFilter(filterDefinitionOptional.get())
            .setSlownessGrid(slownessGrid)
            .setFftTaperFunction(TaperFunction.BLACKMAN)
            .setFkSpectrumWindow(fkWindow)
            .setFrequencyRange(fKFrequencyRange)
            .setFkUncertaintyOption(FkUncertaintyOption.EMPIRICAL)
            .setFkWaveformSampleRate(fKWaveformSampleRate)
            .setSpectrumStepDuration(Duration.ofSeconds(1))
            .setOrientationAngleTolerance(1)
            .setMinimumWaveformsForSpectra(3)
            .setNormalizeWaveforms(false)
            .setTwoDimensional(true)
            .setFftTaperPercent(2)
            .build();

    assertEquals(fkParam1, fkParam2);
  }

  @Test
  void testBuilderWithOptional() {

    var fkParam1 =
        new FkSpectraParameters(
            phaseType,
            Optional.empty(),
            slownessGrid,
            TaperFunction.BLACKMAN,
            fkWindow,
            fKFrequencyRange,
            FkUncertaintyOption.EMPIRICAL,
            fKWaveformSampleRate,
            Duration.ofSeconds(1),
            1,
            3,
            false,
            true,
            2);

    var fkParam2 =
        new FkSpectraParameters.Builder()
            .setPhaseType(phaseType)
            .setSlownessGrid(slownessGrid)
            .setFftTaperFunction(TaperFunction.BLACKMAN)
            .setFkSpectrumWindow(fkWindow)
            .setFrequencyRange(fKFrequencyRange)
            .setFkUncertaintyOption(FkUncertaintyOption.EMPIRICAL)
            .setFkWaveformSampleRate(fKWaveformSampleRate)
            .setSpectrumStepDuration(Duration.ofSeconds(1))
            .setOrientationAngleTolerance(1)
            .setMinimumWaveformsForSpectra(3)
            .setNormalizeWaveforms(false)
            .setTwoDimensional(true)
            .setFftTaperPercent(2)
            .build();

    assertEquals(fkParam1, fkParam2);
  }
}
