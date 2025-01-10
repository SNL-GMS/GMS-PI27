package gms.shared.derivedchannel.coi;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.ASAR_FACET_STATION;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_FACET;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_STA01_STA01_SHZ;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_TWO_FACET;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.TXAR_TEST_STATION;

import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.BeamSummation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.common.coi.types.SamplingType;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.Orientation;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.stationdefinition.testfixtures.FilterDefinitionTestFixtures;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;

public final class BeamTestFixtures {

  public static final UUID UUID_1 = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b871");
  private static final Duration BEAM_DURATION = Duration.ofMinutes(5);
  private static final Duration LEAD_DURATION = Duration.ofSeconds(5);
  private static final Duration LEAD_DURATION_TWO = Duration.ofSeconds(10);
  public static final int MIN_WAVEFORMS_TO_BEAM = 2;
  public static final double SAMPLE_RATE_TOLERANCE = 0.5;
  public static final String STATION = "MKAR";
  public static final Channel MISSING_TXAR_CHANNEL =
      Channel.createVersionReference("TXAR.TX05.SHZ", Instant.EPOCH);
  public static final ImmutableList<String> CHANNEL_GROUPS = ImmutableList.of("MK01", "MK02");
  public static final ImmutableList<String> CHANNELS = ImmutableList.of("SHZ", "HZ");
  public static final double ORIENTATION_TOLERANCE = 5.0;

  public static final EventHypothesis EVENT_HYPOTHESIS =
      EventTestFixtures.generateDummyEventHypothesis(
          UUID_1,
          EventTestFixtures.HYPOTHESIS_UUID,
          EventTestFixtures.LOCATION_UUID,
          3.3,
          Instant.EPOCH,
          MagnitudeType.MB,
          DoubleValue.from(3.3, Optional.empty(), Units.COUNT),
          List.of());

  private BeamTestFixtures() {}

  public static final Station TXAR_STATION =
      UtilsTestFixtures.getTXARStation(
          UtilsTestFixtures.getTXARChannelGroups(),
          UtilsTestFixtures.getTXARChannels(),
          UtilsTestFixtures.getTXARChannelPairs());

  public static final Station TXAR_STATION_WRONG_CHANNELS = TXAR_TEST_STATION;

  public static final List<Channel> getTXARChannels() {
    var channels = UtilsTestFixtures.getTXARChannels();
    channels.remove(MISSING_TXAR_CHANNEL);
    return channels;
  }

  public static final BeamDescription TXAR_BEAM_DESCRIPTION =
      BeamDescription.builder()
          .setBeamSummation(BeamSummation.COHERENT)
          .setBeamType(BeamType.EVENT)
          .setPhase(PhaseType.P)
          .setSamplingType(SamplingType.NEAREST_SAMPLE)
          .setTwoDimensional(true)
          .build();

  public static final BeamformingTemplate TXAR_BEAMFORMING_TEMPLATE =
      BeamformingTemplate.builder()
          .setOrientationAngleToleranceDeg(ORIENTATION_TOLERANCE)
          .setLeadDuration(LEAD_DURATION)
          .setBeamDuration(BEAM_DURATION)
          .setSampleRateToleranceHz(SAMPLE_RATE_TOLERANCE)
          .setMinWaveformsToBeam(MIN_WAVEFORMS_TO_BEAM)
          .setBeamDescription(TXAR_BEAM_DESCRIPTION)
          .setStation(
              Station.createVersionReference(
                  TXAR_STATION.getName(), TXAR_STATION.getEffectiveAt().get()))
          .setInputChannels(
              ImmutableList.copyOf(
                  getTXARChannels().stream()
                      .map(Channel::createVersionReference)
                      .collect(Collectors.toList())))
          .build();

  public static final BeamDescription TXAR_AMPLITUDE_BEAM_DESCRIPTION =
      TXAR_BEAM_DESCRIPTION.toBuilder().setBeamType(BeamType.AMPLITUDE).build();

  public static final BeamformingTemplate TXAR_AMPLITUDE_BEAMFORMING_TEMPLATE =
      TXAR_BEAMFORMING_TEMPLATE.toBuilder()
          .setBeamDescription(TXAR_AMPLITUDE_BEAM_DESCRIPTION)
          .build();

  public static final BeamDescription CONTINUOUS_BEAM_DESCRIPTION =
      BeamDescription.builder()
          .setBeamSummation(BeamSummation.COHERENT)
          .setBeamType(BeamType.CONTINUOUS_LOCATION)
          .setPhase(PhaseType.WILD_CARD)
          .setSamplingType(SamplingType.NEAREST_SAMPLE)
          .setPreFilterDefinition(FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL)
          .setTwoDimensional(true)
          .build();

