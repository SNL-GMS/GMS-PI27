package gms.shared.frameworks.osd.repository.util;

import gms.shared.frameworks.osd.coi.DoubleValue;
import gms.shared.frameworks.osd.coi.Units;
import gms.shared.frameworks.osd.coi.channel.Channel;
import gms.shared.frameworks.osd.coi.channel.ChannelBandType;
import gms.shared.frameworks.osd.coi.channel.ChannelDataType;
import gms.shared.frameworks.osd.coi.channel.ChannelGroup;
import gms.shared.frameworks.osd.coi.channel.ChannelGroup.Type;
import gms.shared.frameworks.osd.coi.channel.ChannelInstrumentType;
import gms.shared.frameworks.osd.coi.channel.ChannelOrientationType;
import gms.shared.frameworks.osd.coi.channel.ChannelProcessingMetadataType;
import gms.shared.frameworks.osd.coi.channel.Orientation;
import gms.shared.frameworks.osd.coi.channel.ReferenceChannel;
import gms.shared.frameworks.osd.coi.provenance.InformationSource;
import gms.shared.frameworks.osd.coi.signaldetection.Calibration;
import gms.shared.frameworks.osd.coi.signaldetection.FrequencyAmplitudePhase;
import gms.shared.frameworks.osd.coi.signaldetection.Location;
import gms.shared.frameworks.osd.coi.signaldetection.Station;
import gms.shared.frameworks.osd.coi.signaldetection.StationGroup;
import gms.shared.frameworks.osd.coi.stationreference.NetworkOrganization;
import gms.shared.frameworks.osd.coi.stationreference.NetworkRegion;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceCalibration;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceNetwork;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceNetworkMembership;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceResponse;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSite;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSiteMembership;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSourceResponse;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceStation;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceStationMembership;
import gms.shared.frameworks.osd.coi.stationreference.RelativePosition;
import gms.shared.frameworks.osd.coi.stationreference.ResponseTypes;
import gms.shared.frameworks.osd.coi.stationreference.StationType;
import gms.shared.frameworks.osd.coi.stationreference.StatusType;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class TestFixtures {

  public static final Channel channelWithNonExistentStation =
      Channel.from(
          "testChannelOne",
          "Test Channel One",
          "This is a description of the channel",
          "stationDoesNotExist",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "channelGroupOne"));
  public static final Channel channel1 =
      Channel.from(
          "testChannelOne",
          "Test Channel One",
          "This is a description of the channel",
          "stationOne",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "channelGroupOne"));
  public static final Channel channel2 =
      Channel.from(
          "testChannelTwo",
          "Test Channel Two",
          "This is a description of the channel",
          "stationOne",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "channelGroupOne"));
  public static final Channel channel3 =
      Channel.from(
          "testChannelThree",
          "Test Channel Three",
          "This is a description of the channel",
          "stationOne",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "channelGroupOne"));
  public static final Channel channel4 =
      Channel.from(
          "testChannelFour",
          "Test Channel Four",
          "This is a description of the channel",
          "stationOne",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "channelGroupOne"));
  public static final Channel channel5 =
      Channel.from(
          "testChannelFive",
          "Test Channel Five",
          "This is a description of the channel",
          "stationOne",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "channelGroupOne"));
  public static final Channel channel6 =
      Channel.from(
          "testChannelSix",
          "Test Channel Six",
          "This is a description of the channel",
          "stationOne",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "channelGroupOne"));
  public static final Channel derivedChannelOne =
      Channel.from(
          "derivedChannelOne",
          "Derived Channel One",
          "This is a description of the channel",
          "stationOne",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(channel1.getName(), channel6.getName()),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, "channelGroupOne"));

  public static final Channel channel7 =
      Channel.from(
          "testChannelSeven",
          "Test Channel Seven",
          "This is a description of the channel",
          "stationTwo",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, ""));

  public static final Channel channel8 =
      Channel.from(
          "testChannelEight",
          "Test Channel Eight",
          "This is a description of the channel",
          "stationTwo",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, ""));

  public static final Channel derivedChannelTwo =
      Channel.from(
          "derivedChannelTwo",
          "Derived from Test Channel Seven",
          "This is a description of the channel",
          "stationTwo",
          ChannelDataType.DIAGNOSTIC_SOH,
          ChannelBandType.BROADBAND,
          ChannelInstrumentType.HIGH_GAIN_SEISMOMETER,
          ChannelOrientationType.EAST_WEST,
          'E',
          Units.HERTZ,
          50.0,
          Location.from(100.0, 10.0, 50.0, 100),
          Orientation.from(10.0, 35.0),
          List.of(TestFixtures.channel7.getName()),
          Map.of(),
          Map.of(ChannelProcessingMetadataType.CHANNEL_GROUP, ""));

  public static final ChannelGroup channelGroupOne =
      ChannelGroup.from(
          "channelGroupOne",
          "Sample channel group containing all test suite channels",
          Location.from(100.0, 10.0, 50.0, 100.0),
          Type.SITE_GROUP,
          List.of(channel1, channel2, channel3, channel4, channel5, channel6));

  public static final ChannelGroup channelGroupTwo =
      ChannelGroup.from(
          "channelGroupTwo",
          "Sample channel group containing all test suite channels",
          Location.from(100.0, 10.0, 50.0, 100.0),
          Type.SITE_GROUP,
          List.of(channel7));

  public static final Station station =
      Station.from(
          "stationOne",
          StationType.SEISMIC_ARRAY,
          "Test station",
          Map.of(
              "testChannelOne", RelativePosition.from(50.0, 55.0, 60.0),
              "testChannelTwo", RelativePosition.from(40.0, 35.0, 60.0),
              "testChannelThree", RelativePosition.from(30.0, 15.0, 60.0),
              "testChannelFour", RelativePosition.from(20.0, 40.0, 60.0),
              "testChannelFive", RelativePosition.from(32.5, 16.0, 60.0),
              "testChannelSix", RelativePosition.from(22.5, 27.0, 60.0)),
          Location.from(135.75, 65.75, 50.0, 0.0),
          List.of(channelGroupOne),
          List.of(channel1, channel2, channel3, channel4, channel5, channel6));

  public static final Station stationTwo =
      Station.from(
          "stationTwo",
          StationType.SEISMIC_ARRAY,
          "Test station",
          Map.of("testChannelSeven", RelativePosition.from(50.0, 55.0, 64.0)),
          Location.from(135.75, 65.75, 50.0, 0.0),
          List.of(channelGroupTwo),
          List.of(channel7));

  public static final StationGroup STATION_GROUP =
      StationGroup.from(
          "testStationGroup", "This is an example of a station group", List.of(station));
  public static final String UNKNOWN_NAME = "someFakeName";
  public static final UUID UNKNOWN_ID = UUID.fromString("e2a78dbc-97d6-466b-9dd4-4e3fdf6dd95b");

  // ReferenceChannels
  private static final Instant CHANGE_TIME_1 = Instant.ofEpochSecond(797731200);
  private static final Instant CHANGE_TIME_2 = Instant.ofEpochSecond(1195430400);
  private static final Instant CHANGE_TIME_3 = Instant.ofEpochSecond(1232496000);
  private static final ChannelBandType BROADBAND = ChannelBandType.BROADBAND;
  private static final ChannelDataType SEISMIC = ChannelDataType.SEISMIC;
  private static final ChannelInstrumentType HIGH_GAIN_SEISMOMETER =
      ChannelInstrumentType.HIGH_GAIN_SEISMOMETER;
  private static final ChannelOrientationType EAST_WEST = ChannelOrientationType.EAST_WEST;
  private static final ChannelOrientationType NORTH_SOUTH = ChannelOrientationType.NORTH_SOUTH;
  private static final ChannelOrientationType VERTICAL = ChannelOrientationType.VERTICAL;
  private static final InformationSource infoSource =
      InformationSource.from("IDC", Instant.now(), "IDC");

  private static final RelativePosition ZERO_POSITION = RelativePosition.from(0.0, 0.0, 0.0);
  private static final Orientation ORIENTATION_90_90 = Orientation.from(90.0, 90.0);
  private static final Orientation ORIENTATION_90_0 = Orientation.from(90.0, 0.0);
  private static final Orientation ORIENTATION_0_NEG1 = Orientation.from(0.0, -1.0);
  private static final Orientation NA_ORIENTATION = Orientation.from(-1, -1);
  private static final double NA_VALUE = -999.0;
  private static final Location NA_VALUE_LOCATION =
      Location.from(NA_VALUE, NA_VALUE, NA_VALUE, NA_VALUE);

  // Channel BHE (3 versions)
  private static final Location LOCATION_CHAN_JNU_BHE_V1 =
      Location.from(33.1217, 130.8783, 1, 0.54);
  public static final ReferenceChannel CHAN_JNU_BHE_V1 =
      ReferenceChannel.builder()
          .setName("CHAN_JNU_BHE_V1")
          .setDataType(SEISMIC)
          .setBandType(BROADBAND)
          .setInstrumentType(HIGH_GAIN_SEISMOMETER)
          .setOrientationType(EAST_WEST)
          .setOrientationCode(EAST_WEST.getCode())
          .setLocationCode("0")
          .setLatitude(LOCATION_CHAN_JNU_BHE_V1.getLatitudeDegrees())
          .setLongitude(LOCATION_CHAN_JNU_BHE_V1.getLongitudeDegrees())
          .setElevation(LOCATION_CHAN_JNU_BHE_V1.getElevationKm())
          .setDepth(LOCATION_CHAN_JNU_BHE_V1.getDepthKm())
          .setVerticalAngle(ORIENTATION_90_90.getVerticalAngleDeg())
          .setHorizontalAngle(ORIENTATION_90_90.getHorizontalAngleDeg())
          .setUnits(Units.COUNTS_PER_NANOMETER)
          .setNominalSampleRate(20)
          .setActualTime(CHANGE_TIME_1)
          .setSystemTime(CHANGE_TIME_1)
          .setActive(true)
          .setInformationSource(infoSource)
          .setComment("CHAN_JNU_BHE_V1 ReferenceChannel")
          .setPosition(ZERO_POSITION)
          .setAliases(Collections.emptyList())
          .build();

  private static final ReferenceChannel CHAN_JNU_BHE_V2 =
      ReferenceChannel.builder()
          .setName("CHAN_JNU_BHE_V2")
          .setDataType(SEISMIC)
          .setBandType(BROADBAND)
          .setInstrumentType(HIGH_GAIN_SEISMOMETER)
          .setOrientationType(EAST_WEST)
          .setOrientationCode(EAST_WEST.getCode())
          .setLocationCode("0")
          .setLatitude(NA_VALUE_LOCATION.getLatitudeDegrees())
          .setLongitude(NA_VALUE_LOCATION.getLongitudeDegrees())
          .setElevation(NA_VALUE_LOCATION.getElevationKm())
          .setDepth(NA_VALUE_LOCATION.getDepthKm())
          .setVerticalAngle(NA_ORIENTATION.getVerticalAngleDeg())
          .setHorizontalAngle(NA_ORIENTATION.getHorizontalAngleDeg())
          .setUnits(Units.COUNTS_PER_NANOMETER)
          .setNominalSampleRate(20)
          .setActualTime(CHANGE_TIME_2)
          .setSystemTime(CHANGE_TIME_2)
          .setActive(true)
          .setInformationSource(infoSource)
          .setComment("decommissioned CHAN_JNU_BHE_V2 ReferenceChannel")
          .setPosition(ZERO_POSITION)
          .setAliases(Collections.emptyList())
          .build();

  private static final Location LOCATION_CHAN_JNU_BHE_V3 =
      Location.from(33.121667, 130.87833, 0, 0.573);
  private static final ReferenceChannel CHAN_JNU_BHE_V3 =
      ReferenceChannel.builder()
          .setName("CHAN_JNU_BHE_V3")
          .setDataType(SEISMIC)
          .setBandType(BROADBAND)
          .setInstrumentType(HIGH_GAIN_SEISMOMETER)
          .setOrientationType(EAST_WEST)
          .setOrientationCode(EAST_WEST.getCode())
          .setLocationCode("0")
          .setLatitude(LOCATION_CHAN_JNU_BHE_V3.getLatitudeDegrees())
          .setLongitude(LOCATION_CHAN_JNU_BHE_V3.getLongitudeDegrees())
          .setElevation(LOCATION_CHAN_JNU_BHE_V3.getElevationKm())
          .setDepth(LOCATION_CHAN_JNU_BHE_V3.getDepthKm())
          .setVerticalAngle(ORIENTATION_90_90.getVerticalAngleDeg())
          .setHorizontalAngle(ORIENTATION_90_90.getHorizontalAngleDeg())
          .setUnits(Units.COUNTS_PER_NANOMETER)
          .setNominalSampleRate(40)
          .setActualTime(CHANGE_TIME_3)
          .setSystemTime(CHANGE_TIME_3)
          .setActive(true)
          .setInformationSource(infoSource)
          .setComment("decommissioned CHAN_JNU_BHE_V3 ReferenceChannel")
          .setPosition(ZERO_POSITION)
          .setAliases(Collections.emptyList())
          .build();

  private static final Location LOCATION_CHAN_JNU_BHN_V1 =
      Location.from(33.1217, 130.8783, 1, 0.54);
  private static final ReferenceChannel CHAN_JNU_BHN_V1 =
      ReferenceChannel.builder()
          .setName("CHAN_JNU_BHN_V1")
          .setDataType(SEISMIC)
          .setBandType(BROADBAND)
          .setInstrumentType(HIGH_GAIN_SEISMOMETER)
          .setOrientationType(NORTH_SOUTH)
          .setOrientationCode(NORTH_SOUTH.getCode())
          .setLocationCode("0")
          .setLatitude(LOCATION_CHAN_JNU_BHN_V1.getLatitudeDegrees())
          .setLongitude(LOCATION_CHAN_JNU_BHN_V1.getLongitudeDegrees())
          .setElevation(LOCATION_CHAN_JNU_BHN_V1.getElevationKm())
          .setDepth(LOCATION_CHAN_JNU_BHN_V1.getDepthKm())
          .setVerticalAngle(ORIENTATION_90_0.getVerticalAngleDeg())
          .setHorizontalAngle(ORIENTATION_90_0.getHorizontalAngleDeg())
          .setUnits(Units.COUNTS_PER_NANOMETER)
          .setNominalSampleRate(20)
          .setActualTime(CHANGE_TIME_1)
          .setSystemTime(CHANGE_TIME_1)
          .setActive(true)
          .setInformationSource(infoSource)
          .setComment("CHAN_JNU_BHN_V1 ReferenceChannel")
          .setPosition(ZERO_POSITION)
          .setAliases(Collections.emptyList())
          .build();

  private static final ReferenceChannel CHAN_JNU_BHN_V2 =
      ReferenceChannel.builder()
          .setName("CHAN_JNU_BHN_V2")
          .setDataType(SEISMIC)
          .setBandType(BROADBAND)
          .setInstrumentType(HIGH_GAIN_SEISMOMETER)
          .setOrientationType(NORTH_SOUTH)
          .setOrientationCode(NORTH_SOUTH.getCode())
          .setLocationCode("0")
          .setLatitude(NA_VALUE_LOCATION.getLatitudeDegrees())
          .setLongitude(NA_VALUE_LOCATION.getLongitudeDegrees())
          .setElevation(NA_VALUE_LOCATION.getElevationKm())
          .setDepth(NA_VALUE_LOCATION.getDepthKm())
          .setVerticalAngle(NA_ORIENTATION.getVerticalAngleDeg())
          .setHorizontalAngle(NA_ORIENTATION.getHorizontalAngleDeg())
          .setUnits(Units.COUNTS_PER_NANOMETER)
          .setNominalSampleRate(20)
          .setActualTime(CHANGE_TIME_2)
          .setSystemTime(CHANGE_TIME_2)
          .setActive(true)
          .setInformationSource(infoSource)
          .setComment("decommissioned CHAN_JNU_BHN_V2 ReferenceChannel")
          .setPosition(ZERO_POSITION)
          .setAliases(Collections.emptyList())
          .build();

  private static final Location LOCATION_CHAN_JNU_BHN_V3 =
      Location.from(33.121667, 130.87833, 0, 0.573);
  private static final ReferenceChannel CHAN_JNU_BHN_V3 =
      ReferenceChannel.builder()
          .setName("CHAN_JNU_BHN_V3")
          .setDataType(SEISMIC)
          .setBandType(BROADBAND)
          .setInstrumentType(HIGH_GAIN_SEISMOMETER)
          .setOrientationType(NORTH_SOUTH)
          .setOrientationCode(NORTH_SOUTH.getCode())
          .setLocationCode("0")
          .setLatitude(LOCATION_CHAN_JNU_BHN_V3.getLatitudeDegrees())
          .setLongitude(LOCATION_CHAN_JNU_BHN_V3.getLongitudeDegrees())
          .setElevation(LOCATION_CHAN_JNU_BHN_V3.getElevationKm())
          .setDepth(LOCATION_CHAN_JNU_BHN_V3.getDepthKm())
          .setVerticalAngle(ORIENTATION_90_0.getVerticalAngleDeg())
          .setHorizontalAngle(ORIENTATION_90_0.getHorizontalAngleDeg())
          .setUnits(Units.COUNTS_PER_NANOMETER)
          .setNominalSampleRate(40)
          .setActualTime(CHANGE_TIME_3)
          .setSystemTime(CHANGE_TIME_3)
          .setActive(true)
          .setInformationSource(infoSource)
          .setComment("decommissioned CHAN_JNU_BHN_V3 ReferenceChannel")
          .setPosition(ZERO_POSITION)
          .setAliases(Collections.emptyList())
          .build();

  private static final Location LOCATION_CHAN_JNU_BHZ_V1 =
      Location.from(33.1217, 130.8783, 1, 0.54);
  private static final ReferenceChannel CHAN_JNU_BHZ_V1 =
      ReferenceChannel.builder()
          .setName("CHAN_JNU_BHZ_V1")
          .setDataType(SEISMIC)
          .setBandType(BROADBAND)
          .setInstrumentType(HIGH_GAIN_SEISMOMETER)
          .setOrientationType(NORTH_SOUTH)
          .setOrientationCode(NORTH_SOUTH.getCode())
          .setLocationCode("0")
          .setLatitude(LOCATION_CHAN_JNU_BHZ_V1.getLatitudeDegrees())
          .setLongitude(LOCATION_CHAN_JNU_BHZ_V1.getLongitudeDegrees())
          .setElevation(LOCATION_CHAN_JNU_BHZ_V1.getElevationKm())
          .setDepth(LOCATION_CHAN_JNU_BHZ_V1.getDepthKm())
          .setVerticalAngle(ORIENTATION_0_NEG1.getVerticalAngleDeg())
          .setHorizontalAngle(ORIENTATION_0_NEG1.getHorizontalAngleDeg())
          .setUnits(Units.COUNTS_PER_NANOMETER)
          .setNominalSampleRate(20)
          .setActualTime(CHANGE_TIME_1)
          .setSystemTime(CHANGE_TIME_1)
          .setActive(true)
          .setInformationSource(infoSource)
          .setComment("CHAN_JNU_BHZ_V1 ReferenceChannel")
          .setPosition(ZERO_POSITION)
          .setAliases(Collections.emptyList())
          .build();

  private static final ReferenceChannel CHAN_JNU_BHZ_V2 =
      ReferenceChannel.builder()
          .setName("CHAN_JNU_BHZ_V2")
          .setDataType(SEISMIC)
          .setBandType(BROADBAND)
          .setInstrumentType(HIGH_GAIN_SEISMOMETER)
          .setOrientationType(NORTH_SOUTH)
          .setOrientationCode(NORTH_SOUTH.getCode())
          .setLocationCode("0")
          .setLatitude(NA_VALUE_LOCATION.getLatitudeDegrees())
          .setLongitude(NA_VALUE_LOCATION.getLongitudeDegrees())
          .setElevation(NA_VALUE_LOCATION.getElevationKm())
          .setDepth(NA_VALUE_LOCATION.getDepthKm())
          .setVerticalAngle(ORIENTATION_0_NEG1.getVerticalAngleDeg())
          .setHorizontalAngle(ORIENTATION_0_NEG1.getHorizontalAngleDeg())
          .setUnits(Units.COUNTS_PER_NANOMETER)
          .setNominalSampleRate(20)
          .setActualTime(CHANGE_TIME_2)
          .setSystemTime(CHANGE_TIME_2)
          .setActive(true)
          .setInformationSource(infoSource)
          .setComment("decommissioned CHAN_JNU_BHZ_V2 ReferenceChannel")
          .setPosition(ZERO_POSITION)
          .setAliases(Collections.emptyList())
          .build();

  private static final Location LOCATION_CHAN_JNU_BHZ_V3 =
      Location.from(33.121667, 130.87833, 0, 0.573);
  private static final ReferenceChannel CHAN_JNU_BHZ_V3 =
      ReferenceChannel.builder()
          .setName("CHAN_JNU_BHZ_V3")
          .setDataType(SEISMIC)
          .setBandType(BROADBAND)
          .setInstrumentType(HIGH_GAIN_SEISMOMETER)
          .setOrientationType(NORTH_SOUTH)
          .setOrientationCode(NORTH_SOUTH.getCode())
          .setLocationCode("0")
          .setLatitude(LOCATION_CHAN_JNU_BHZ_V3.getLatitudeDegrees())
          .setLongitude(LOCATION_CHAN_JNU_BHZ_V3.getLongitudeDegrees())
          .setElevation(LOCATION_CHAN_JNU_BHZ_V3.getElevationKm())
          .setDepth(LOCATION_CHAN_JNU_BHZ_V3.getDepthKm())
          .setVerticalAngle(ORIENTATION_0_NEG1.getVerticalAngleDeg())
          .setHorizontalAngle(ORIENTATION_0_NEG1.getHorizontalAngleDeg())
          .setUnits(Units.COUNTS_PER_NANOMETER)
          .setNominalSampleRate(40)
          .setActualTime(CHANGE_TIME_3)
          .setSystemTime(CHANGE_TIME_3)
          .setActive(true)
          .setInformationSource(infoSource)
          .setComment("decommissioned CHAN_JNU_BHZ_V3 ReferenceChannel")
          .setPosition(ZERO_POSITION)
          .setAliases(Collections.emptyList())
          .build();

  public static final List<ReferenceChannel> allReferenceChannels =
      List.of(
          CHAN_JNU_BHE_V1,
          CHAN_JNU_BHE_V2,
          CHAN_JNU_BHE_V3,
          CHAN_JNU_BHN_V1,
          CHAN_JNU_BHN_V2,
          CHAN_JNU_BHN_V3,
          CHAN_JNU_BHZ_V1,
          CHAN_JNU_BHZ_V2,
          CHAN_JNU_BHZ_V3);

  // ReferenceSourceResponses
  private static final ReferenceSourceResponse REFERENCE_SOURCE_RESPONSE =
      ReferenceSourceResponse.builder()
          .setSourceResponseData("test".getBytes())
          .setSourceResponseUnits(Units.COUNTS_PER_NANOMETER)
          .setSourceResponseTypes(ResponseTypes.FAP)
          .setInformationSources(List.of(infoSource))
          .build();

  // ReferenceCalibration
  private static final Duration TEN_SECOND_DURATION = Duration.ofSeconds(10);
  private static final DoubleValue CAL_FACTOR =
      DoubleValue.from(1.992, 10.3, Units.NANOMETERS_PER_COUNT);

  private static final Calibration CALIBRATION_BHE_V1 =
      Calibration.from(1, TEN_SECOND_DURATION, CAL_FACTOR);
  private static final Calibration CALIBRATION_BHE_V2 =
      Calibration.from(2, TEN_SECOND_DURATION, CAL_FACTOR);
  private static final Calibration CALIBRATION_BHE_V3 =
      Calibration.from(3, TEN_SECOND_DURATION, CAL_FACTOR);

  private static final ReferenceCalibration REF_CALIBRATION_BHE_V1 =
      ReferenceCalibration.from(TEN_SECOND_DURATION, CALIBRATION_BHE_V1);
  private static final ReferenceCalibration REF_CALIBRATION_BHE_V2 =
      ReferenceCalibration.from(TEN_SECOND_DURATION, CALIBRATION_BHE_V2);
  private static final ReferenceCalibration REF_CALIBRATION_BHE_V3 =
      ReferenceCalibration.from(TEN_SECOND_DURATION, CALIBRATION_BHE_V3);

  // FrequencyAmplitudePhase
  private static final FrequencyAmplitudePhase fap =
      FrequencyAmplitudePhase.builder()
          .setFrequencies(new double[] {8.9})
          .setAmplitudeResponseUnits(Units.HERTZ)
          .setAmplitudeResponse(new double[] {0.1})
          .setAmplitudeResponseStdDev(new double[] {2.3})
          .setPhaseResponseUnits(Units.HERTZ)
          .setPhaseResponse(new double[] {4.5})
          .setPhaseResponseStdDev(new double[] {6.7})
          .build();

  // ReferenceResponses
  // bhe responses
  private static final ReferenceResponse RESPONSE_BHE_V1 =
      ReferenceResponse.builder()
          .setChannelName("RESPONSE_BHE_V1")
          .setActualTime(CHANGE_TIME_1)
          .setSystemTime(CHANGE_TIME_1)
          .setComment("nm/c")
          .setSourceResponse(REFERENCE_SOURCE_RESPONSE)
          .setReferenceCalibration(REF_CALIBRATION_BHE_V1)
          .setFapResponse(fap)
          .build();

  private static final ReferenceResponse RESPONSE_BHE_V2 =
      ReferenceResponse.builder()
          .setChannelName("RESPONSE_BHE_V2")
          .setActualTime(CHANGE_TIME_2)
          .setSystemTime(CHANGE_TIME_2)
          .setComment("nm/c")
          .setSourceResponse(REFERENCE_SOURCE_RESPONSE)
          .setReferenceCalibration(REF_CALIBRATION_BHE_V2)
          .setFapResponse(fap)
          .build();

  private static final ReferenceResponse RESPONSE_BHE_V3 =
      ReferenceResponse.builder()
          .setChannelName("RESPONSE_BHE_V3")
          .setActualTime(CHANGE_TIME_3)
          .setSystemTime(CHANGE_TIME_3)
          .setComment("nm/c")
          .setSourceResponse(REFERENCE_SOURCE_RESPONSE)
          .setReferenceCalibration(REF_CALIBRATION_BHE_V3)
          .setFapResponse(fap)
          .build();

  public static final List<ReferenceResponse> ALL_REFERENCE_RESPONSES =
      List.of(RESPONSE_BHE_V1, RESPONSE_BHE_V2, RESPONSE_BHE_V3);

  public static final Instant changeTime1 = Instant.ofEpochSecond(797731200),
      changeTime2 = Instant.ofEpochSecond(1195430400),
      changeTime3 = Instant.ofEpochSecond(1232496000);

  public static final ReferenceStation JNU_V1 =
      ReferenceStation.builder()
          .setName("JNU")
          .setDescription("Ohita, Japan")
          .setStationType(StationType.SEISMIC_3_COMPONENT)
          .setSource(infoSource)
          .setComment("")
          .setLatitude(33.1217)
          .setLongitude(130.8783)
          .setElevation(0.54)
          .setActualChangeTime(changeTime1)
          .setSystemChangeTime(changeTime1)
          .setActive(true)
          .setAliases(new ArrayList<>())
          .build();

  public static final ReferenceStation JNU_V2 =
      ReferenceStation.builder()
          .setName("JNU")
          .setDescription("")
          .setStationType(StationType.SEISMIC_3_COMPONENT)
          .setSource(infoSource)
          .setComment("upgrade for IMS")
          .setLatitude(NA_VALUE)
          .setLongitude(NA_VALUE)
          .setElevation(NA_VALUE)
          .setActualChangeTime(changeTime2)
          .setSystemChangeTime(changeTime2)
          .setActive(true)
          .setAliases(new ArrayList<>())
          .build();

  public static final ReferenceStation JNU_V3 =
      ReferenceStation.builder()
          .setName("JNU")
          .setDescription("Oita Nakatsue, Japan Meterological Agency Seismic Network")
          .setStationType(StationType.SEISMIC_3_COMPONENT)
          .setSource(infoSource)
          .setComment("")
          .setLatitude(33.121667)
          .setLongitude(130.87833)
          .setElevation(0.573)
          .setActualChangeTime(changeTime3)
          .setSystemChangeTime(changeTime3)
          .setActive(true)
          .setAliases(new ArrayList<>())
          .build();

  public static List<ReferenceStation> jnuVersions =
      List.of(TestFixtures.JNU_V1, TestFixtures.JNU_V2, TestFixtures.JNU_V3);

  public static ReferenceNetwork NET_IMS_AUX, NET_IDC_DA;
  public static Set<ReferenceNetworkMembership> networkMemberships;
  public static final ReferenceSite JNU_SITE_V1 =
      ReferenceSite.builder()
          .setName("JNU")
          .setDescription("Ohita, Japan")
          .setSource(infoSource)
          .setComment("")
          .setLatitude(33.1217)
          .setLongitude(130.8783)
          .setElevation(0.54)
          .setActualChangeTime(changeTime1)
          .setSystemChangeTime(changeTime1)
          .setActive(true)
          .setPosition(ZERO_POSITION)
          .setAliases(new ArrayList<>())
          .build();

  public static final ReferenceSite JNU_SITE_V2 =
      ReferenceSite.builder()
          .setName("JNU")
          .setDescription("")
          .setSource(infoSource)
          .setComment("upgrade for IMS")
          .setLatitude(NA_VALUE)
          .setLongitude(NA_VALUE)
          .setElevation(NA_VALUE)
          .setActualChangeTime(changeTime2)
          .setSystemChangeTime(changeTime2)
          .setActive(true)
          .setPosition(ZERO_POSITION)
          .setAliases(new ArrayList<>())
          .build();

  public static final ReferenceSite JNU_SITE_V3 =
      ReferenceSite.builder()
          .setName("JNU")
          .setDescription("Oita Nakatsue, Japan Meterological Agency Seismic Network")
          .setSource(infoSource)
          .setComment("")
          .setLatitude(33.121667)
          .setLongitude(130.87833)
          .setElevation(0.573)
          .setActualChangeTime(changeTime3)
          .setSystemChangeTime(changeTime3)
          .setActive(true)
          .setPosition(ZERO_POSITION)
          .setAliases(new ArrayList<>())
          .build();

  public static final List<ReferenceSite> JNU_SITE_VERSIONS =
      List.of(JNU_SITE_V1, JNU_SITE_V2, JNU_SITE_V3);

  public static Set<ReferenceSiteMembership> siteMemberships;
  public static Set<ReferenceStationMembership> stationMemberships;

  static {
    // Define networks
    Instant netImxAuxChangeTime = Instant.ofEpochSecond(604713600);
    NET_IMS_AUX =
        ReferenceNetwork.builder()
            .setName("IMS_AUX")
            .setDescription("All IMS auxiliary seismic stations")
            .setOrganization(NetworkOrganization.CTBTO)
            .setRegion(NetworkRegion.GLOBAL)
            .setSource(infoSource)
            .setComment("")
            .setActualChangeTime(netImxAuxChangeTime)
            .setSystemChangeTime(netImxAuxChangeTime)
            .setActive(true)
            .build();

    Instant idcDaChangeTime = Instant.ofEpochSecond(228700800);
    NET_IDC_DA =
        ReferenceNetwork.builder()
            .setName("IDC_DA")
            .setDescription("All acquired stations - used by update interval")
            .setOrganization(NetworkOrganization.UNKNOWN)
            .setRegion(NetworkRegion.GLOBAL)
            .setSource(infoSource)
            .setComment("")
            .setActualChangeTime(idcDaChangeTime)
            .setSystemChangeTime(idcDaChangeTime)
            .setActive(true)
            .build();

    associateStationsAndNetworks();
    associateSitesAndStations();
    associateChannelAndSites();
  }

  private static void associateStationsAndNetworks() {
    // declare memberships
    UUID jnu_id = JNU_V1.getEntityId();
    ReferenceNetworkMembership ims_member_1 =
        ReferenceNetworkMembership.from(
            UUID.randomUUID(),
            "",
            changeTime1,
            changeTime1,
            NET_IMS_AUX.getEntityId(),
            jnu_id,
            StatusType.ACTIVE);
    ReferenceNetworkMembership ims_member_2 =
        ReferenceNetworkMembership.from(
            UUID.randomUUID(),
            "",
            changeTime2,
            changeTime2,
            NET_IMS_AUX.getEntityId(),
            jnu_id,
            StatusType.INACTIVE);
    ReferenceNetworkMembership ims_member_3 =
        ReferenceNetworkMembership.from(
            UUID.randomUUID(),
            "",
            changeTime3,
            changeTime3,
            NET_IMS_AUX.getEntityId(),
            jnu_id,
            StatusType.ACTIVE);
    ReferenceNetworkMembership idc_member_1 =
        ReferenceNetworkMembership.from(
            UUID.randomUUID(),
            "",
            changeTime1,
            changeTime1,
            NET_IDC_DA.getEntityId(),
            jnu_id,
            StatusType.ACTIVE);
    ReferenceNetworkMembership idc_member_2 =
        ReferenceNetworkMembership.from(
            UUID.randomUUID(),
            "",
            changeTime2,
            changeTime2,
            NET_IDC_DA.getEntityId(),
            jnu_id,
            StatusType.INACTIVE);
    ReferenceNetworkMembership idc_member_3 =
        ReferenceNetworkMembership.from(
            UUID.randomUUID(),
            "",
            changeTime3,
            changeTime3,
            NET_IDC_DA.getEntityId(),
            jnu_id,
            StatusType.ACTIVE);
    // set reference to all memberships
    networkMemberships =
        Set.of(ims_member_1, ims_member_2, ims_member_3, idc_member_1, idc_member_2, idc_member_3);
  }

  private static void associateSitesAndStations() {
    UUID jnu_id = JNU_V1.getEntityId();
    UUID jnu_site_id = JNU_SITE_V1.getEntityId();
    ReferenceStationMembership member1 =
        ReferenceStationMembership.from(
            UUID.randomUUID(),
            "",
            changeTime1,
            changeTime1,
            jnu_id,
            jnu_site_id,
            StatusType.ACTIVE);
    ReferenceStationMembership member2 =
        ReferenceStationMembership.from(
            UUID.randomUUID(),
            "",
            changeTime2,
            changeTime2,
            jnu_id,
            jnu_site_id,
            StatusType.INACTIVE);
    ReferenceStationMembership member3 =
        ReferenceStationMembership.from(
            UUID.randomUUID(),
            "",
            changeTime3,
            changeTime3,
            jnu_id,
            jnu_site_id,
            StatusType.ACTIVE);
    stationMemberships = Set.of(member1, member2, member3);
  }

  private static void associateChannelAndSites() {
    UUID jnu_site_id = TestFixtures.JNU_SITE_V1.getEntityId();
    String channelName = TestFixtures.CHAN_JNU_BHE_V1.getName();
    ReferenceSiteMembership member1 =
        ReferenceSiteMembership.from(
            UUID.randomUUID(),
            "",
            changeTime1,
            changeTime1,
            jnu_site_id,
            channelName,
            StatusType.ACTIVE);
    ReferenceSiteMembership member2 =
        ReferenceSiteMembership.from(
            UUID.randomUUID(),
            "",
            changeTime2,
            changeTime2,
            jnu_site_id,
            channelName,
            StatusType.INACTIVE);
    ReferenceSiteMembership member3 =
        ReferenceSiteMembership.from(
            UUID.randomUUID(),
            "",
            changeTime3,
            changeTime3,
            jnu_site_id,
            channelName,
            StatusType.ACTIVE);
    siteMemberships = Set.of(member1, member2, member3);
  }
}
