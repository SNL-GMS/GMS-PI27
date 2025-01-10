package gms.shared.stationdefinition.testfixtures;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.stationdefinition.coi.filter.CascadeFilterDescription;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.filter.PhaseMatchFilterDescription;
import gms.shared.stationdefinition.coi.filter.TaperDefinition;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * A collection of FilterDefinition test fixtures to aid in all tests relating to Filtering. Note
 * that no FilterDescription contains FilterParameters, add them via the builder methods and using
 * FilterParametersTestFixtures if your test needs them
 */
public class FilterDefinitionTestFixtures {

  private FilterDefinitionTestFixtures() {
    // Private for Test Fixtures class
  }

  public static final FilterDefinition B__LP__0_0__4_2__1__NON_CAUSAL =
      FilterDefinition.from(
          "0.0 4.2 1 LP non-causal",
          Optional.of("Butterworth IIR low-pass, 4.2 Hz, order 1, non-causal"),
          LinearFilterDescription.builder()
              .setComments("0.0 4.2 1 LP non-causal")
              .setFilterType(FilterType.LINEAR)
              .setLinearFilterType(LinearFilterType.IIR_BUTTERWORTH)
              .setPassBandType(PassBandType.LOW_PASS)
              .setHighFrequencyHz(4.2)
              .setOrder(1)
              .setCausal(false)
              .setZeroPhase(true)
              .build());

  public static final FilterDefinition B__HP__0_3__0_0__2__CAUSAL =
      FilterDefinition.from(
          "0.3 0.0 2 HP causal",
          Optional.of("Butterworth IIR high-pass, 0.3 Hz, order 2, causal"),
          LinearFilterDescription.builder()
              .setComments("0.3 0.0 2 HP causal")
              .setFilterType(FilterType.LINEAR)
              .setLinearFilterType(LinearFilterType.IIR_BUTTERWORTH)
              .setPassBandType(PassBandType.HIGH_PASS)
              .setLowFrequencyHz(0.3)
              .setOrder(2)
              .setCausal(true)
              .setZeroPhase(false)
              .build());

  public static final FilterDefinition B__BP__2_0__4_0__4__CAUSAL =
      FilterDefinition.from(
          "2.0 4.0 4 BP causal",
          Optional.of("Butterworth IIR band-pass, 2.0-4.0 Hz, order 4, causal"),
          LinearFilterDescription.builder()
              .setComments("2.0 4.0 4 BP causal")
              .setFilterType(FilterType.LINEAR)
              .setLinearFilterType(LinearFilterType.IIR_BUTTERWORTH)
              .setPassBandType(PassBandType.BAND_PASS)
              .setLowFrequencyHz(2.0)
              .setHighFrequencyHz(4.0)
              .setOrder(4)
              .setCausal(true)
              .setZeroPhase(false)
              .build());

  public static final FilterDefinition B__BR__2_0__4_5__3__CAUSAL =
      FilterDefinition.from(
          "2.0 4.5 3 BR causal",
          Optional.of("Butterworth IIR band-reject, 2.0-4.0 Hz, order 4, causal"),
          LinearFilterDescription.builder()
              .setComments("2.0 4.5 3 BR causal")
              .setFilterType(FilterType.LINEAR)
              .setLinearFilterType(LinearFilterType.IIR_BUTTERWORTH)
              .setPassBandType(PassBandType.BAND_REJECT)
              .setLowFrequencyHz(2.0)
              .setHighFrequencyHz(4.5)
              .setOrder(3)
              .setCausal(true)
              .setZeroPhase(false)
              .build());

  public static final FilterDefinition H__LP__0_0__4_2__48__NON_CAUSAL =
      FilterDefinition.from(
          "0.0 4.2 48 LP non-causal",
          Optional.of("Hamming FIR low-pass, 4.2 Hz, order 48, causal"),
          LinearFilterDescription.builder()
              .setComments("0.0 4.2 48 LP non-causal")
              .setFilterType(FilterType.LINEAR)
              .setLinearFilterType(LinearFilterType.FIR_HAMMING)
              .setPassBandType(PassBandType.LOW_PASS)
              .setHighFrequencyHz(4.2)
              .setOrder(48)
              .setCausal(false)
              .setZeroPhase(true)
              .build());

