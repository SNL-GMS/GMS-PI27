package gms.shared.signalenhancement.testfixtures;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.signalenhancement.coi.fk.FkSpectraTemplate;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.fk.FkFrequencyRange;
import gms.shared.stationdefinition.coi.fk.FkSpectraParameters;
import gms.shared.stationdefinition.coi.fk.FkUncertaintyOption;
import gms.shared.stationdefinition.coi.fk.FkWaveformSampleRate;
import gms.shared.stationdefinition.coi.fk.FkWindow;
import gms.shared.stationdefinition.coi.fk.SlownessGrid;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.TaperFunction;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public final class FkSpectraTemplateFixtures {

  private FkSpectraTemplateFixtures() {
    // private constructor to make sonar happy
  }

  public static final String ANY_STATION_NAME = "ANY";
  public static final String MY_STATION_NAME = "MY_STATION";

  public static final PhaseType ANY_STATION_PHASE_TYPE = PhaseType.P3KP;
  public static final Station ANY_STATION =
      DefaultCoiTestFixtures.getDefaultStationForTime(
          ANY_STATION_NAME, "TEST", List.of("SHZ"), Instant.EPOCH);
  public static final List<Channel> ANY_STATION_CHANNELS =
      ANY_STATION.getAllRawChannels().stream().map(Channel::createVersionReference).toList();
  public static final Station ANY_STATION_VERSION_REFERENCE =
      Station.createVersionReference(ANY_STATION);

  public static final Station MY_STATION =
      DefaultCoiTestFixtures.getDefaultStationForTime(
          MY_STATION_NAME, "TEST", List.of("BHZ"), Instant.EPOCH);
  public static final List<Channel> MY_STATION_CHANNELS =
      MY_STATION.getAllRawChannels().stream().map(Channel::createVersionReference).toList();

  public static final String ASAR_STATION_NAME = "ASAR";

  public static final PhaseType ASAR_PHASE_TYPE = PhaseType.P;
  public static final Station ASAR_STATION =
      DefaultCoiTestFixtures.getDefaultStationForTime(
          ASAR_STATION_NAME, "AS01", List.of("BHN", "SHN"), Instant.EPOCH);

  public static final Station ASAR_STATION_WITH_FILTERED_STATIONS =
      DefaultCoiTestFixtures.getDefaultStationForTime(
          "ASAR", "AS01", List.of("BHZ", "SHZ"), Instant.EPOCH);

  public static final Station ASAR_STATION_VERSION_REFERENCE =
      Station.createVersionReference(ASAR_STATION);

  private static final FkSpectraParameters FK_SPECRA_DEFAULT_PARAMETERS =
      new FkSpectraParameters(
          ANY_STATION_PHASE_TYPE,
          Optional.of(UtilsTestFixtures.FILTER_DEFINITION),
          new SlownessGrid(8.883, 10),
          TaperFunction.BLACKMAN,
          new FkWindow(Duration.ofSeconds(1), Duration.ZERO),
          new FkFrequencyRange(3.3, 4.2),
          FkUncertaintyOption.EMPIRICAL,
          new FkWaveformSampleRate(4.9, 9.9737),
          Duration.ofSeconds(1),
          0,
          1,
          false,
          true,
          5);

  public static final FkSpectraTemplate FK_SPECTRA_TEMPLATE_DEFAULT_TEMPLATE =
      new FkSpectraTemplate(
          new FkWindow(Duration.ofSeconds(1), Duration.ZERO),
          ANY_STATION_VERSION_REFERENCE,
          ANY_STATION_PHASE_TYPE,
          ANY_STATION_CHANNELS,
          FK_SPECRA_DEFAULT_PARAMETERS);

  public static final FkSpectraTemplate FK_SPECTRA_TEMPLATE_ASAR_P_NO_CHANNELS_MATCH_TEMPLATE =
      new FkSpectraTemplate(
          new FkWindow(Duration.ofSeconds(1), Duration.ZERO),
          ASAR_STATION_VERSION_REFERENCE,
          ASAR_PHASE_TYPE,
          List.of(),
          FK_SPECRA_DEFAULT_PARAMETERS.toBuilder().setPhaseType(ASAR_PHASE_TYPE).build());

  public static final FkSpectraTemplate FK_SPECTRA_TEMPLATE_ASAR_P_TEMPLATE =
      new FkSpectraTemplate(
          new FkWindow(Duration.ofSeconds(1), Duration.ZERO),
          ASAR_STATION_VERSION_REFERENCE,
          ASAR_PHASE_TYPE,
          ASAR_STATION_WITH_FILTERED_STATIONS.getAllRawChannels().stream()
              .filter(channel -> channel.getName().contains("BHZ"))
              .collect(Collectors.toList()),
          FK_SPECRA_DEFAULT_PARAMETERS.toBuilder().setPhaseType(ASAR_PHASE_TYPE).build());

  public static final FkSpectraTemplate FK_SPECTRA_PHASE_ONLY_TEMPLATE =
      new FkSpectraTemplate(
          new FkWindow(Duration.ofSeconds(1), Duration.ZERO),
          ANY_STATION_VERSION_REFERENCE,
          PhaseType.LR,
          ANY_STATION_CHANNELS,
          FK_SPECRA_DEFAULT_PARAMETERS.toBuilder().setPhaseType(PhaseType.LR).build());

  public static final FkSpectraTemplate FK_SPECTRA_STATION_ONLY_TEMPLATE =
      new FkSpectraTemplate(
          new FkWindow(Duration.ofSeconds(1), Duration.ZERO),
          Station.createVersionReference(MY_STATION_NAME, Instant.EPOCH),
          PhaseType.P4KPdf_B,
          MY_STATION_CHANNELS,
          FK_SPECRA_DEFAULT_PARAMETERS.toBuilder().setPhaseType(PhaseType.P4KPdf_B).build());
}
