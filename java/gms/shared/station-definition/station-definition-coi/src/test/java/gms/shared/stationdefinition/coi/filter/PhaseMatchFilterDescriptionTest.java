package gms.shared.stationdefinition.coi.filter;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.fapResponse;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.stationdefinition.testfixtures.FilterParametersTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.time.Duration;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class PhaseMatchFilterDescriptionTest {

  private static final String DURATION_GRTR_ERRMSG =
      "Duration values must be greater than or equal to 0";
  private static final String DURATION_GRTREQ_ERRMSG = "Duration values must be greater than 0";

  private static final String DURATION_FREQUENCY_ERROR =
      "Frequency taper values must be greater than 0";

  @Test
  void testSerialization() {
    var description =
        (PhaseMatchFilterDescription)
            FilterDefinitionTestFixtures.PHASE_MATCH.getFilterDescription();
    JsonTestUtilities.assertSerializes(description, PhaseMatchFilterDescription.class);
  }

  @ParameterizedTest
  @MethodSource("testPhaseMatchFilterDescriptionArguments")
  void testPhaseMatchFilterDescription(
      String comments,
      boolean causal,
      String dispersionModelName,
      double lowFrequencyHz,
      Double lowFrequencyTaperWidthHz,
      double highFrequencyHz,
      Double highFrequencyTaperWidthHz,
      TaperFunction frequencyTaperFunction,
      int numFrequencies,
      Duration referencePeriod,
      Duration expansionDuration,
      PhaseType phase,
      TaperDefinition timeDomainTaperDefinition,
      PhaseMatchFilterParameters parameters,
      String expectedErrorMsg) {

    var msg =
        Assertions.assertThrows(
            IllegalArgumentException.class,
            () ->
                PhaseMatchFilterDescription.from(
                    comments,
                    fapResponse,
                    causal,
                    dispersionModelName,
                    lowFrequencyHz,
                    lowFrequencyTaperWidthHz,
                    highFrequencyHz,
                    highFrequencyTaperWidthHz,
                    frequencyTaperFunction,
                    numFrequencies,
                    referencePeriod,
                    expansionDuration,
                    phase,
                    timeDomainTaperDefinition,
                    parameters));
    Assertions.assertEquals(expectedErrorMsg, msg.getMessage());
  }

  private static Stream<Arguments> testPhaseMatchFilterDescriptionArguments() {
    var taperDefinition = new TaperDefinition(Duration.ofSeconds(5), TaperFunction.HANNING);
    var parameters = FilterParametersTestFixtures.getDefaultPhaseMatchFilterParameters();
    return Stream.of(
        arguments(
            "comment",
            false,
            "dispersion",
            2.0,
            2.0,
            6.0,
            6.0,
            TaperFunction.COSINE,
            3,
            Duration.ofHours(30),
            Duration.ofHours(30),
            PhaseType.pSKS,
            taperDefinition,
            parameters,
            "causal must be true"),
        arguments(
            "comment",
            true,
            "dispersion",
            2.0,
            2.0,
            0.0,
            6.0,
            TaperFunction.COSINE,
            3,
            Duration.ofHours(30),
            Duration.ofHours(30),
            PhaseType.pSKS,
            taperDefinition,
            parameters,
            "High frequency must be greater than zero"),
        arguments(
            "comment",
            true,
            "dispersion",
            2.0,
            2.0,
            1.0,
            6.0,
            TaperFunction.COSINE,
            3,
            Duration.ofHours(30),
            Duration.ofHours(30),
            PhaseType.pSKS,
            taperDefinition,
            parameters,
            "High frequency must be greater than lower frequency"),
        arguments(
            "comment",
            true,
            "dispersion",
            0.0,
            2.0,
            3.0,
            6.0,
            TaperFunction.COSINE,
            3,
            Duration.ofHours(30),
            Duration.ofHours(30),
            PhaseType.pSKS,
            taperDefinition,
            parameters,
            "Low frequency must be greater than zero"),
        arguments(
            "comment",
            true,
            "dispersion",
            1.0,
            2.0,
            3.0,
            6.0,
            TaperFunction.COSINE,
            0,
            Duration.ofHours(30),
            Duration.ofHours(30),
            PhaseType.pSKS,
            taperDefinition,
            parameters,
            "Number of frequencies must be greater than zero"),
        arguments(
            "comment",
            true,
            "dispersion",
            1.0,
            2.0,
            3.0,
            6.0,
            TaperFunction.COSINE,
            5,
            Duration.ofNanos(0),
            Duration.ofHours(30),
            PhaseType.pSKS,
            taperDefinition,
            parameters,
            DURATION_GRTREQ_ERRMSG),
        arguments(
            "comment",
            true,
            "dispersion",
            1.0,
            2.0,
            3.0,
            6.0,
            TaperFunction.COSINE,
            5,
            Duration.ofNanos(50),
            Duration.ofNanos(-10),
            PhaseType.pSKS,
            taperDefinition,
            parameters,
            DURATION_GRTR_ERRMSG),
        arguments(
            "comment",
            true,
            "dispersion",
            1.0,
            -2.0,
            3.0,
            6.0,
            TaperFunction.COSINE,
            5,
            Duration.ofNanos(50),
            Duration.ofNanos(0),
            PhaseType.pSKS,
            taperDefinition,
            parameters,
            DURATION_FREQUENCY_ERROR),
        arguments(
            "comment",
            true,
            "dispersion",
            1.0,
            2.0,
            3.0,
            -6.0,
            TaperFunction.COSINE,
            5,
            Duration.ofNanos(50),
            Duration.ofNanos(0),
            PhaseType.pSKS,
            taperDefinition,
            parameters,
            DURATION_FREQUENCY_ERROR));
  }
}