  public static final FilterDefinition H__HP__0_3__0_0__48__CAUSAL =
      FilterDefinition.from(
          "0.3 0.0 48 HP causal",
          Optional.of("Hamming FIR high-pass, 0.3 Hz, order 48, causal"),
          LinearFilterDescription.builder()
              .setComments("0.3 0.0 48 HP causal")
              .setFilterType(FilterType.LINEAR)
              .setLinearFilterType(LinearFilterType.FIR_HAMMING)
              .setPassBandType(PassBandType.HIGH_PASS)
              .setLowFrequencyHz(0.3)
              .setOrder(48)
              .setCausal(true)
              .setZeroPhase(false)
              .build());

  public static final FilterDefinition H__BP__0_4__3_5__48__CAUSAL =
      FilterDefinition.from(
          "0.4 3.5 48 BP causal",
          Optional.of("Hamming FIR high-pass, 0.4-3.5 Hz, order 48, causal"),
          LinearFilterDescription.builder()
              .setComments("0.4 3.5 48 BP causal")
              .setFilterType(FilterType.LINEAR)
              .setLinearFilterType(LinearFilterType.FIR_HAMMING)
              .setPassBandType(PassBandType.BAND_PASS)
              .setLowFrequencyHz(0.4)
              .setHighFrequencyHz(3.5)
              .setOrder(48)
              .setCausal(true)
              .setZeroPhase(false)
              .build());

  public static final FilterDefinition CASCADE__CAUSAL =
      FilterDefinition.from(
          "Cascade causal",
          Optional.of("Cascade of 0.3 0.0 2 HP causal and 0.3 0.0 48 HP causal"),
          CascadeFilterDescription.from(
              Optional.of("Cascade causal"),
              Optional.empty(),
              List.of(
                  B__HP__0_3__0_0__2__CAUSAL.getFilterDescription(),
                  H__HP__0_3__0_0__48__CAUSAL.getFilterDescription()),
              Optional.empty()));

  public static final FilterDefinition CASCADE__NON_CAUSAL =
      FilterDefinition.from(
          "Cascade non-causal",
          Optional.of("Cascade of 0.0 4.2 1 LP non-causal and 0.0 4.2 48 LP non-causal"),
          CascadeFilterDescription.from(
              Optional.of("Cascade non-causal"),
              Optional.empty(),
              List.of(
                  B__LP__0_0__4_2__1__NON_CAUSAL.getFilterDescription(),
                  H__LP__0_0__4_2__48__NON_CAUSAL.getFilterDescription()),
              Optional.empty()));

  public static final FilterDefinition PHASE_MATCH =
      FilterDefinition.from(
          "pSKS Phase Match",
          Optional.of("pSKS Phase Match Comments"),
          PhaseMatchFilterDescription.from(
              "pSKS Phase Match",
              UtilsTestFixtures.fapResponse,
              true,
              "dispersion_model",
              2.0,
              0.1,
              6.0,
              0.2,
              TaperFunction.COSINE,
              3,
              Duration.ofMinutes(30),
              Duration.ofMinutes(5),
              PhaseType.pSKS,
              new TaperDefinition(Duration.ZERO, TaperFunction.HANNING),
              null));

  public static final Set<FilterDefinition> ALL_DEFINITIONS =
      Set.of(
          B__LP__0_0__4_2__1__NON_CAUSAL,
          B__HP__0_3__0_0__2__CAUSAL,
          B__BP__2_0__4_0__4__CAUSAL,
          B__BR__2_0__4_5__3__CAUSAL,
          H__LP__0_0__4_2__48__NON_CAUSAL,
          H__HP__0_3__0_0__48__CAUSAL,
          H__BP__0_4__3_5__48__CAUSAL,
          CASCADE__CAUSAL,
          CASCADE__NON_CAUSAL);
}
