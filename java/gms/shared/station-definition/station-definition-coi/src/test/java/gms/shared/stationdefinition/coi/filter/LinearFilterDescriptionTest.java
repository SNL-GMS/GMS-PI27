package gms.shared.stationdefinition.coi.filter;

import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.stationdefinition.testfixtures.FilterParametersTestFixtures;
import gms.shared.utilities.test.JsonTestUtilities;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class LinearFilterDescriptionTest {

  private final String comments = "test comment";

  @Test
  void testSerializationFIR() {
    var description =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL.getFilterDescription();

    JsonTestUtilities.assertSerializes(description, LinearFilterDescription.class);
    JsonTestUtilities.assertSerializes(
        description.withParameters(FilterParametersTestFixtures.FIR_48),
        LinearFilterDescription.class);

    JsonTestUtilities.assertSerializes(description, FilterDescription.class);
    JsonTestUtilities.assertSerializes(
        description.withParameters(FilterParametersTestFixtures.FIR_48), FilterDescription.class);
  }

  @Test
  void testSerializationIIR() {
    var description =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__BR__2_0__4_5__3__CAUSAL.getFilterDescription();

    JsonTestUtilities.assertSerializes(description, LinearFilterDescription.class);
    JsonTestUtilities.assertSerializes(
        description.withParameters(FilterParametersTestFixtures.IIR_3),
        LinearFilterDescription.class);

    JsonTestUtilities.assertSerializes(description, FilterDescription.class);
    JsonTestUtilities.assertSerializes(
        description.withParameters(FilterParametersTestFixtures.IIR_3), FilterDescription.class);
  }

  @Test
  void testBuildInvalidFilterType() {
    var description =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL.getFilterDescription();

    assertThatIllegalArgumentException()
        .isThrownBy(() -> description.toBuilder().setFilterType(FilterType.AUTOREGRESSIVE).build())
        .withMessage("Linear filter are only of the LINEAR type");
  }

  @Test
  void testBuildInvalidFilterOrder() {
    var description =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL.getFilterDescription();
    assertThatIllegalArgumentException()
        .isThrownBy(() -> description.toBuilder().setOrder(-1).build())
        .withMessage("Filter order must be at greater or equal than one");
  }

  @ParameterizedTest
  @MethodSource("invalidPassBandFrequencyCombinations")
  void testBuildInvalidPassBandFrequencyCombinations(
      LinearFilterDescription.Builder builder, String message) {
    assertThatIllegalArgumentException().isThrownBy(builder::build).withMessage(message);
  }

  static Stream<Arguments> invalidPassBandFrequencyCombinations() {
    var lpDescription =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__LP__0_0__4_2__1__NON_CAUSAL.getFilterDescription();
    var hpDescription =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__HP__0_3__0_0__2__CAUSAL.getFilterDescription();
    var bpDescription =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL.getFilterDescription();
    var brDescription =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__BR__2_0__4_5__3__CAUSAL.getFilterDescription();

    return Stream.of(
        arguments(
            lpDescription.toBuilder().setLowFrequencyHz(0.1),
            "Low Frequency must not be present for PassBandType LOW_PASS"),
        arguments(
            lpDescription.toBuilder().noHighFrequencyHz(),
            "High Frequency must be present for PassBandType LOW_PASS"),
        arguments(
            hpDescription.toBuilder().noLowFrequencyHz(),
            "Low Frequency must be present for PassBandType HIGH_PASS"),
        arguments(
            hpDescription.toBuilder().setHighFrequencyHz(5.0),
            "High Frequency must not be present for PassBandType HIGH_PASS"),
        arguments(
            bpDescription.toBuilder().noLowFrequencyHz(),
            "Low Frequency must be present for PassBandType BAND_PASS"),
        arguments(
            bpDescription.toBuilder().noHighFrequencyHz(),
            "High Frequency must be present for PassBandType BAND_PASS"),
        arguments(
            brDescription.toBuilder().noLowFrequencyHz(),
            "Low Frequency must be present for PassBandType BAND_REJECT"),
        arguments(
            brDescription.toBuilder().noHighFrequencyHz(),
            "High Frequency must be present for PassBandType BAND_REJECT"));
  }

  @Test
  void testForCasualAndZeroPhaseErrors() {
    var description =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL.getFilterDescription();
    assertThatIllegalArgumentException()
        .isThrownBy(() -> description.toBuilder().setCausal(false).build());

    assertThatIllegalArgumentException()
        .isThrownBy(() -> description.toBuilder().setZeroPhase(true).build());
  }

  @Test
  void testSerializationErrorForFilterLowFrequencies() {
    var iirDescription =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL.getFilterDescription();

    assertThatIllegalArgumentException()
        .isThrownBy(() -> iirDescription.toBuilder().setLowFrequencyHz(-1.0).build())
        .withMessage("Frequency values must be positive");
  }

  @Test
  void testSerializationErrorForFilterHighFrequencies() {
    var iirDescription =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL.getFilterDescription();

    assertThatIllegalArgumentException()
        .isThrownBy(() -> iirDescription.toBuilder().setHighFrequencyHz(-1.0).build())
        .withMessage("Frequency values must be positive");
  }

  @Test
  void testIirValidatesParameterType() {
    var iirDescription =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL.getFilterDescription();
    // Test IIR_BUTTERWORTH type with FIR parameters
    assertThatIllegalArgumentException()
        .isThrownBy(() -> iirDescription.withParameters(FilterParametersTestFixtures.FIR_48))
        .withMessage(
            "IirFilterParameters must be used when linearFilterType.IIR_BUTTERWORTH OR"
                + " linearFilterType.IIR_OTHER is set.");
    // Test IIR_OTHER with FIR parameters
    assertThatIllegalArgumentException()
        .isThrownBy(
            () ->
                iirDescription.toBuilder()
                    .setLinearFilterType(LinearFilterType.IIR_OTHER)
                    .setParameters(FilterParametersTestFixtures.FIR_48)
                    .build())
        .withMessage(
            "IirFilterParameters must be used when linearFilterType.IIR_BUTTERWORTH OR"
                + " linearFilterType.IIR_OTHER is set.");
    // Test IIR_BUTTERWORTH with IIR parameters
    assertThatNoException()
        .isThrownBy(() -> iirDescription.withParameters(FilterParametersTestFixtures.IIR_3));
    // Test IIR_OTHER with IIR parameters
    assertThatNoException()
        .isThrownBy(
            () -> iirDescription.toBuilder().setLinearFilterType(LinearFilterType.IIR_OTHER));
  }

  @Test
  void testFirValidatesParameterType() {
    var firDescription =
        (LinearFilterDescription)
            FilterDefinitionTestFixtures.H__BP__0_4__3_5__48__CAUSAL.getFilterDescription();
    // Test FIR_HAMMING with IIR parameters
    assertThatIllegalArgumentException()
        .isThrownBy(() -> firDescription.withParameters(FilterParametersTestFixtures.IIR_3))
        .withMessage(
            "FirFilterParameters must be used when linearFilterType.FIR_HAMMING or"
                + " linearFilterType.FIR_OTHER is set.");
    // Test FIR_OTHER with IIR parameters
    assertThatIllegalArgumentException()
        .isThrownBy(
            () ->
                firDescription.toBuilder()
                    .setLinearFilterType(LinearFilterType.FIR_OTHER)
                    .setParameters(FilterParametersTestFixtures.IIR_3)
                    .build())
        .withMessage(
            "FirFilterParameters must be used when linearFilterType.FIR_HAMMING or"
                + " linearFilterType.FIR_OTHER is set.");
    // Test FIR_HAMMING with FIR parameters
    org.assertj.core.api.Assertions.assertThatNoException()
        .isThrownBy(() -> firDescription.withParameters(FilterParametersTestFixtures.FIR_48));
    // Test FIR_OTHER with FIR parameters
    assertThatNoException()
        .isThrownBy(
            () -> firDescription.toBuilder().setLinearFilterType(LinearFilterType.FIR_OTHER));
  }
}
