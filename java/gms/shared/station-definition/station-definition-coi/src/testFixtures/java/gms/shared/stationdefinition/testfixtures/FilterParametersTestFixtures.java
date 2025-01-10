package gms.shared.stationdefinition.testfixtures;

import gms.shared.common.coi.types.EventLocation;
import gms.shared.stationdefinition.coi.channel.AmplitudePhaseResponse;
import gms.shared.stationdefinition.coi.filter.CascadeFilterParameters;
import gms.shared.stationdefinition.coi.filter.FirFilterParameters;
import gms.shared.stationdefinition.coi.filter.IirFilterParameters;
import gms.shared.stationdefinition.coi.filter.LinearFilterParameters;
import gms.shared.stationdefinition.coi.filter.PhaseMatchFilterParameters;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/** A Collection of FilterParameters test fixtures to aid in testing. */
public class FilterParametersTestFixtures {

  // ------- Filter Coefficients -------
  private static final Double[] FIR_48_B_COEFFS =
      new Double[] {
        0.00154277211073,
        0.00223135962309,
        0.00273104312013,
        0.00280258383269,
        0.00217656734384,
        0.000812768009294,
        -0.000856234196934,
        -0.00192237976758,
        -0.0013754340351,
        0.00122672506506,
        0.00510147945921,
        0.0080189420631,
        0.00682513728192,
        -0.00129622159881,
        -0.0172316219193,
        -0.0387105481955,
        -0.0601389046705,
        -0.0738477944677,
        -0.0725367436799,
        -0.0521167800143,
        -0.0138536966861,
        0.0351522813688,
        0.0835493685776,
        0.118991116265,
        0.131989358502,
        0.118991116265,
        0.0835493685776,
        0.0351522813688,
        -0.0138536966861,
        -0.0521167800143,
        -0.0725367436799,
        -0.0738477944677,
        -0.0601389046705,
        -0.0387105481955,
        -0.0172316219193,
        -0.00129622159881,
        0.00682513728192,
        0.0080189420631,
        0.00510147945921,
        0.00122672506506,
        -0.0013754340351,
        -0.00192237976758,
        -0.000856234196934,
        0.000812768009294,
        0.00217656734384,
        0.00280258383269,
        0.00273104312013,
        0.00223135962309,
        0.00154277211073
      };

  public static final LinearFilterParameters IIR_3 =
      IirFilterParameters.from(
          3.5, 2.2, Duration.parse("PT1212.5273S"), List.of(3.5, 4.5, 5.5), List.of(4.5, 5.5, 6.5));

  public static final LinearFilterParameters FIR_48 =
      FirFilterParameters.from(
          3.5, 2.2, Duration.parse("PT1212.5273S"), Arrays.asList(FIR_48_B_COEFFS));

  public static final CascadeFilterParameters CASCADE =
      CascadeFilterParameters.from(3.4, 2, Optional.of(Duration.parse("PT1212.5273S")));

  public static PhaseMatchFilterParameters getDefaultPhaseMatchFilterParameters() {

    var defaultDouble = 834.0;
    var defaultInt = 56;

    var amplitude = DoubleValue.from(defaultDouble, Optional.of(defaultDouble), Units.HERTZ);
    var phase =
        DoubleValue.from(defaultDouble, Optional.of(defaultDouble), Units.SECONDS_PER_DEGREE);

    var amplitudePhaseResponses =
        List.of(
            AmplitudePhaseResponse.from(amplitude, phase),
            AmplitudePhaseResponse.from(amplitude, phase));

    var frequencies = List.of(defaultDouble, defaultDouble - defaultInt);

    var eventLocation =
        EventLocation.from(defaultDouble, defaultDouble, defaultDouble, Instant.MIN);

    return PhaseMatchFilterParameters.builder()
        .setLocation(DefaultCoiTestFixtures.getDefaultLocation())
        .setEventLocation(eventLocation)
        .build();
  }
}
