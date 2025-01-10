package gms.shared.stationdefinition.utils;

import static gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType.BEAM_TYPE;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.END_TIME;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.REFERENCE_STATION;

import gms.shared.stationdefinition.coi.channel.AmplitudePhaseResponse;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Calibration;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelBandType;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.ChannelInstrumentType;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.Orientation;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.repository.util.ChannelFactory;
import gms.shared.stationdefinition.testfixtures.UtilsTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public class ChannelFactoryTestFixtures {
  // location constants
  private static final double LAT2 = 35.0;
  private static final double LON2 = -125.0;
  private static final double DEPTH2 = 100.0;
  private static final double ELEVATION2 = 5500.0;

  // Create a Calibration
  public static final double FACTOR = 1.2;
  public static final double FACTOR_ERROR = 0.112;
  public static final double PERIOD = 14.5;
  public static final long TIME_SHIFT = (long) 2.24;

  public static final DoubleValue CAL_FACTOR =
      DoubleValue.from(FACTOR, Optional.of(FACTOR_ERROR), Units.SECONDS);
  public static final Duration CAL_TIME_SHIFT = Duration.ofSeconds(TIME_SHIFT);

  public static final Calibration calibration =
      Calibration.from(PERIOD, CAL_TIME_SHIFT, CAL_FACTOR);

  public static final String CHANNEL_GROUP_DESCRIPTION = "Channel Group Description";

  public static final String STATION_DESCRIPTION = "This is a test station facet for ASAR station";

  // create an AmplitudePhaseResponse -> amplitudePhaseResponse
  public static final DoubleValue amplitude =
      DoubleValue.from(0.000014254, Optional.of(0.0), Units.NANOMETERS_PER_COUNT);
  public static final DoubleValue phase =
      DoubleValue.from(350.140599, Optional.of(0.0), Units.DEGREES);

  public static final AmplitudePhaseResponse amplitudePhaseResponse =
      AmplitudePhaseResponse.from(amplitude, phase);

  // create a FrequencyAmplitudePhase (fapResponse) using amplitudePhaseResponse created above
  public static final double FREQUENCY = 0.001000;
  public static final FrequencyAmplitudePhase fapResponse =
      FrequencyAmplitudePhase.builder()
          .setId(UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b871"))
          .setData(
              FrequencyAmplitudePhase.Data.builder()
                  .setFrequencies(List.of(FREQUENCY))
                  .setAmplitudePhaseResponses(
                      List.of(
                          AmplitudePhaseResponse.from(
                              DoubleValue.from(
                                  0.000014254, Optional.of(0.0), Units.NANOMETERS_PER_COUNT),
                              DoubleValue.from(350.140599, Optional.of(0.0), Units.DEGREES))))
                  .setNominalSampleRateHz(0.0)
                  .setNominalCalibration(UtilsTestFixtures.calibration)
                  .build())
          .build();

  // create a FrequencyAmplitudePhase (fapResponse using TWO amplitudePhaseResponses created
  // above...
  public static final double FREQUENCY_2 = 0.001010;
  public static final FrequencyAmplitudePhase responseByFrequency2 =
      FrequencyAmplitudePhase.builder()
          .setId(UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b471"))
          .setData(
              FrequencyAmplitudePhase.Data.builder()
                  .setFrequencies(List.of(FREQUENCY, FREQUENCY_2))
                  .setAmplitudePhaseResponses(
                      List.of(
                          AmplitudePhaseResponse.from(
                              DoubleValue.from(
                                  0.000014254, Optional.of(0.0), Units.NANOMETERS_PER_COUNT),
                              DoubleValue.from(350.140599, Optional.of(0.0), Units.DEGREES)),
                          AmplitudePhaseResponse.from(
                              DoubleValue.from(
                                  0.000014685, Optional.of(0.0), Units.NANOMETERS_PER_COUNT),
                              DoubleValue.from(350.068990, Optional.of(0.0), Units.DEGREES))))
                  .setNominalSampleRateHz(0.0)
                  .setNominalCalibration(UtilsTestFixtures.calibration)
                  .build())
          .build();
  public static final String CHANNEL_NAME = "CHAN01";

  // create the response using fapResponse created above
  public static final Response RESPONSE_1 = getResponse(CHANNEL_NAME);

  public static final String GROUP_NAME = "GROUP";
  public static final String GROUP_DESCRIPTION = "Test Station Group 1";
  public static final String EXAMPLE_STATION = "Example Station";
  public static final String CHANNEL_NAME_ONE = "Real Channel Name One";
  public static final String CHANNEL_SHZ = "SHZ";
  public static final String STA01_STA01_BHE = "STA.STA01.BHE";
  public static final String STA01_STA01_SHZ = "STA.STA01.SHZ";
  public static final String STA = "STA";
  public static final String STA01 = "STA01";
  public static final String ASAR_STA = "ASAR";
  public static final String TXAR_STA = "TXAR";
  public static final String EVENT_BEAM_CHANNEL_NAME_ONE = "Event Beam Channel Name One";
  public static final String FK_BEAM_CHANNEL_NAME_ONE = "Fk Beam Channel Name One";
  public static final String RAW_CHANNEL_NAME_ONE = "Raw Channel Name One";
  public static final String CHANNEL_NAME_TWO = "Real Channel Name Two";
  public static final String CHANNEL_GROUP_NAME = "Test Channel Group";
  public static final String TX_NAME = "TX";
  public static final String CANONICAL_NAME_ONE = "Canonical Name One";
  public static final String CANONICAL_NAME_TWO = "Canonical Name Two";

  public static final FilterDefinition FILTER_DEFINITION =
      FilterDefinition.from(
          "MY_AMAZING_FILTER",
          Optional.empty(),
          LinearFilterDescription.from(
              Optional.empty(),
              Optional.empty(),
              true,
              FilterType.LINEAR,
              Optional.of(1.0),
              Optional.of(2.0),
              1,
              false,
              PassBandType.BAND_PASS,
              LinearFilterType.FIR_HAMMING,
              Optional.empty()));

  public static final Channel CHANNEL_NULL = null;
  public static final Channel CHANNEL_FACET =
      Channel.builder().setName(CHANNEL_NAME_ONE).setEffectiveAt(Instant.EPOCH).build();

  public static final Channel CHANNEL =
      Channel.builder()
          .setName(CHANNEL_NAME_ONE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelData(CANONICAL_NAME_ONE, getResponse(CHANNEL_NAME_ONE)))
          .build();

  public static final Channel CHANNEL_STA01_STA01_BHE =
      Channel.builder()
          .setName(STA01_STA01_BHE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelData(CANONICAL_NAME_ONE, getResponse(STA01_STA01_BHE)))
          .build();

  public static final Channel CHANNEL_STA01_STA01_SHZ =
      Channel.builder()
          .setName(STA01_STA01_SHZ)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelData(CANONICAL_NAME_ONE, getResponse(STA01_STA01_SHZ)))
          .build();

  public static final Channel EVENT_BEAM_CHANNEL =
      Channel.builder()
          .setName(STA01)
          .setEffectiveAt(Instant.EPOCH)
          .setData(
              createTestEventBeamChannelData(
                  CANONICAL_NAME_ONE, getResponse(EVENT_BEAM_CHANNEL_NAME_ONE)))
          .build();

  public static final Channel FILTERED_EVENT_BEAM_CHANNEL =
      ChannelFactory.createFiltered(EVENT_BEAM_CHANNEL, FILTER_DEFINITION);

  public static final Channel FK_BEAM_CHANNEL =
      Channel.builder()
          .setName(FK_BEAM_CHANNEL_NAME_ONE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(
              createTestFkBeamChannelData(
                  CANONICAL_NAME_ONE, getResponse(FK_BEAM_CHANNEL_NAME_ONE)))
          .build();

  public static final Channel FILTERED_FK_BEAM_CHANNEL =
      ChannelFactory.createFiltered(FK_BEAM_CHANNEL, FILTER_DEFINITION);

  public static final Channel RAW_CHANNEL =
      Channel.builder()
          .setName(RAW_CHANNEL_NAME_ONE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestRawChannelData(CANONICAL_NAME_ONE, getResponse(RAW_CHANNEL_NAME_ONE)))
          .build();

  public static final Channel FILTERED_RAW_CHANNEL =
      ChannelFactory.createFiltered(RAW_CHANNEL, FILTER_DEFINITION);

  public static Response getResponse(String channelName) {
    return Response.builder()
        .setId(UUID.nameUUIDFromBytes(channelName.getBytes()))
        .setEffectiveAt(Instant.EPOCH)
        .setData(
            Response.Data.builder()
                .setCalibration(calibration)
                .setFapResponse(FrequencyAmplitudePhase.createEntityReference(fapResponse.getId()))
                .setEffectiveUntil(END_TIME)
                .build())
        .build();
  }

  public static Channel.Data createTestRawChannelData(String canonicalName, Response response) {
    return createTestChannelData(canonicalName, response).toBuilder()
        .setConfiguredInputs(List.of())
        .build();
  }

  public static Channel.Data createTestChannelData(String canonicalName, Response response) {
    return Channel.Data.builder()
        .setCanonicalName(canonicalName)
        .setDescription("Example description")
        .setStation(Station.createEntityReference(REFERENCE_STATION))
        .setChannelDataType(ChannelDataType.DIAGNOSTIC_SOH)
        .setChannelBandType(ChannelBandType.BROADBAND)
        .setChannelInstrumentType(ChannelInstrumentType.HIGH_GAIN_SEISMOMETER)
        .setChannelOrientationType(ChannelOrientationType.VERTICAL)
        .setChannelOrientationCode('Z')
        .setUnits(Units.NANOMETERS)
        .setNominalSampleRateHz(65.0)
        .setLocation(Location.from(LAT2, LON2, DEPTH2, ELEVATION2))
        .setOrientationAngles(Orientation.from(Optional.of(65.0), Optional.of(135.0)))
        .setConfiguredInputs(List.of(CHANNEL_FACET))
        .setProcessingDefinition(Map.of())
        .setProcessingMetadata(Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, GROUP_NAME))
        .setResponse(response)
        .setEffectiveUntil(Instant.now().plus(30, ChronoUnit.MINUTES))
        .build();
  }

  public static Channel.Data createTestEventBeamChannelData(
      String canonicalName, Response response) {
    return createTestChannelData(canonicalName, response).toBuilder()
        .setProcessingMetadata(
            Map.of(
                ChannelProcessingMetadataType.CHANNEL_GROUP, GROUP_NAME, BEAM_TYPE, BeamType.EVENT))
        .build();
  }

  public static Channel.Data createTestFkBeamChannelData(String canonicalName, Response response) {
    return createTestChannelData(canonicalName, response).toBuilder()
        .setProcessingMetadata(
            Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, GROUP_NAME, BEAM_TYPE, BeamType.FK))
        .build();
  }
}
