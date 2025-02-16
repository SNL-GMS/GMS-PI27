package gms.shared.stationdefinition.testfixtures;

import static gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType.BEAM_TYPE;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.INSTRUMENT_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.INSTRUMENT_DAO_2;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.INSTRUMENT_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SENSOR_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SENSOR_DAO_2;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SENSOR_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SINGLE_SITE;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SINGLE_SITE_CHAN;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_2;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_CHAN_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_2;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_4;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_REF_21;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_REF_22;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_REF_31;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_REF_32;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_REF_33;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_REF_41;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SITE_DAO_REF_42;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_2;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_3;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.createInstrumentDao;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.CHAN1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.CHAN2;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.CHAN3;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.CHAN4;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.CHAN_PARAM_MAP;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.END_TIME;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.LDATE;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.NETWORK_DESC_1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.NETWORK_DESC_2;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.NETWORK_NAME_1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.NETWORK_NAME_2;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.OFFDATE;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE2;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE3;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE4;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.REFERENCE_STATION;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.REFERENCE_STATION_2;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.REFERENCE_STATION_3;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.REFERENCE_STATION_4;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.SENSOR_PARAM_MAP;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA1_PARAM_MAP;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA2;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA2_PARAM_MAP;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA3;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA3_PARAM_MAP;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STA4;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STATION_NAME;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STAWW1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STAWW2;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STAXX1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STAXX2;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STAYY1;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STAYY2;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.STAYY3;

import com.google.common.collect.ImmutableSortedSet;
import com.google.common.collect.Multimap;
import gms.shared.stationdefinition.api.station.util.StationChangeTimesRequest;
import gms.shared.stationdefinition.coi.channel.AmplitudePhaseResponse;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Calibration;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelBandType;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.ChannelInstrumentType;
import gms.shared.stationdefinition.coi.channel.ChannelNameUtilities;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.stationdefinition.coi.channel.Orientation;
import gms.shared.stationdefinition.coi.channel.RelativePosition;
import gms.shared.stationdefinition.coi.channel.RelativePositionChannelPair;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.channel.Response.Data;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.filter.LinearFilterDescription;
import gms.shared.stationdefinition.coi.filter.types.FilterType;
import gms.shared.stationdefinition.coi.filter.types.LinearFilterType;
import gms.shared.stationdefinition.coi.filter.types.PassBandType;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.coi.station.StationType;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.utilities.bridge.database.converter.PositiveNaInstantToDoubleConverter;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableSet;
import java.util.Optional;
import java.util.TreeSet;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;

public final class UtilsTestFixtures {

  // relative position constants
  private static final int TXAR_COUNT = 10;
  private static final double NORTH = 50.0;
  private static final double EAST = 5.0;
  private static final double VERTICAL = 10.0;

  // location constants
  private static final double LAT = 35.647;
  private static final double LON = 100.0;
  private static final double DEPTH = 50.0;
  private static final double ELEVATION = 10.0;
  private static final double LAT2 = 35.0;
  private static final double LON2 = -125.0;
  private static final double DEPTH2 = 100.0;
  private static final double ELEVATION2 = 5500.0;

  // Create a Calibration
  public static final double FACTOR = 1.2;
  public static final double FACTOR_ERROR = 0.112;
  public static final double PERIOD = 14.5;
  public static final long TIME_SHIFT = (long) 2.24;

  // UUID for fap responses
  private static final UUID UUID_1 = UUID.fromString("505c377a-b6a4-478f-b3cd-5c934ee6b871");
  private static final UUID UUID_2 = UUID.fromString("00000000-0000-0000-0000-000000000001");

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
  private static final DoubleValue AMPLITUDE_1 =
      DoubleValue.from(0.000014254, Optional.of(0.0), Units.COUNTS_PER_NANOMETER);
  private static final DoubleValue PHASE_1 =
      DoubleValue.from(350.140599, Optional.of(0.0), Units.DEGREES);
  private static final AmplitudePhaseResponse A_P_RESPONSE =
      AmplitudePhaseResponse.from(AMPLITUDE_1, PHASE_1);

  public static final FrequencyAmplitudePhase fapResponse =
      FrequencyAmplitudePhase.builder()
          .setId(UUID.randomUUID())
          .setData(
              FrequencyAmplitudePhase.Data.builder()
                  .setFrequencies(List.of(FREQUENCY))
                  .setAmplitudePhaseResponses(List.of(A_P_RESPONSE))
                  .setNominalSampleRateHz(0.0)
                  .setNominalCalibration(calibration)
                  .build())
          .build();
  public static final FrequencyAmplitudePhase fapResponse2 =
      FrequencyAmplitudePhase.builder()
          .setId(UUID_1)
          .setData(
              FrequencyAmplitudePhase.Data.builder()
                  .setFrequencies(List.of(FREQUENCY))
                  .setAmplitudePhaseResponses(List.of(A_P_RESPONSE))
                  .setNominalSampleRateHz(0.0)
                  .setNominalCalibration(calibration)
                  .build())
          .build();

  // create a FrequencyAmplitudePhase (fapResponse using TWO amplitudePhaseResponses created
  // above...
  public static final double FREQUENCY_2 = 0.001010;
  private static final DoubleValue AMPLITUDE_2 =
      DoubleValue.from(0.000014685, Optional.of(0.0), Units.COUNTS_PER_NANOMETER);
  private static final DoubleValue PHASE_2 =
      DoubleValue.from(350.068990, Optional.of(0.0), Units.DEGREES);
  private static final AmplitudePhaseResponse A_P_RESPONSE_2 =
      AmplitudePhaseResponse.from(AMPLITUDE_2, PHASE_2);
  public static final FrequencyAmplitudePhase responseByFrequency2 =
      FrequencyAmplitudePhase.builder()
          .setId(UUID.randomUUID())
          .setData(
              FrequencyAmplitudePhase.Data.builder()
                  .setFrequencies(List.of(FREQUENCY, FREQUENCY_2))
                  .setAmplitudePhaseResponses(List.of(A_P_RESPONSE, A_P_RESPONSE_2))
                  .setNominalSampleRateHz(0.0)
                  .setNominalCalibration(calibration)
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
  public static final Channel CHANNEL_VERSION_REAL_NAME =
      Channel.builder().setName("STA.beam.BHE").build();

  public static final Channel CHANNEL_VERSION_REAL_ASAR =
      Channel.builder().setName("ASAR.beam.SHZ").build();

  public static final Channel CHANNEL =
      Channel.builder()
          .setName(CHANNEL_NAME_ONE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelData(CANONICAL_NAME_ONE, getResponse(CHANNEL_NAME_ONE)))
          .build();

  public static final Channel CHANNEL_SEG_TEST =
      Channel.builder()
          .setName(CHANNEL_NAME_ONE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(
              createTestChannelSegData(
                  CANONICAL_NAME_ONE,
                  getResponse(CHANNEL_NAME_ONE, fapResponse2),
                  Instant.EPOCH.plus(30, ChronoUnit.MINUTES)))
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
          .setName(EVENT_BEAM_CHANNEL_NAME_ONE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(
              createTestEventBeamChannelData(
                  CANONICAL_NAME_ONE, getResponse(EVENT_BEAM_CHANNEL_NAME_ONE)))
          .build();

  public static final Channel FK_BEAM_CHANNEL =
      Channel.builder()
          .setName(FK_BEAM_CHANNEL_NAME_ONE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(
              createTestFkBeamChannelData(
                  CANONICAL_NAME_ONE, getResponse(FK_BEAM_CHANNEL_NAME_ONE)))
          .build();

  public static final Channel RAW_CHANNEL =
      Channel.builder()
          .setName(RAW_CHANNEL_NAME_ONE)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestRawChannelData(CANONICAL_NAME_ONE, getResponse(RAW_CHANNEL_NAME_ONE)))
          .build();

  public static final Channel CHANNEL_TEST =
      Channel.builder()
          .setName(STA1.concat(".").concat(CHAN1))
          .setEffectiveAt(Instant.EPOCH)
          .setData(
              createTestChannelData(
                  CANONICAL_NAME_ONE, getResponse(STA1.concat(".").concat(CHAN1))))
          .build();

  public static final Channel CHANNEL_TWO_FACET =
      Channel.builder().setName(CHANNEL_NAME_TWO).setEffectiveAt(Instant.EPOCH).build();

  public static final Channel CHANNEL_TWO =
      Channel.builder()
          .setName(CHANNEL_NAME_TWO)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelData(CANONICAL_NAME_TWO, getResponse(CHANNEL_NAME_TWO)))
          .build();

  public static final ChannelGroup CHANNEL_GROUP_FACET_SINGLE =
      ChannelGroup.builder()
          .setName(CHANNEL_GROUP_NAME)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelGroupSingleChannelFacetData())
          .build();

  public static final ChannelGroup CHANNEL_GROUP_FACET =
      ChannelGroup.builder()
          .setName(CHANNEL_GROUP_NAME)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelGroupFacetData())
          .build();