  public static final BeamformingTemplate CONTINUOUS_BEAMFORMING_TEMPLATE =
      BeamformingTemplate.builder()
          .setLeadDuration(LEAD_DURATION_TWO)
          .setBeamDuration(BEAM_DURATION)
          .setSampleRateToleranceHz(SAMPLE_RATE_TOLERANCE)
          .setOrientationAngleToleranceDeg(ORIENTATION_TOLERANCE)
          .setMinWaveformsToBeam(MIN_WAVEFORMS_TO_BEAM)
          .setBeamDescription(CONTINUOUS_BEAM_DESCRIPTION)
          .setStation(
              Station.createVersionReference(
                  UtilsTestFixtures.TEST_STATION.getName(),
                  UtilsTestFixtures.TEST_STATION.getEffectiveAt().get()))
          .setInputChannels(
              ImmutableList.of(
                  Channel.createVersionReference(CHANNEL_STA01_STA01_SHZ.toEntityReference())))
          .build();
  public static final BeamformingTemplate MULTI_CHANNEL_BEAMFORMING_TEMPLATE =
      BeamformingTemplate.builder()
          .setLeadDuration(LEAD_DURATION_TWO)
          .setBeamDuration(BEAM_DURATION)
          .setSampleRateToleranceHz(SAMPLE_RATE_TOLERANCE)
          .setOrientationAngleToleranceDeg(ORIENTATION_TOLERANCE)
          .setMinWaveformsToBeam(MIN_WAVEFORMS_TO_BEAM)
          .setBeamDescription(CONTINUOUS_BEAM_DESCRIPTION)
          .setStation(
              Station.createVersionReference(
                  UtilsTestFixtures.TEST_STATION.getName(),
                  UtilsTestFixtures.TEST_STATION.getEffectiveAt().get()))
          .setInputChannels(
              ImmutableList.of(
                  Channel.createVersionReference(CHANNEL_STA01_STA01_SHZ.toEntityReference()),
                  Channel.createVersionReference(CHANNEL_STA01_STA01_SHZ.toEntityReference())))
          .build();

  public static final BeamformingTemplate MULTI_CHANNEL_STA_BEAMFORMING_TEMPLATE =
      BeamformingTemplate.builder()
          .setLeadDuration(LEAD_DURATION_TWO)
          .setBeamDuration(BEAM_DURATION)
          .setSampleRateToleranceHz(SAMPLE_RATE_TOLERANCE)
          .setOrientationAngleToleranceDeg(ORIENTATION_TOLERANCE)
          .setMinWaveformsToBeam(MIN_WAVEFORMS_TO_BEAM)
          .setBeamDescription(CONTINUOUS_BEAM_DESCRIPTION)
          .setStation(
              Station.createVersionReference(
                  UtilsTestFixtures.TEST_STATION.getName(),
                  UtilsTestFixtures.TEST_STATION.getEffectiveAt().get()))
          .setInputChannels(
              ImmutableList.of(
                  Channel.createVersionReference(UtilsTestFixtures.CHANNEL.toEntityReference()),
                  Channel.createVersionReference(UtilsTestFixtures.CHANNEL.toEntityReference())))
          .build();
  public static final BeamDefinition BEAM_DEFINITION =
      BeamDefinition.builder()
          .setBeamDescription(CONTINUOUS_BEAM_DESCRIPTION)
          .setBeamParameters(getDefaultBeamParametersBuilder().build())
          .build();

  public static final Pair<TagName, Long> ASSOC_RECORD_PAIR = Pair.of(TagName.EVID, 211L);
  public static final String ASSOC_RECORD_STRING =
      "/bridged," + ASSOC_RECORD_PAIR.getLeft() + ":" + ASSOC_RECORD_PAIR.getRight();

  public static BeamDescription getDefaultBeamDescription() {
    BeamDescription.Builder builder = BeamDescription.builder();
    builder.setBeamSummation(BeamSummation.RMS);
    builder.setTwoDimensional(true);
    builder.setPhase(PhaseType.PnPn);
    builder.setSamplingType(SamplingType.NEAREST_SAMPLE);
    builder.setBeamType(BeamType.EVENT);
    builder.setPreFilterDefinition(FilterDefinitionTestFixtures.B__BP__2_0__4_0__4__CAUSAL);
    return builder.build();
  }

  public static BeamParameters.Builder getDefaultBeamParametersBuilder() {
    var orientation = Orientation.from(Optional.of(180.0), Optional.of(90.0));
    BeamParameters.Builder builder = BeamParameters.builder();
    builder.setMinWaveformsToBeam(2);
    builder.setSampleRateHz(20.0);
    builder.setSampleRateToleranceHz(0.5);
    builder.setSlownessSecPerDeg(1.0);
    builder.setReceiverToSourceAzimuthDeg(90.0);
    builder.setOrientationAngleToleranceDeg(90.0);
    builder.setOrientationAngles(orientation);
    var eventHypothesis =
        EventTestFixtures.generateDummyEventHypothesis(
            UUID_1,
            EventTestFixtures.HYPOTHESIS_UUID,
            EventTestFixtures.LOCATION_UUID,
            3.3,
            Instant.EPOCH,
            MagnitudeType.MB,
            DoubleValue.from(3.3, Optional.empty(), Units.COUNT),
            List.of());
    var location = Location.from(100.0, 50.0, 50.0, 100.0);
    var signalDetectionHypothesis = SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS_NO_MCS;
    builder.setEventHypothesis(eventHypothesis);
    builder.setLocation(location);
    builder.setSignalDetectionHypothesis(signalDetectionHypothesis);

    return builder;
  }

  public static BeamformingTemplate.Builder getDefaultBeamformingTemplateBuilder() {
    var beamDescription = getDefaultBeamDescription();

    BeamformingTemplate.Builder builder = BeamformingTemplate.builder();
    builder.setOrientationAngleToleranceDeg(ORIENTATION_TOLERANCE);
    builder.setBeamDuration(BEAM_DURATION);
    builder.setLeadDuration(LEAD_DURATION);
    builder.setBeamDescription(beamDescription);
    builder.setMinWaveformsToBeam(MIN_WAVEFORMS_TO_BEAM);
    builder.setSampleRateToleranceHz(SAMPLE_RATE_TOLERANCE);
    builder.setStation(ASAR_FACET_STATION);
    builder.setInputChannels(ImmutableList.of(CHANNEL_FACET, CHANNEL_TWO_FACET));

    return builder;
  }
}