  public static final ChannelGroup CHANNEL_GROUP =
      ChannelGroup.builder()
          .setName(CHANNEL_GROUP_NAME)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelGroupData())
          .build();

  public static final ChannelGroup CHANNEL_GROUP_STA01 =
      ChannelGroup.builder()
          .setName(STA01)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelGroupStaData())
          .build();

  public static final ChannelGroup CHANNEL_GROUP_STA01_TWO =
      ChannelGroup.builder()
          .setName(STA01)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelGroupStaDataTwo())
          .build();

  public static final ChannelGroup CHANNEL_2_GROUP =
      ChannelGroup.builder()
          .setName(CHANNEL_GROUP_NAME)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestChannelGroupSingleChannelFacetData())
          .build();

  public static final ChannelGroup CHANNEL_GROUP_TEST =
      ChannelGroup.builder()
          .setName(STA1)
          .setEffectiveAt(ONDATE)
          .setData(createTestChannelGroupData())
          .build();

  public static final ChannelGroup CHANNEL_GROUP1 =
      ChannelGroup.builder()
          .setName(STA1)
          .setEffectiveAt(CssDaoAndCoiParameters.ONDATE)
          .setData(createTestChannelGroupDataForCss())
          .build();

  public static final Station STATION_CHANNEL_GROUP_SINGLE_CHANNEL_FACET =
      Station.builder()
          .setName(REFERENCE_STATION)
          .setEffectiveAt(Instant.now())
          .setData(
              Station.Data.builder()
                  .setType(StationType.HYDROACOUSTIC)
                  .setDescription("This is a test station facet")
                  .setRelativePositionChannelPairs(
                      List.of(
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL_FACET),
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL_TWO_FACET)))
                  .setLocation(Location.from(LAT, LON, DEPTH, ELEVATION))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannelGroups(ImmutableSortedSet.of(CHANNEL_GROUP_FACET_SINGLE))
                  .setAllRawChannels(ImmutableSortedSet.of(CHANNEL_TWO_FACET))
                  .build())
          .build();

  //  STA01_STA01_BHE
  public static final Station BEAM_STATION =
      Station.builder()
          .setName(STA)
          .setEffectiveAt(Instant.now())
          .setData(
              Station.Data.builder()
                  .setType(StationType.HYDROACOUSTIC)
                  .setDescription("This is a test station beaming")
                  .setRelativePositionChannelPairs(
                      List.of(
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL),
                              Channel.createVersionReference(STA01_STA01_BHE, Instant.EPOCH))))
                  .setLocation(Location.from(LAT, LON, DEPTH, ELEVATION))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannelGroups(
                      ImmutableSortedSet.of(
                          ChannelGroup.createVersionReference(STA01, Instant.EPOCH)))
                  .setAllRawChannels(
                      ImmutableSortedSet.of(
                          Channel.createVersionReference(STA01_STA01_BHE, Instant.EPOCH)))
                  .build())
          .build();

  public static final Station ASAR_FACET_STATION =
      Station.builder()
          .setName(ASAR_STA)
          .setEffectiveAt(Instant.now())
          .setData(
              Station.Data.builder()
                  .setType(StationType.HYDROACOUSTIC)
                  .setDescription(STATION_DESCRIPTION)
                  .setRelativePositionChannelPairs(
                      List.of(
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL_FACET),
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL_TWO_FACET)))
                  .setLocation(Location.from(LAT, LON, DEPTH, ELEVATION))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannelGroups(ImmutableSortedSet.of(CHANNEL_GROUP_FACET))
                  .setAllRawChannels(ImmutableSortedSet.of(CHANNEL_FACET, CHANNEL_TWO_FACET))
                  .build())
          .build();

  public static final Station STATION_FACET =
      Station.builder()
          .setName(REFERENCE_STATION)
          .setEffectiveAt(Instant.now())
          .setData(
              Station.Data.builder()
                  .setType(StationType.HYDROACOUSTIC)
                  .setDescription("This is a test station facet")
                  .setRelativePositionChannelPairs(
                      List.of(
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL_FACET),
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL_TWO_FACET)))
                  .setLocation(Location.from(LAT, LON, DEPTH, ELEVATION))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannelGroups(ImmutableSortedSet.of(CHANNEL_GROUP_FACET))
                  .setAllRawChannels(ImmutableSortedSet.of(CHANNEL_FACET, CHANNEL_TWO_FACET))
                  .build())
          .build();

  public static final Station STATION_FACET_2 =
      Station.builder().setName(REFERENCE_STATION).setEffectiveAt(Instant.now()).build();

  public static final Station STATION =
      Station.builder()
          .setName(REFERENCE_STATION)
          .setEffectiveAt(Instant.now())
          .setData(
              Station.Data.builder()
                  .setType(StationType.HYDROACOUSTIC)
                  .setDescription("This is a test station1")
                  .setRelativePositionChannelPairs(
                      List.of(
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL),
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL_TWO)))
                  .setLocation(Location.from(LAT, LON, DEPTH, ELEVATION))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannelGroups(ImmutableSortedSet.of(CHANNEL_GROUP))
                  .setAllRawChannels(ImmutableSortedSet.of(CHANNEL, CHANNEL_TWO))
                  .build())
          .build();

  public static final Station STATION_EVENT_BEAM =
      Station.builder()
          .setName(REFERENCE_STATION)
          .setEffectiveAt(Instant.now())
          .setData(
              Station.Data.builder()
                  .setType(StationType.HYDROACOUSTIC)
                  .setDescription("This is a test station1")
                  .setRelativePositionChannelPairs(
                      List.of(
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL),
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL_TWO)))
                  .setLocation(Location.from(LAT, LON, DEPTH, ELEVATION))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannelGroups(ImmutableSortedSet.of(CHANNEL_GROUP))
                  .setAllRawChannels(ImmutableSortedSet.of(CHANNEL, CHANNEL_TWO))
                  .build())
          .build();

  public static final Station STATION_2 =
      Station.builder()
          .setName(EXAMPLE_STATION + " 2")
          .setEffectiveAt(Instant.now())
          .setData(
              Station.Data.builder()
                  .setType(StationType.HYDROACOUSTIC)
                  .setDescription("This is a test station2")
                  .setRelativePositionChannelPairs(
                      List.of(
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL),
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL_TWO)))
                  .setLocation(Location.from(LAT, LON, DEPTH, ELEVATION))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannelGroups(ImmutableSortedSet.of(CHANNEL_GROUP))
                  .setAllRawChannels(ImmutableSortedSet.of(CHANNEL, CHANNEL_TWO))
                  .build())
          .build();

  public static final Station TEST_STATION =
      Station.builder()
          .setName(STA)
          .setEffectiveAt(Instant.now())
          .setData(
              Station.Data.builder()
                  .setType(StationType.HYDROACOUSTIC)
                  .setDescription(STATION_DESCRIPTION)
                  .setRelativePositionChannelPairs(
                      List.of(
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL),
                              CHANNEL_STA01_STA01_BHE.toEntityReference()),
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL),
                              CHANNEL_STA01_STA01_SHZ.toEntityReference())))
                  .setLocation(Location.from(LAT, LON, DEPTH, ELEVATION))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannelGroups(
                      ImmutableSortedSet.of(CHANNEL_GROUP_STA01_TWO.toEntityReference()))
                  .setAllRawChannels(
                      ImmutableSortedSet.of(
                          CHANNEL_STA01_STA01_BHE.toEntityReference(),
                          CHANNEL_STA01_STA01_SHZ.toEntityReference()))
                  .build())
          .build();

  public static final Station TXAR_TEST_STATION =
      Station.builder()
          .setName(TXAR_STA)
          .setEffectiveAt(Instant.now())
          .setData(
              Station.Data.builder()
                  .setType(StationType.HYDROACOUSTIC)
                  .setDescription(STATION_DESCRIPTION)
                  .setRelativePositionChannelPairs(
                      List.of(
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL),
                              CHANNEL_STA01_STA01_BHE.toEntityReference()),
                          RelativePositionChannelPair.create(
                              RelativePosition.from(NORTH, EAST, VERTICAL),
                              CHANNEL_STA01_STA01_SHZ.toEntityReference())))
                  .setLocation(Location.from(LAT, LON, DEPTH, ELEVATION))
                  .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                  .setChannelGroups(
                      ImmutableSortedSet.of(CHANNEL_GROUP_STA01_TWO.toEntityReference()))
                  .setAllRawChannels(
                      ImmutableSortedSet.of(
                          CHANNEL_STA01_STA01_BHE.toEntityReference(),
                          CHANNEL_STA01_STA01_SHZ.toEntityReference()))
                  .build())
          .build();

  public static final FrequencyAmplitudePhase FREQUENCY_AMPLITUDE_PHASE_ENTITY =
      FrequencyAmplitudePhase.createEntityReference(
          UUID.nameUUIDFromBytes("testFrequenceyAmplitudePhase".getBytes()));

  public static final FrequencyAmplitudePhase FREQUENCY_AMPLITUDE_PHASE_FULL =
      FREQUENCY_AMPLITUDE_PHASE_ENTITY.toBuilder()
          .setData(
              FrequencyAmplitudePhase.Data.builder()
                  .setFrequencies(List.of(0.1))
                  .setAmplitudePhaseResponses(
                      List.of(AmplitudePhaseResponse.from(amplitude, phase)))
                  .setNominalSampleRateHz(0.0)
                  .setNominalCalibration(calibration)
                  .build())
          .build();

  public static final Response RESPONSE =
      Response.builder().setData(Optional.empty()).setId(new UUID(4, 1)).build();

  public static final Response RESPONSE_ONE = getResponse(CHANNEL_NAME_ONE);
  public static final Response RESPONSE_ONE_FACET =
      RESPONSE_ONE.toBuilder()
          .setId(RESPONSE_ONE.getId())
          .setEffectiveAt(RESPONSE_ONE.getEffectiveAt())
          .setData(Optional.empty())
          .build();
  public static final Response RESPONSE_FACET =
      Response.builder()
          .setId(new UUID(4, 1))
          .setEffectiveAt(Instant.EPOCH)
          .setData(Optional.empty())
          .build();

  public static final Response RESPONSE_TWO =
      Response.builder().setData(Optional.empty()).setId(new UUID(10, 4)).build();

  public static final Response RESPONSE_FULL =
      Response.builder()
          .setId(new UUID(4, 1))
          .setEffectiveAt(Instant.EPOCH)
          .setData(
              Response.Data.builder()
                  .setCalibration(
                      Calibration.from(
                          1.0,
                          Duration.ofSeconds(1),
                          DoubleValue.from(1.0, Optional.of(0.1), Units.COUNTS_PER_NANOMETER)))
                  .setFapResponse(FREQUENCY_AMPLITUDE_PHASE_ENTITY)
                  .build())
          .build();

  public static final StationGroup STATION_GROUP =
      StationGroup.builder()
          .setName(GROUP_NAME)
          .setEffectiveAt(Instant.now())
          .setData(
              StationGroup.Data.builder()
                  .setDescription("Test Station Group")
                  .setStations(List.of(STATION))
                  .build())
          .build();

  public static final StationGroup STATION_GROUP_FACET =
      StationGroup.builder()
          .setName(GROUP_NAME)
          .setEffectiveAt(Instant.now())
          .setData(
              StationGroup.Data.builder()
                  .setDescription("Test Station Group")
                  .setStations(List.of(STATION_FACET_2))
                  .build())
          .build();

  public static final StationGroup STATION_GROUP1 =
      StationGroup.builder()
          .setName(GROUP_NAME)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestStationGroupDataForCss())
          .build();

  public static final StationGroup STATION_GROUP2 =
      StationGroup.builder()
          .setName(GROUP_NAME)
          .setEffectiveAt(Instant.now())
          .setData(
              StationGroup.Data.builder()
                  .setDescription(GROUP_DESCRIPTION)
                  .setStations(List.of(STATION))
                  .build())
          .build();

  public static final StationGroup STATION_GROUP3 =
      StationGroup.builder()
          .setName(GROUP_NAME)
          .setEffectiveAt(Instant.EPOCH)
          .setData(createTestStationGroupData())
          .build();
  public static final StationChangeTimesRequest STATION_CHANGE_TIMES_REQUEST_200s =
      StationChangeTimesRequest.create(STATION, Instant.EPOCH, Instant.EPOCH.plusSeconds(200));
  public static final StationChangeTimesRequest STATION_CHANGE_TIMES_REQUEST_700s =
      StationChangeTimesRequest.create(STATION, Instant.EPOCH, Instant.EPOCH.plusSeconds(700));

  private UtilsTestFixtures() {
    // Private default constructor to prevent instantiation
  }

  public static Response getResponseEntityReference(String channelName) {
    return Response.createEntityReference(UUID.nameUUIDFromBytes(channelName.getBytes()));
  }

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

  public static Response getResponse(String channelName, FrequencyAmplitudePhase response) {
    return Response.builder()
        .setId(UUID.nameUUIDFromBytes(channelName.getBytes()))
        .setEffectiveAt(Instant.EPOCH)
        .setData(
            Response.Data.builder()
                .setCalibration(calibration)
                .setFapResponse(FrequencyAmplitudePhase.createEntityReference(response.getId()))
                .setEffectiveUntil(END_TIME)
                .build())
        .build();
  }

  public static final Station getTXARStation(
      List<ChannelGroup> channelGroups,
      List<Channel> channels,
      List<RelativePositionChannelPair> channelPairs) {
    return Station.builder()
        .setName(TXAR_STA)
        .setEffectiveAt(Instant.EPOCH)
        .setData(
            Station.Data.builder()
                .setType(StationType.HYDROACOUSTIC)
                .setDescription("This is a test station2")
                .setRelativePositionChannelPairs(channelPairs)
                .setLocation(Location.from(LAT, LON, DEPTH, ELEVATION))
                .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
                .setChannelGroups(channelGroups)
                .setAllRawChannels(channels)
                .build())
        .build();
  }

  public static final List<ChannelGroup> getTXARChannelGroups() {
    List<ChannelGroup> channelGroups = new ArrayList<>();
    for (var i = 1; i < TXAR_COUNT; i++) {
      var cgName = TX_NAME + "0" + i;
      channelGroups.add(createTestChannelGroupVersion(TXAR_STA, cgName));
    }
    channelGroups.add(createTestChannelGroupVersion(TXAR_STA, TX_NAME + "10"));
    return channelGroups;
  }

  public static final List<Channel> getTXARChannels() {
    List<Channel> channels = new ArrayList<>();
    List<String> channelGroupNames =
        getTXARChannelGroups().stream().map(cg -> cg.getName()).toList();
    for (var cgName : channelGroupNames) {
      channels.add(Channel.createVersionReference(cgName + "." + CHANNEL_SHZ, Instant.EPOCH));
    }
    return channels;
  }

  public static final List<RelativePositionChannelPair> getTXARChannelPairs() {
    List<RelativePositionChannelPair> channelPairs = new ArrayList<>();
    for (var chan : getTXARChannels()) {
      channelPairs.add(
          RelativePositionChannelPair.create(RelativePosition.from(NORTH, EAST, VERTICAL), chan));
    }
    return channelPairs;
  }

  public static Channel.Data.Builder createChannelDataBuilder(Channel channel) {
    return channel.getData().orElseThrow().toBuilder();
  }

  public static Channel.Data createTestRawChannelData(String canonicalName, Response response) {
    return createTestChannelData(canonicalName, response).toBuilder()
        .setConfiguredInputs(List.of())
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

  public static Channel.Data createTestChannelData(
      String canonicalName, Response response, String station) {
    return Channel.Data.builder()
        .setCanonicalName(canonicalName)
        .setDescription("Example description")
        .setStation(Station.createEntityReference(station))
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

  public static Channel.Data createTestChannelSegData(
      String canonicalName, Response response, Instant instant) {
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
        .setEffectiveUntil(instant)
        .build();
  }

  public static Channel createTestChannelForFilterConfiguration(
      String station,
      String channelGroup,
      ChannelBandType channelBand,
      ChannelInstrumentType channelInstrument,
      ChannelOrientationType channelOrientation,
      double latitude,
      double longitude) {
    return Channel.builder()
        .setName(STA01_STA01_BHE)
        .setEffectiveAt(Instant.EPOCH)
        .setData(
            createTestChannelDataForFilteringData(
                station,
                channelGroup,
                channelBand,
                channelInstrument,
                channelOrientation,
                latitude,
                longitude))
        .build();
  }

  public static Channel createTestChannelForProcessingMaskConfiguration(
      String station,
      String channelGroup,
      String channelName,
      ChannelBandType channelBand,
      ChannelInstrumentType channelInstrument,
      ChannelOrientationType channelOrientation,
      Location location) {
    return Channel.builder()
        .setName(ChannelNameUtilities.createShortName(station, channelGroup, channelName))
        .setEffectiveAt(Instant.EPOCH)
        .setData(
            createTestChannelDataForFilteringData(
                station,
                channelGroup,
                channelBand,
                channelInstrument,
                channelOrientation,
                location.getLatitudeDegrees(),
                location.getLatitudeDegrees()))
        .build();
  }

  public static Channel.Data createTestChannelDataForFilteringData(
      String station,
      String channelGroup,
      ChannelBandType channelBand,
      ChannelInstrumentType channelInstrument,
      ChannelOrientationType channelOrientation,
      double latitude,
      double longitude) {
    return Channel.Data.builder()
        .setCanonicalName(CANONICAL_NAME_ONE)
        .setDescription("Example description")
        .setStation(Station.createEntityReference(station))
        .setChannelDataType(ChannelDataType.DIAGNOSTIC_SOH)
        .setChannelBandType(channelBand)
        .setChannelInstrumentType(channelInstrument)
        .setChannelOrientationType(channelOrientation)
        .setChannelOrientationCode(channelOrientation.getCode())
        .setUnits(Units.NANOMETERS)
        .setNominalSampleRateHz(65.0)
        .setLocation(Location.from(latitude, longitude, DEPTH2, ELEVATION2))
        .setOrientationAngles(Orientation.from(Optional.of(65.0), Optional.of(135.0)))
        .setConfiguredInputs(List.of(CHANNEL_FACET))
        .setProcessingDefinition(Map.of())
        .setProcessingMetadata(Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, channelGroup))
        .setResponse(getResponse(STA01_STA01_BHE))
        .setEffectiveUntil(Instant.now().plus(30, ChronoUnit.MINUTES))
        .build();
  }

  public static ChannelGroup.Data createTestChannelGroupSingleChannelFacetData() {
    return ChannelGroup.Data.builder()
        .setDescription(CHANNEL_GROUP_DESCRIPTION)
        .setLocation(Location.from(LAT2, LON2, DEPTH2, ELEVATION2))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setChannels(List.of(CHANNEL_TWO_FACET))
        .setType(ChannelGroup.ChannelGroupType.PROCESSING_GROUP)
        .build();
  }

  public static ChannelGroup.Data createTestChannelGroupFacetData() {
    return ChannelGroup.Data.builder()
        .setDescription(CHANNEL_GROUP_DESCRIPTION + "1")
        .setLocation(Location.from(LAT2, LON2, DEPTH2, ELEVATION2))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setChannels(List.of(CHANNEL_FACET, CHANNEL_TWO_FACET))
        .setType(ChannelGroup.ChannelGroupType.PROCESSING_GROUP)
        .build();
  }

  public static ChannelGroup.Data createTestChannelGroupData() {
    return ChannelGroup.Data.builder()
        .setDescription(CHANNEL_GROUP_DESCRIPTION + "2")
        .setLocation(Location.from(LAT2, LON2, DEPTH2, ELEVATION2))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setChannels(List.of(CHANNEL, CHANNEL_TWO))
        .setType(ChannelGroup.ChannelGroupType.PROCESSING_GROUP)
        .build();
  }

  public static ChannelGroup.Data createTestChannelGroupStaData() {
    return ChannelGroup.Data.builder()
        .setDescription(CHANNEL_GROUP_DESCRIPTION + "2")
        .setLocation(Location.from(LAT2, LON2, DEPTH2, ELEVATION2))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setChannels(List.of(CHANNEL_STA01_STA01_BHE))
        .setType(ChannelGroup.ChannelGroupType.PROCESSING_GROUP)
        .setStation(Station.createVersionReference(STA, ONDATE))
        .build();
  }

  public static ChannelGroup.Data createTestChannelGroupStaDataTwo() {
    return ChannelGroup.Data.builder()
        .setDescription(CHANNEL_GROUP_DESCRIPTION + "2")
        .setLocation(Location.from(LAT2, LON2, DEPTH2, ELEVATION2))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setChannels(List.of(CHANNEL_STA01_STA01_BHE, CHANNEL_STA01_STA01_SHZ))
        .setType(ChannelGroup.ChannelGroupType.PROCESSING_GROUP)
        .setStation(Station.createVersionReference(STA, ONDATE))
        .build();
  }

  public static ChannelGroup.Data createTestChannelGroupDataTwo() {
    return ChannelGroup.Data.builder()
        .setDescription(CHANNEL_GROUP_DESCRIPTION + "3")
        .setLocation(Location.from(LAT2, LON2, DEPTH2, ELEVATION2))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setChannels(List.of(CHANNEL_TWO))
        .setType(ChannelGroup.ChannelGroupType.PROCESSING_GROUP)
        .build();
  }

  public static List<Channel> getListOfChannelsForDaos() {

    return List.of(
        createTestChannelForDao(
            CssDaoAndCoiParameters.REFERENCE_STATION,
            STA1,
            CHAN1,
            SITE_DAO_1,
            CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            CssDaoAndCoiParameters.CHAN_PARAM_MAP),
        createTestChannelForDao(
            CssDaoAndCoiParameters.REFERENCE_STATION,
            STA1,
            CHAN2,
            SITE_DAO_2,
            CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            CssDaoAndCoiParameters.CHAN_PARAM_MAP),
        createTestChannelForDao(
            CssDaoAndCoiParameters.REFERENCE_STATION,
            STA2,
            CHAN3,
            SITE_DAO_3,
            CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP,
            STA2_PARAM_MAP,
            CssDaoAndCoiParameters.CHAN_PARAM_MAP));
  }

  public static List<Channel> getListOfChannelsForDaosTwo() {

    return List.of(
        createTestChannelForDao(
            CssDaoAndCoiParameters.REFERENCE_STATION,
            STA1,
            CHAN1,
            SITE_DAO_1,
            CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            CssDaoAndCoiParameters.CHAN_PARAM_MAP),
        createTestChannelForDao(
            CssDaoAndCoiParameters.REFERENCE_STATION,
            STA2,
            CHAN2,
            SITE_DAO_2,
            CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            CssDaoAndCoiParameters.CHAN_PARAM_MAP));
  }

  public static List<Channel> getListOfChannelReferencesForDaos() {
    var chan1 =
        createTestChannelForDao(
            CssDaoAndCoiParameters.REFERENCE_STATION,
            STA1,
            CHAN1,
            SITE_DAO_1,
            CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            CssDaoAndCoiParameters.CHAN_PARAM_MAP);
    var chan2 =
        createTestChannelForDao(
            CssDaoAndCoiParameters.REFERENCE_STATION,
            STA1,
            CHAN2,
            SITE_DAO_2,
            CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            CssDaoAndCoiParameters.CHAN_PARAM_MAP);
    var chan3 =
        createTestChannelForDao(
            CssDaoAndCoiParameters.REFERENCE_STATION,
            STA2,
            CHAN3,
            SITE_DAO_3,
            CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP,
            STA2_PARAM_MAP,
            CssDaoAndCoiParameters.CHAN_PARAM_MAP);

    return List.of(
        Channel.createVersionReference(chan1.getName(), chan1.getEffectiveAt().orElseThrow()),
        Channel.createVersionReference(chan2.getName(), chan2.getEffectiveAt().orElseThrow()),
        Channel.createVersionReference(chan3.getName(), chan3.getEffectiveAt().orElseThrow()));
  }

  public static ChannelParameterFixtures getChannelParameterFixtures() {

    ChannelParameterFixtures fixtures = new ChannelParameterFixtures();
    var station1Channels =
        List.of(
            createTestChannelForDao(
                REFERENCE_STATION,
                STA1,
                CHAN1,
                SITE_DAO_1,
                INSTRUMENT_PARAM_MAP,
                STA1_PARAM_MAP,
                CHAN_PARAM_MAP),
            createTestChannelForDao(
                REFERENCE_STATION,
                STA2,
                CHAN2,
                SITE_DAO_2,
                INSTRUMENT_PARAM_MAP,
                STA2_PARAM_MAP,
                CHAN_PARAM_MAP),
            createTestChannelForDao(
                REFERENCE_STATION,
                STA3,
                CHAN3,
                SITE_DAO_3,
                INSTRUMENT_PARAM_MAP,
                STA3_PARAM_MAP,
                CHAN_PARAM_MAP),
            createTestChannelForDao(
                REFERENCE_STATION,
                STA4,
                CHAN4,
                SITE_DAO_4,
                INSTRUMENT_PARAM_MAP,
                STA1_PARAM_MAP,
                CHAN_PARAM_MAP));
    fixtures.addParamMap(station1Channels.get(0).getName(), STA1_PARAM_MAP);
    fixtures.addParamMap(station1Channels.get(1).getName(), STA2_PARAM_MAP);
    fixtures.addParamMap(station1Channels.get(2).getName(), STA3_PARAM_MAP);
    fixtures.addParamMap(station1Channels.get(3).getName(), STA1_PARAM_MAP);

    var station2Channels =
        List.of(
            createTestChannelForDao(
                REFERENCE_STATION_2,
                STAXX1,
                CHAN1,
                SITE_DAO_REF_21,
                INSTRUMENT_PARAM_MAP,
                STA1_PARAM_MAP,
                CHAN_PARAM_MAP),
            createTestChannelForDao(
                REFERENCE_STATION_2,
                STAXX2,
                CHAN2,
                SITE_DAO_REF_22,
                INSTRUMENT_PARAM_MAP,
                STA2_PARAM_MAP,
                CHAN_PARAM_MAP));
    fixtures.addParamMap(station2Channels.get(0).getName(), STA1_PARAM_MAP);
    fixtures.addParamMap(station2Channels.get(1).getName(), STA2_PARAM_MAP);

    var station3Channels =
        List.of(
            createTestChannelForDao(
                REFERENCE_STATION_3,
                STAYY1,
                CHAN2,
                SITE_DAO_REF_31,
                INSTRUMENT_PARAM_MAP,
                STA2_PARAM_MAP,
                CHAN_PARAM_MAP),
            createTestChannelForDao(
                REFERENCE_STATION_3,
                STAYY2,
                CHAN3,
                SITE_DAO_REF_32,
                INSTRUMENT_PARAM_MAP,
                STA3_PARAM_MAP,
                CHAN_PARAM_MAP),
            createTestChannelForDao(
                REFERENCE_STATION_3,
                STAYY3,
                CHAN4,
                SITE_DAO_REF_33,
                INSTRUMENT_PARAM_MAP,
                STA1_PARAM_MAP,
                CHAN_PARAM_MAP));
    fixtures.addParamMap(station3Channels.get(0).getName(), STA2_PARAM_MAP);
    fixtures.addParamMap(station3Channels.get(1).getName(), STA3_PARAM_MAP);
    fixtures.addParamMap(station3Channels.get(2).getName(), STA1_PARAM_MAP);

    var station4Channels =
        List.of(
            createTestChannelForDao(
                REFERENCE_STATION_4,
                STAWW1,
                CHAN3,
                SITE_DAO_REF_41,
                INSTRUMENT_PARAM_MAP,
                STA1_PARAM_MAP,
                CHAN_PARAM_MAP),
            createTestChannelForDao(
                REFERENCE_STATION_4,
                STAWW2,
                CHAN4,
                SITE_DAO_REF_42,
                INSTRUMENT_PARAM_MAP,
                STA2_PARAM_MAP,
                CHAN_PARAM_MAP));
    fixtures.addParamMap(station4Channels.get(0).getName(), STA1_PARAM_MAP);
    fixtures.addParamMap(station4Channels.get(1).getName(), STA2_PARAM_MAP);

    fixtures.addChannels(
        Stream.of(station1Channels, station2Channels, station3Channels, station4Channels)
            .flatMap(Collection::stream)
            .collect(Collectors.toList()));

    return fixtures;
  }

  public static List<SensorDao> getIncompleteSensorDaoList() {
    return List.of(SENSOR_DAO_1, SENSOR_DAO_2);
  }

  public static List<InstrumentDao> getIncompleteInstrumentDaoList() {
    return List.of(INSTRUMENT_DAO_1, INSTRUMENT_DAO_2);
  }

  public static List<SiteChanDao> getIncompleteSiteChanDaoList() {
    return List.of(SITE_CHAN_DAO_1, SITE_CHAN_DAO_2);
  }

  public static List<SiteDao> getIncompleteSiteDao() {
    return List.of(SITE_DAO_1);
  }

  public static List<SiteDao> getIncompleteSiteDaoWithMain() {
    return List.of(SITE_DAO_1, SITE_DAO_3);
  }

  public static List<Channel> getListOfChannelsForIncompleteDaos() {
    return List.of(
        (Channel)
            createTestChannelForDao(
                    CssDaoAndCoiParameters.REFERENCE_STATION,
                    STA1,
                    CHAN1,
                    SITE_DAO_1,
                    CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP,
                    CssDaoAndCoiParameters.STA1_PARAM_MAP,
                    CssDaoAndCoiParameters.CHAN_PARAM_MAP)
                .setEffectiveUntil(CssDaoAndCoiParameters.OFFDATE_EOD),
        (Channel)
            createTestChannelForDao(
                    CssDaoAndCoiParameters.REFERENCE_STATION,
                    STA1,
                    CHAN2,
                    SITE_DAO_2,
                    CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP_2,
                    CssDaoAndCoiParameters.STA1_PARAM_MAP,
                    CssDaoAndCoiParameters.CHAN_PARAM_MAP)
                .setEffectiveUntil(CssDaoAndCoiParameters.OFFDATE_EOD));
  }

  public static List<Channel> getListOfChannelsWithResponse() {
    return List.of(
        createTestChannelForDao(
            SITE_CHAN_DAO_1, INSTRUMENT_DAO_1, SITE_DAO_1, SENSOR_DAO_1, WFDISC_TEST_DAO_1),
        createTestChannelForDao(
            SITE_CHAN_DAO_2, INSTRUMENT_DAO_2, SITE_DAO_1, SENSOR_DAO_2, WFDISC_TEST_DAO_2),
        createTestChannelForDao(
            SITE_CHAN_DAO_3, INSTRUMENT_DAO_3, SITE_DAO_2, SENSOR_DAO_3, WFDISC_TEST_DAO_3));
  }

  public static List<Channel> getListOfTestChannels() {
    return List.of(
        (Channel)
            createTestChannelForDao(
                    SITE_CHAN_DAO_1, INSTRUMENT_DAO_1, SITE_DAO_1, SENSOR_DAO_1, WFDISC_TEST_DAO_1)
                .setEffectiveUntil(CssDaoAndCoiParameters.OFFDATE_EOD),
        (Channel)
            createTestChannelForDao(
                    SITE_CHAN_DAO_2, INSTRUMENT_DAO_2, SITE_DAO_1, SENSOR_DAO_2, WFDISC_TEST_DAO_2)
                .setEffectiveUntil(CssDaoAndCoiParameters.OFFDATE_EOD),
        (Channel)
            createTestChannelForDao(
                    SITE_CHAN_DAO_3, INSTRUMENT_DAO_3, SITE_DAO_2, SENSOR_DAO_3, WFDISC_TEST_DAO_3)
                .setEffectiveUntil(CssDaoAndCoiParameters.OFFDATE_EOD));
  }

  public static Channel getSingleStationChannel() {

    return createTestChannelForDao(
        SINGLE_SITE_CHAN, INSTRUMENT_DAO_3, SINGLE_SITE, SENSOR_DAO_3, WFDISC_DAO_3);
  }

  public static List<Channel> getSingleChannelWithResponse(Response response) {
    return List.of(
        createTestChannelForDaoWithDates(
            SITE_CHAN_DAO_1, INSTRUMENT_DAO_1, SITE_DAO_1, response, ONDATE2, OFFDATE));
  }

  public static List<Channel> getSingleChannelFromWfDisc() {
    return List.of(
        createTestChannelForDaoWithDates(
            SITE_CHAN_DAO_1, INSTRUMENT_DAO_1, SITE_DAO_1, null, ONDATE2, ONDATE3));
  }

  public static List<Channel> getSingleChannelFromSensor() {
    return List.of(
        createTestChannelForDaoWithDates(
            SITE_CHAN_DAO_1, INSTRUMENT_DAO_1, SITE_DAO_1, null, ONDATE2, ONDATE4));
  }

  public static List<Channel> getListOfChannelsWithReferenceResponse() {
    return List.of(
        createTestChannelForDaoWithReferenceReponse(
            SITE_CHAN_DAO_1, INSTRUMENT_DAO_1, SITE_DAO_1, WFDISC_TEST_DAO_1),
        createTestChannelForDaoWithReferenceReponse(
            SITE_CHAN_DAO_2, INSTRUMENT_DAO_2, SITE_DAO_1, WFDISC_TEST_DAO_2),
        createTestChannelForDaoWithReferenceReponse(
            SITE_CHAN_DAO_3, INSTRUMENT_DAO_3, SITE_DAO_2, WFDISC_TEST_DAO_3));
  }

  public static Channel createTestChannelForDao(
      String stationName,
      String groupName,
      String chanName,
      SiteDao stationInfo,
      Map<CssDaoAndCoiParameters.INSTRUMENT_ARGS, Double> instArgsMap,
      Map<CssDaoAndCoiParameters.SITE_ARGS, Double> siteArgsMap,
      Map<CssDaoAndCoiParameters.SITE_CHAN_ARGS, Double> siteChanArgsMap) {

    var channelName =
        stationName + Channel.NAME_SEPARATOR + groupName + Channel.NAME_SEPARATOR + chanName;

    Optional<ChannelTypes> channelTypesOptional = ChannelTypesParser.parseChannelTypes(chanName);

    if (channelTypesOptional.isEmpty()) {
      throw new IllegalStateException(
          "Could create test channel for Dao, chanName provided can't be parsed");
    }

    var channelTypes = channelTypesOptional.orElse(null);

    var channelData =
        Channel.Data.builder()
            .setCanonicalName(channelName)
            .setEffectiveUntil(OFFDATE)
            .setDescription(CssDaoAndCoiParameters.CHAN_DESC)
            .setStation(
                Station.createVersionReference(
                    stationInfo.getReferenceStation(), stationInfo.getId().getOnDate()))
            .setChannelDataType(channelTypes.getDataType())
            .setChannelBandType(channelTypes.getBandType())
            .setChannelInstrumentType(channelTypes.getInstrumentType())
            .setChannelOrientationType(channelTypes.getOrientationType())
            .setChannelOrientationCode(channelTypes.getOrientationCode())
            .setUnits(Units.determineUnits(channelTypes.getDataType()))
            .setNominalSampleRateHz(
                instArgsMap.get(CssDaoAndCoiParameters.INSTRUMENT_ARGS.SAMPLERATE))
            .setLocation(
                Location.from(
                    siteArgsMap.get(CssDaoAndCoiParameters.SITE_ARGS.LATITUDE),
                    siteArgsMap.get(CssDaoAndCoiParameters.SITE_ARGS.LONGITUDE),
                    siteChanArgsMap.get(CssDaoAndCoiParameters.SITE_CHAN_ARGS.EMPLACEMENT),
                    siteArgsMap.get(CssDaoAndCoiParameters.SITE_ARGS.ELEVATION)))
            .setOrientationAngles(
                Orientation.from(
                    Optional.of(
                        siteChanArgsMap.get(CssDaoAndCoiParameters.SITE_CHAN_ARGS.HORIZONTAL)),
                    Optional.of(
                        siteChanArgsMap.get(CssDaoAndCoiParameters.SITE_CHAN_ARGS.VERTICAL))))
            .setConfiguredInputs(List.of())
            .setProcessingDefinition(Map.of())
            .setProcessingMetadata(Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, groupName))
            .setResponse(Optional.empty())
            .build();

    return Channel.builder()
        .setName(channelName)
        .setEffectiveAt(CssDaoAndCoiParameters.ONDATE)
        .setData(channelData)
        .build();
  }

  private static Response getResponseWithEntityReferenceFrequencyAmplitudePhase(
      SensorDao sensorDao, WfdiscDao wfdiscDao, String fileLocation) {

    var frequencyAmplitudePhase =
        FrequencyAmplitudePhase.builder()
            .setData(Optional.empty())
            .setId(UUID.nameUUIDFromBytes(fileLocation.getBytes()))
            .build();

    var calibration = getCalibration(wfdiscDao, sensorDao);
    return getResponse(wfdiscDao, calibration, frequencyAmplitudePhase);
  }

  private static Calibration getCalibration(WfdiscDao wfdiscDao, SensorDao sensorDao) {

    return Calibration.from(
        wfdiscDao.getCalper(),
        Duration.ofSeconds((long) sensorDao.gettShift()),
        DoubleValue.from(wfdiscDao.getCalib(), Optional.of(0.0), Units.NANOMETERS_PER_COUNT));
  }

  private static Response getResponse(
      WfdiscDao wfdiscDao,
      Calibration calibration,
      FrequencyAmplitudePhase frequencyAmplitudePhase) {

    var id = wfdiscDao.getStationCode() + wfdiscDao.getChannelCode();
    var newEndDate = wfdiscDao.getEndTime();
    if (newEndDate.equals(PositiveNaInstantToDoubleConverter.NA_TIME)) {
      newEndDate = null;
    }

    return Response.builder()
        .setData(
            Data.builder()
                .setFapResponse(frequencyAmplitudePhase)
                .setCalibration(calibration)
                .setEffectiveUntil(Optional.ofNullable(newEndDate))
                .build())
        .setId(UUID.nameUUIDFromBytes(id.getBytes()))
        .setEffectiveAt(wfdiscDao.getjDate())
        .build();
  }

  private static Channel createTestChannelForDaoWithReferenceReponse(
      SiteChanDao siteChanDao, InstrumentDao instrumentDao, SiteDao siteDao, WfdiscDao wfdiscDao) {
    String chanName = siteChanDao.getId().getChannelCode();
    String groupName = siteChanDao.getId().getStationCode();

    var channelName =
        siteDao.getReferenceStation()
            + Channel.NAME_SEPARATOR
            + groupName
            + Channel.NAME_SEPARATOR
            + chanName;

    var channelTypesOptional = ChannelTypesParser.parseChannelTypes(chanName);

    if (channelTypesOptional.isEmpty()) {
      throw new IllegalStateException(
          "Could create test channel for Dao, chanName provided can not be parsed");
    }

    var channelTypes = channelTypesOptional.orElse(null);

    var location =
        Location.from(
            siteDao.getLatitude(),
            siteDao.getLongitude(),
            siteChanDao.getEmplacementDepth(),
            siteDao.getElevation());

    var orientation =
        Orientation.from(
            Optional.of(siteChanDao.getHorizontalAngle()),
            Optional.of(siteChanDao.getVerticalAngle()));
    var id = wfdiscDao.getStationCode() + wfdiscDao.getChannelCode();
    var response = Response.createEntityReference(UUID.nameUUIDFromBytes(id.getBytes()));

    var channelData =
        Channel.Data.builder()
            .setCanonicalName(channelName)
            .setEffectiveUntil(OFFDATE)
            .setDescription(CssDaoAndCoiParameters.CHAN_DESC)
            .setStation(
                Station.createVersionReference(REFERENCE_STATION, siteDao.getId().getOnDate()))
            .setChannelDataType(channelTypes.getDataType())
            .setChannelBandType(channelTypes.getBandType())
            .setChannelInstrumentType(channelTypes.getInstrumentType())
            .setChannelOrientationType(channelTypes.getOrientationType())
            .setChannelOrientationCode(channelTypes.getOrientationCode())
            .setUnits(Units.determineUnits(channelTypes.getDataType()))
            .setNominalSampleRateHz(instrumentDao.getSampleRate())
            .setLocation(location)
            .setOrientationAngles(orientation)
            .setConfiguredInputs(List.of())
            .setProcessingDefinition(Map.of())
            .setProcessingMetadata(Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, groupName))
            .setResponse(response)
            .build();

    return Channel.builder()
        .setName(channelName)
        .setEffectiveAt(CssDaoAndCoiParameters.ONDATE)
        .setData(channelData)
        .build();
  }

  private static Channel createTestChannelForDao(
      SiteChanDao siteChanDao,
      InstrumentDao instrumentDao,
      SiteDao siteDao,
      SensorDao sensorDao,
      WfdiscDao wfdiscDao) {
    var response =
        getResponseWithEntityReferenceFrequencyAmplitudePhase(
            sensorDao, wfdiscDao, instrumentDao.getDirectory() + instrumentDao.getDataFile());
    return createTestChannelForDaoWithDates(
        siteChanDao, instrumentDao, siteDao, response, CssDaoAndCoiParameters.ONDATE, OFFDATE);
  }

  private static Channel createTestChannelForDaoWithDates(
      SiteChanDao siteChanDao,
      InstrumentDao instrumentDao,
      SiteDao siteDao,
      Response response,
      Instant effectiveAt,
      Instant effectiveUntil) {

    var chanName = siteChanDao.getId().getChannelCode();
    var groupName = siteChanDao.getId().getStationCode();

    var channelName =
        siteDao.getReferenceStation()
            + Channel.NAME_SEPARATOR
            + groupName
            + Channel.NAME_SEPARATOR
            + chanName;

    var channelTypesOptional = ChannelTypesParser.parseChannelTypes(chanName);

    if (channelTypesOptional.isEmpty()) {
      throw new IllegalStateException(
          "Could create test channel for Dao, chanName provided can't be parsed");
    }

    var channelTypes = channelTypesOptional.orElse(null);

    var location =
        Location.from(
            siteDao.getLatitude(),
            siteDao.getLongitude(),
            siteChanDao.getEmplacementDepth(),
            siteDao.getElevation());

    var orientation =
        Orientation.from(
            Optional.of(siteChanDao.getHorizontalAngle()),
            Optional.of(siteChanDao.getVerticalAngle()));

    var channelData =
        Channel.Data.builder()
            .setCanonicalName(channelName)
            .setEffectiveUntil(effectiveUntil)
            .setDescription(CssDaoAndCoiParameters.CHAN_DESC)
            .setStation(
                Station.createVersionReference(
                    CssDaoAndCoiParameters.REFERENCE_STATION, siteDao.getId().getOnDate()))
            .setChannelDataType(channelTypes.getDataType())
            .setChannelBandType(channelTypes.getBandType())
            .setChannelInstrumentType(channelTypes.getInstrumentType())
            .setChannelOrientationType(channelTypes.getOrientationType())
            .setChannelOrientationCode(channelTypes.getOrientationCode())
            .setUnits(Units.determineUnits(channelTypes.getDataType()))
            .setNominalSampleRateHz(instrumentDao.getSampleRate())
            .setLocation(location)
            .setOrientationAngles(orientation)
            .setConfiguredInputs(List.of())
            .setProcessingDefinition(Map.of())
            .setProcessingMetadata(Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, groupName))
            .setResponse(response)
            .build();

    return Channel.builder()
        .setName(channelName)
        .setEffectiveAt(effectiveAt)
        .setData(channelData)
        .build();
  }

  private static ChannelGroup createTestChannelGroupVersion(String station, String channelGroup) {
    return ChannelGroup.builder()
        .setName(station + "." + channelGroup)
        .setEffectiveAt(Instant.EPOCH)
        .build();
  }

  private static ChannelGroup.Data createTestChannelGroupDataForCss() {
    return ChannelGroup.Data.builder()
        .setDescription(CssDaoAndCoiParameters.STATION_NAME)
        .setLocation(
            Location.from(
                CssDaoAndCoiParameters.STA1_PARAM_MAP.get(
                    CssDaoAndCoiParameters.SITE_ARGS.LATITUDE),
                CssDaoAndCoiParameters.STA1_PARAM_MAP.get(
                    CssDaoAndCoiParameters.SITE_ARGS.LONGITUDE),
                0,
                CssDaoAndCoiParameters.STA1_PARAM_MAP.get(
                    CssDaoAndCoiParameters.SITE_ARGS.ELEVATION)))
        .setChannels(List.of(CHANNEL))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setType(ChannelGroup.ChannelGroupType.PHYSICAL_SITE)
        .setStation(
            Station.createVersionReference(
                SITE_DAO_1.getReferenceStation(), SITE_DAO_1.getId().getOnDate()))
        .build();
  }

  private static ChannelGroup createTestChannelGroupForDao(
      String description,
      String channelGroupName,
      Map<CssDaoAndCoiParameters.SITE_ARGS, Double> siteArgsMap,
      NavigableSet<Channel> channels,
      Instant onDate) {

    var channelGroupData =
        ChannelGroup.Data.builder()
            .setDescription(description)
            .setLocation(
                Location.from(
                    siteArgsMap.get(CssDaoAndCoiParameters.SITE_ARGS.LATITUDE),
                    siteArgsMap.get(CssDaoAndCoiParameters.SITE_ARGS.LONGITUDE),
                    0,
                    siteArgsMap.get(CssDaoAndCoiParameters.SITE_ARGS.ELEVATION)))
            .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
            .setType(ChannelGroup.ChannelGroupType.PHYSICAL_SITE)
            .setChannels(channels)
            .build();

    return ChannelGroup.builder()
        .setName(channelGroupName)
        .setEffectiveAt(onDate)
        .setData(channelGroupData)
        .build();
  }

  public static List<ChannelGroup> getListOfChannelGroupsForDaos() {
    List<Channel> channels = getListOfChannelsForDaos();

    NavigableSet<Channel> channels1 =
        channels.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA1))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels2 =
        channels.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA2))
            .collect(Collectors.toCollection(TreeSet::new));

    return List.of(
        createTestChannelGroupForDao(
            CssDaoAndCoiParameters.STATION_NAME,
            STA1,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            channels1,
            ONDATE),
        createTestChannelGroupForDao(
            CssDaoAndCoiParameters.STATION_NAME, STA2, STA2_PARAM_MAP, channels2, ONDATE));
  }

  public static List<ChannelGroup> getListOfChannelGroupsForDaosTwo() {
    List<Channel> channels = getListOfChannelsForDaosTwo();

    NavigableSet<Channel> channels1 =
        channels.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA1))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels2 =
        channels.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA2))
            .collect(Collectors.toCollection(TreeSet::new));

    return List.of(
        createTestChannelGroupForDao(
            CssDaoAndCoiParameters.STATION_NAME,
            STA1,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            channels1,
            ONDATE),
        createTestChannelGroupForDao(
            CssDaoAndCoiParameters.STATION_NAME, STA2, STA2_PARAM_MAP, channels2, ONDATE));
  }

  public static List<ChannelGroup> getListOfChannelGroupReferencesForDaos() {
    var channels = getListOfChannelsForDaos();

    NavigableSet<Channel> channels1 =
        channels.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA1))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels2 =
        channels.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA2))
            .collect(Collectors.toCollection(TreeSet::new));

    NavigableSet<Channel> channelRefs1 =
        channels1.stream()
            .map(
                chan ->
                    Channel.createVersionReference(
                        chan.getName(), chan.getEffectiveAt().orElseThrow()))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channelRefs2 =
        channels2.stream()
            .map(
                chan ->
                    Channel.createVersionReference(
                        chan.getName(), chan.getEffectiveAt().orElseThrow()))
            .collect(Collectors.toCollection(TreeSet::new));

    return List.of(
        createTestChannelGroupForDao(
            CssDaoAndCoiParameters.STATION_NAME,
            STA1,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            channelRefs1,
            ONDATE),
        createTestChannelGroupForDao(
            CssDaoAndCoiParameters.STATION_NAME, STA2, STA2_PARAM_MAP, channelRefs2, ONDATE));
  }

  public static List<ChannelGroup> getListOfChannelGroupsForDaosWithResponses() {
    var channels = getListOfChannelsWithResponse();

    NavigableSet<Channel> channels1 =
        channels.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA1))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels2 =
        channels.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA2))
            .collect(Collectors.toCollection(TreeSet::new));

    return List.of(
        createTestChannelGroupForDao(
            CssDaoAndCoiParameters.STATION_NAME,
            STA1,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            channels1,
            ONDATE),
        createTestChannelGroupForDao(
            CssDaoAndCoiParameters.STATION_NAME, STA2, STA2_PARAM_MAP, channels2, ONDATE));
  }

  public static ChannelGroup getSingleStationChannelGroup() {

    NavigableSet<Channel> singleChans = new TreeSet<>();
    singleChans.add(getSingleStationChannel());

    return createTestChannelGroupForDao(
        STATION_NAME, REFERENCE_STATION, STA1_PARAM_MAP, singleChans, ONDATE);
  }

  public static List<ChannelGroup> getListOfChannelGroupsForIncompleteDaos() {
    var channels = getListOfChannelsForDaos();

    NavigableSet<Channel> channels1 =
        channels.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA1))
            .collect(Collectors.toCollection(TreeSet::new));

    return List.of(
        createTestChannelGroupForDao(
            CssDaoAndCoiParameters.STATION_NAME,
            STA1,
            CssDaoAndCoiParameters.STA1_PARAM_MAP,
            channels1,
            ONDATE));
  }

  public static List<ChannelGroup> getListOfChannelGroupsForStations(List<Channel> channelList) {

    // Filter channels based on the channel group names
    // Station Group 1
    NavigableSet<Channel> channels11 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA1))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels12 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA2))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels13 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA3))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels14 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STA4))
            .collect(Collectors.toCollection(TreeSet::new));

    // Station Group 2
    NavigableSet<Channel> channels21 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STAXX1))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels22 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STAXX2))
            .collect(Collectors.toCollection(TreeSet::new));

    // Station Group 3
    NavigableSet<Channel> channels31 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STAYY1))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels32 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STAYY2))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels33 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STAYY3))
            .collect(Collectors.toCollection(TreeSet::new));

    // Station Group 4
    NavigableSet<Channel> channels41 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STAWW1))
            .collect(Collectors.toCollection(TreeSet::new));
    NavigableSet<Channel> channels42 =
        channelList.stream()
            .filter(
                channel ->
                    channel
                        .getProcessingMetadata()
                        .get(ChannelProcessingMetadataType.CHANNEL_GROUP)
                        .equals(STAWW2))
            .collect(Collectors.toCollection(TreeSet::new));

    var stat1ChanGroup =
        List.of(
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STA1, STA1_PARAM_MAP, channels11, ONDATE),
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STA2, STA2_PARAM_MAP, channels12, ONDATE),
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STA3, STA3_PARAM_MAP, channels13, ONDATE),
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STA4, STA1_PARAM_MAP, channels14, ONDATE));
    var stat2ChanGroup =
        List.of(
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STAXX1, STA1_PARAM_MAP, channels21, ONDATE2),
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STAXX2, STA2_PARAM_MAP, channels22, ONDATE2));
    var stat3ChanGroup =
        List.of(
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STAYY1, STA2_PARAM_MAP, channels31, ONDATE2),
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STAYY2, STA3_PARAM_MAP, channels32, ONDATE2),
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STAYY3, STA1_PARAM_MAP, channels33, ONDATE2));
    var stat4ChanGroup =
        List.of(
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STAWW1, STA1_PARAM_MAP, channels41, ONDATE3),
            createTestChannelGroupForDao(
                CssDaoAndCoiParameters.STATION_NAME, STAWW2, STA2_PARAM_MAP, channels42, ONDATE3));

    return Stream.of(stat1ChanGroup, stat2ChanGroup, stat3ChanGroup, stat4ChanGroup)
        .flatMap(Collection::stream)
        .collect(Collectors.toList());
  }

  public static Station getStationVersion() {
    return Station.builder()
        .setName(CssDaoAndCoiParameters.REFERENCE_STATION)
        .setEffectiveAt(CssDaoAndCoiParameters.ONDATE)
        .build();
  }

  public static Station getStationForIncompleteDaos() {
    return Station.builder()
        .setName(CssDaoAndCoiParameters.REFERENCE_STATION)
        .setEffectiveAt(CssDaoAndCoiParameters.ONDATE)
        .setData(createTestStationDataForIncomplete())
        .build();
  }

  public static Station.Data createTestStationDataForIncomplete() {
    var channels = getListOfChannelsForIncompleteDaos();
    var channelGroups = getListOfChannelGroupsForIncompleteDaos();

    Map<String, Map<CssDaoAndCoiParameters.SITE_ARGS, Double>> channelNametoParametersMap =
        new HashMap<>();
    channelNametoParametersMap.put(
        channels.get(0).getName(), CssDaoAndCoiParameters.STA1_PARAM_MAP);
    channelNametoParametersMap.put(
        channels.get(1).getName(), CssDaoAndCoiParameters.STA1_PARAM_MAP);

    Map<Channel, RelativePosition> relativePositionMap =
        channels.stream()
            .collect(
                Collectors.toMap(
                    Function.identity(),
                    channel -> {
                      Map<CssDaoAndCoiParameters.SITE_ARGS, Double> siteArgsDoubleMap =
                          channelNametoParametersMap.get(channel.getName());
                      return RelativePosition.from(
                          siteArgsDoubleMap.get(CssDaoAndCoiParameters.SITE_ARGS.DNORTH),
                          siteArgsDoubleMap.get(CssDaoAndCoiParameters.SITE_ARGS.DEAST),
                          0);
                    }));

    return Station.Data.builder()
        .setType(StationType.SEISMIC_ARRAY)
        .setDescription(CssDaoAndCoiParameters.STATION_NAME)
        .setLocation(
            Location.from(
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.LATITUDE),
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.LONGITUDE),
                0,
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.ELEVATION)))
        .setAllRawChannels(channels)
        .setChannelGroups(channelGroups)
        .setRelativePositionChannelPairs(
            relativePositionMap.entrySet().stream()
                .map(entry -> RelativePositionChannelPair.create(entry.getValue(), entry.getKey()))
                .collect(Collectors.toList()))
        .build();
  }

  public static Station getStationForDaos() {
    return Station.builder()
        .setName(CssDaoAndCoiParameters.REFERENCE_STATION)
        .setEffectiveAt(CssDaoAndCoiParameters.ONDATE)
        .setData(createTestStationData())
        .build();
  }

  public static Station getStationForDaosTwo() {
    return Station.builder()
        .setName(CssDaoAndCoiParameters.REFERENCE_STATION)
        .setEffectiveAt(CssDaoAndCoiParameters.ONDATE)
        .setData(createTestStationDataTwo())
        .build();
  }

  public static Station getStationReferencesForDaos() {
    return Station.builder()
        .setName(CssDaoAndCoiParameters.REFERENCE_STATION)
        .setEffectiveAt(CssDaoAndCoiParameters.ONDATE)
        .setData(createTestStationReferenceData())
        .build();
  }

  public static Station.Data createTestStationData() {
    var channels = getListOfChannelsForDaos();
    var channelGroups = getListOfChannelGroupsForDaos();

    Map<String, Map<CssDaoAndCoiParameters.SITE_ARGS, Double>> channelNametoParametersMap =
        new HashMap<>();
    channelNametoParametersMap.put(
        channels.get(0).getName(), CssDaoAndCoiParameters.STA1_PARAM_MAP);
    channelNametoParametersMap.put(
        channels.get(1).getName(), CssDaoAndCoiParameters.STA1_PARAM_MAP);
    channelNametoParametersMap.put(channels.get(2).getName(), STA2_PARAM_MAP);

    Map<Channel, RelativePosition> relativePositionMap =
        channels.stream()
            .collect(
                Collectors.toMap(
                    Function.identity(),
                    channel -> {
                      Map<CssDaoAndCoiParameters.SITE_ARGS, Double> siteArgsDoubleMap =
                          channelNametoParametersMap.get(channel.getName());
                      return RelativePosition.from(
                          siteArgsDoubleMap.get(CssDaoAndCoiParameters.SITE_ARGS.DNORTH),
                          siteArgsDoubleMap.get(CssDaoAndCoiParameters.SITE_ARGS.DEAST),
                          0);
                    }));

    return Station.Data.builder()
        .setType(StationType.SEISMIC_ARRAY)
        .setDescription(CssDaoAndCoiParameters.STATION_NAME)
        .setLocation(
            Location.from(
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.LATITUDE),
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.LONGITUDE),
                0,
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.ELEVATION)))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setAllRawChannels(channels)
        .setChannelGroups(channelGroups)
        .setRelativePositionChannelPairs(
            relativePositionMap.entrySet().stream()
                .map(entry -> RelativePositionChannelPair.create(entry.getValue(), entry.getKey()))
                .collect(Collectors.toList()))
        .build();
  }

  public static Station.Data createTestStationDataTwo() {
    var channels = getListOfChannelsForDaosTwo();
    var channelGroups = getListOfChannelGroupsForDaosTwo();

    Map<String, Map<CssDaoAndCoiParameters.SITE_ARGS, Double>> channelNametoParametersMap =
        new HashMap<>();
    channelNametoParametersMap.put(
        channels.get(0).getName(), CssDaoAndCoiParameters.STA1_PARAM_MAP);
    channelNametoParametersMap.put(channels.get(1).getName(), STA2_PARAM_MAP);

    Map<Channel, RelativePosition> relativePositionMap =
        channels.stream()
            .collect(
                Collectors.toMap(
                    Function.identity(),
                    channel -> {
                      Map<CssDaoAndCoiParameters.SITE_ARGS, Double> siteArgsDoubleMap =
                          channelNametoParametersMap.get(channel.getName());
                      return RelativePosition.from(
                          siteArgsDoubleMap.get(CssDaoAndCoiParameters.SITE_ARGS.DNORTH),
                          siteArgsDoubleMap.get(CssDaoAndCoiParameters.SITE_ARGS.DEAST),
                          0);
                    }));

    return Station.Data.builder()
        .setType(StationType.SEISMIC_ARRAY)
        .setDescription(CssDaoAndCoiParameters.STATION_NAME)
        .setLocation(
            Location.from(
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.LATITUDE),
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.LONGITUDE),
                0,
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.ELEVATION)))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setAllRawChannels(channels)
        .setChannelGroups(channelGroups)
        .setRelativePositionChannelPairs(
            relativePositionMap.entrySet().stream()
                .map(entry -> RelativePositionChannelPair.create(entry.getValue(), entry.getKey()))
                .collect(Collectors.toList()))
        .build();
  }

  public static Station.Data createTestStationReferenceData() {
    var channels = getListOfChannelReferencesForDaos();
    var channelGroups = getListOfChannelGroupReferencesForDaos();

    Map<String, Map<CssDaoAndCoiParameters.SITE_ARGS, Double>> channelNametoParametersMap =
        new HashMap<>();
    channelNametoParametersMap.put(
        channels.get(0).getName(), CssDaoAndCoiParameters.STA1_PARAM_MAP);
    channelNametoParametersMap.put(
        channels.get(1).getName(), CssDaoAndCoiParameters.STA1_PARAM_MAP);
    channelNametoParametersMap.put(channels.get(2).getName(), STA2_PARAM_MAP);

    Map<Channel, RelativePosition> relativePositionMap =
        channels.stream()
            .collect(
                Collectors.toMap(
                    Function.identity(),
                    channel -> {
                      Map<CssDaoAndCoiParameters.SITE_ARGS, Double> siteArgsDoubleMap =
                          channelNametoParametersMap.get(channel.getName());
                      return RelativePosition.from(
                          siteArgsDoubleMap.get(CssDaoAndCoiParameters.SITE_ARGS.DNORTH),
                          siteArgsDoubleMap.get(CssDaoAndCoiParameters.SITE_ARGS.DEAST),
                          0);
                    }));

    return Station.Data.builder()
        .setType(StationType.SEISMIC_ARRAY)
        .setDescription(CssDaoAndCoiParameters.STATION_NAME)
        .setLocation(
            Location.from(
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.LATITUDE),
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.LONGITUDE),
                0,
                STA3_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.ELEVATION)))
        .setEffectiveUntil(CssDaoAndCoiParameters.END_TIME)
        .setAllRawChannels(channels)
        .setChannelGroups(channelGroups)
        .setRelativePositionChannelPairs(
            relativePositionMap.entrySet().stream()
                .map(entry -> RelativePositionChannelPair.create(entry.getValue(), entry.getKey()))
                .collect(Collectors.toList()))
        .build();
  }

  public static StationGroup.Data createTestStationGroupData() {
    var stat =
        Station.builder()
            .setName(CssDaoAndCoiParameters.REFERENCE_STATION)
            .setEffectiveAt(CssDaoAndCoiParameters.ONDATE)
            .setData(
                Station.Data.builder()
                    .setDescription(CssDaoAndCoiParameters.STATION_NAME)
                    .setRelativePositionChannelPairs(
                        List.of(
                            RelativePositionChannelPair.create(
                                RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL),
                            RelativePositionChannelPair.create(
                                RelativePosition.from(NORTH, EAST, VERTICAL), CHANNEL_TWO)))
                    .setLocation(
                        Location.from(
                            CssDaoAndCoiParameters.LATITUDE1,
                            CssDaoAndCoiParameters.LONGITUDE1,
                            0,
                            CssDaoAndCoiParameters.ELEVATION1))
                    .setType(StationType.SEISMIC_3_COMPONENT)
                    .setChannelGroups(List.of(CHANNEL_GROUP))
                    .setAllRawChannels(List.of(CHANNEL, CHANNEL_TWO))
                    .build())
            .build();

    return StationGroup.Data.builder()
        .setDescription(GROUP_NAME)
        .setStations(List.of(stat))
        .build();
  }

  public static List<StationGroup> getListOfStationGroupsForDaos() {

    // create the full list of station daos
    var stationList = getListOfStationsForDaos();

    // loop through the main station list and filter into station groups
    var stationList1 =
        stationList.stream()
            .filter(
                sta ->
                    sta.getName().equals(REFERENCE_STATION)
                        || sta.getName().equals(REFERENCE_STATION_2))
            .collect(Collectors.toList());
    var stationList2 =
        stationList.stream()
            .filter(
                sta ->
                    sta.getName().equals(REFERENCE_STATION_3)
                        || sta.getName().equals(REFERENCE_STATION_4))
            .collect(Collectors.toList());

    // create network keys and get the effective times from the list of site daos
    var netKey1 = Pair.of(NETWORK_NAME_1, ONDATE2);
    var netKey2 = Pair.of(NETWORK_NAME_2, ONDATE3);

    return List.of(
        createTestStationGroupForDao(netKey1, NETWORK_DESC_1, stationList1),
        createTestStationGroupForDao(netKey2, NETWORK_DESC_2, stationList2));
  }

  public static List<Station> getListOfStationsForDaos() {
    return List.of(
        createTestStationForDao(REFERENCE_STATION, ONDATE),
        createTestStationForDao(REFERENCE_STATION_2, ONDATE2),
        createTestStationForDao(REFERENCE_STATION_3, ONDATE2),
        createTestStationForDao(REFERENCE_STATION_4, ONDATE3));
  }

  /**
   * Converts network key pair and list of stations into station group
   *
   * @param networkKey - pair containing network name and eff time
   * @param networkDescription - network description
   * @param stationList - list of stations
   * @return station group
   */
  private static StationGroup createTestStationGroupForDao(
      Pair<String, Instant> networkKey, String networkDescription, List<Station> stationList) {
    var networkName = networkKey.getLeft();
    var networkEffectiveAt = networkKey.getRight();

    var stationGroupData =
        StationGroup.Data.builder()
            .setDescription(networkDescription)
            .setStations(stationList)
            .build();

    return StationGroup.builder()
        .setName(networkName)
        .setEffectiveAt(networkEffectiveAt)
        .setData(stationGroupData)
        .build();
  }

  private static Station createTestStationForDao(String stationName, Instant effectiveAt) {

    var channelParameterFixtures = getChannelParameterFixtures();
    var channels = channelParameterFixtures.getChannelList();
    var channelGroups = getListOfChannelGroupsForStations(channels);

    Map<String, Map<CssDaoAndCoiParameters.SITE_ARGS, Double>> channelNametoParametersMap =
        channelParameterFixtures.getChannelNametoParametersMap();

    Map<Channel, RelativePosition> relativePositionMap =
        channels.stream()
            .collect(
                Collectors.toMap(
                    Function.identity(),
                    channel -> {
                      Map<CssDaoAndCoiParameters.SITE_ARGS, Double> siteArgsDoubleMap =
                          channelNametoParametersMap.get(channel.getName());
                      return RelativePosition.from(
                          siteArgsDoubleMap.get(CssDaoAndCoiParameters.SITE_ARGS.DNORTH),
                          siteArgsDoubleMap.get(CssDaoAndCoiParameters.SITE_ARGS.DEAST),
                          0);
                    }));

    Station.Data stationData =
        Station.Data.builder()
            .setType(StationType.SEISMIC_3_COMPONENT)
            .setDescription(CssDaoAndCoiParameters.STATION_NAME)
            .setLocation(
                Location.from(
                    STA1_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.LATITUDE),
                    STA1_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.LONGITUDE),
                    0,
                    STA1_PARAM_MAP.get(CssDaoAndCoiParameters.SITE_ARGS.ELEVATION)))
            .setAllRawChannels(channels)
            .setChannelGroups(channelGroups)
            .setRelativePositionChannelPairs(
                relativePositionMap.entrySet().stream()
                    .map(
                        entry ->
                            RelativePositionChannelPair.create(entry.getValue(), entry.getKey()))
                    .collect(Collectors.toList()))
            .build();

    return Station.builder()
        .setName(stationName)
        .setEffectiveAt(effectiveAt)
        .setData(stationData)
        .build();
  }

  private static StationGroup.Data createTestStationGroupDataForCss() {
    Station stat = getStationForDaos();

    return StationGroup.Data.builder()
        .setDescription(GROUP_NAME)
        .setStations(List.of(stat))
        .build();
  }

  public static List<SensorDao> getListOfSensorsFromMultimap(
      Multimap<SiteChanKey, Instant> siteChanTimeMap) {

    int channelId = 42;
    long inid = 108L;

    List<SensorDao> sensorDaos = new ArrayList<>();

    for (SiteChanKey siteChanKey : siteChanTimeMap.keySet()) {
      InstrumentDao instDao =
          createInstrumentDao(inid, CssDaoAndCoiParameters.INSTRUMENT_PARAM_MAP, LDATE);

      List<Instant> times = siteChanTimeMap.get(siteChanKey).stream().collect(Collectors.toList());

      if (!times.isEmpty()) {

        Instant previousTime = times.get(0);

        for (int i = 1; i < times.size(); i++) {

          sensorDaos.add(
              CSSDaoTestFixtures.createSensorDao(
                  siteChanKey.getStationCode(),
                  siteChanKey.getChannelCode(),
                  channelId,
                  instDao,
                  SENSOR_PARAM_MAP,
                  previousTime,
                  times.get(i)));

          previousTime = times.get(i);
        }
        sensorDaos.add(
            CSSDaoTestFixtures.createSensorDao(
                siteChanKey.getStationCode(),
                siteChanKey.getChannelCode(),
                channelId,
                instDao,
                SENSOR_PARAM_MAP,
                times.get(times.size() - 1),
                Instant.MAX));
      }

      channelId++;
      inid++;
    }

    return sensorDaos;
  }

  public static SiteDao getSiteForStation() {

    var siteDao = new SiteDao();
    siteDao.setReferenceStation(STATION.getName());
    var siteKey = new SiteKey();
    siteKey.setStationCode(STATION.getName());
    siteDao.setId(siteKey);

    return siteDao;
  }
}
