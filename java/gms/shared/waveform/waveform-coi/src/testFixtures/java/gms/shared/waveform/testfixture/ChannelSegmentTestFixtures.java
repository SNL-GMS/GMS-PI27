package gms.shared.waveform.testfixture;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL_SEG_TEST;

import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.DataType;
import gms.shared.stationdefinition.dao.css.enums.SegType;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.coi.util.TimeseriesUtility;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public final class ChannelSegmentTestFixtures {

  private static final int WFDISC_DAO_ID = 123;
  private static final long SECONDS_60 = 60;
  private static final long SECONDS_600 = 600;
  private static final Instant CREATION_INSTANT = Instant.parse("2000-02-20T05:59:35.680Z");
  private static final Instant LOAD_DATE = Instant.parse("2010-09-24T00:00:00.000Z");
  private static final Integer NUM_SAMPLES_44_000 = 44_000;
  private static final Integer NUM_SAMPLES_144_000 = 144_000;
  private static final Integer NUM_SAMPLES_288_000 = 288_000;
  private static final Integer NUM_SAMPLES_1_061_096 = 1_061_096;
  private static final double SAMPLE_RATE_100 = 100.00;
  private static final double SAMPLE_RATE_40 = 40.00;
  private static final double SAMPLE_RATE_99_50 = 99.50;
  private static final double CALIB_RATE = 0.0079;
  private static final double CALB_PER = 1;
  private static final double E1_S4_SAMP_RATE = 40.0;
  private static final double E1_CALIB = 0.027633;
  private static final double S4_CALIB = 0.0633;
  private static final double I4_F4_S2_SAMP_RATE = 100.0;
  private static final double I4_F4_T4_S2_CALIB = 1;
  private static final double T4_SAMP_RATE = 5.0;
  private static final double S3_SAMP_RATE = 20.0;
  private static final double S3_CALIB = 1.0;
  private static final String E1_CHANNEL = "TEST.TEST1.BHZ";
  private static final String S4_CHANNEL = "TEST.TEST2.BHN";
  private static final String I4_F4_S2_CHANNEL = "TEST.TEST3.HHE";
  private static final String T4_CHANNEL = "TEST.TEST4.BHE";
  private static final String S3_CHANNEL = "TEST.TEST5.SHZ";
  private static final String FILE_FOR_MERGING1 = "Mergeable1.w";
  private static final String FILE_FOR_MERGING2 = "Mergeable2.w";
  private static final String FILE_FOR_MULTIPLE_E1 = "MultipleE1_1.w";
  private static final Instant I4_F4_S2_START_TIME = Instant.parse("2011-01-01T00:00:23.552Z");
  private static final Instant I4_F4_S2_END_TIME = Instant.parse("2011-01-01T02:57:20.384Z");
  private static final Instant[] LIST_OF_START_TIMES = {
    Instant.parse("2010-05-21T02:00:00.000Z"),
    Instant.parse("2010-05-21T02:48:00.000Z"),
    Instant.parse("2010-05-21T03:36:00.000Z"),
    Instant.parse("2010-05-21T04:26:00.000Z"),
    Instant.parse("2010-05-21T05:14:00.000Z")
  };
  private static final Instant[] LIST_OF_END_TIMES = {
    Instant.parse("2010-05-21T03:59:59.950Z"),
    Instant.parse("2010-05-21T04:59:59.950Z"),
    Instant.parse("2010-05-21T05:59:59.950Z"),
    Instant.parse("2010-05-21T06:59:59.950Z")
  };

  private static final Instant START = Instant.EPOCH;
  private static final Instant CREATION_TIME = START.minus(1, ChronoUnit.MINUTES);
  private static final Waveform EARLIER_WAVEFORM = Waveform.create(START, 1.0, new double[5]);
  private static final Waveform LATER_WAVEFORM =
      Waveform.create(START.plusSeconds(30), 1.0, new double[10]);
  private static final List<Waveform> WFS = List.of(LATER_WAVEFORM, EARLIER_WAVEFORM);

  private ChannelSegmentTestFixtures() {
    // private default constructor to hide implicit public one.
  }

  public static Channel getTestChannel(String name) {
    return Channel.builder()
        .setName(name)
        .setEffectiveAt(Instant.parse("2000-02-20T05:59:35.680Z"))
        .build();
  }

  public static Channel getTestChannelE1() {
    return getTestChannel(E1_CHANNEL);
  }

  public static Channel getTestChannelS4() {
    return getTestChannel(S4_CHANNEL);
  }

  public static Channel getTestChannelI4F4S2() {
    return getTestChannel(I4_F4_S2_CHANNEL);
  }

  public static Channel getTestChannelT4() {
    return getTestChannel(T4_CHANNEL);
  }

  public static Channel getTestChannelS3() {
    return getTestChannel(S3_CHANNEL);
  }

  public static List<WfdiscDao> getTestWfdiscListForMultipleE1() {

    List<WfdiscDao> wfdiscDaos = new ArrayList<>();
    var channel = getTestChannelE1();

    var range1 =
        Range.openClosed(
            Instant.parse("2010-05-21T01:59:17.760Z"), Instant.parse("2010-05-21T03:59:26.720Z"));
    var wfdiscCreationVariables =
        new WfdiscCreationVariables(range1, FILE_FOR_MULTIPLE_E1, NUM_SAMPLES_288_000, 465272L);
    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, E1_S4_SAMP_RATE, E1_CALIB, DataType.E1, channel));

    var range2 =
        Range.openClosed(
            Instant.parse("2010-05-21T03:59:26.720Z"), Instant.parse("2010-05-21T05:59:35.680Z"));
    wfdiscCreationVariables =
        new WfdiscCreationVariables(range2, "MultipleE1_2.w", NUM_SAMPLES_288_000, 431056L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, E1_S4_SAMP_RATE, E1_CALIB, DataType.E1, channel));

    return wfdiscDaos;
  }

  public static List<WfdiscDao> getTestWfdiscListForCombiningE1() {

    List<WfdiscDao> wfdiscDaos = new ArrayList<>();
    var channel = getTestChannelE1();

    var range3 = Range.openClosed(LIST_OF_START_TIMES[0], LIST_OF_END_TIMES[0]);
    var wfdiscCreationVariables =
        new WfdiscCreationVariables(range3, FILE_FOR_MERGING1, NUM_SAMPLES_288_000, 0L);
    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));

    var range4 = Range.openClosed(LIST_OF_START_TIMES[1], LIST_OF_END_TIMES[1]);
    wfdiscCreationVariables =
        new WfdiscCreationVariables(range4, FILE_FOR_MERGING2, NUM_SAMPLES_288_000, 0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));

    return wfdiscDaos;
  }

  public static List<WfdiscDao> getTestWfdiscListForCombiningMultipleE1(int numOfWfdiscs) {
    // start with two and add more, depending on numOfWfdiscs (which is the number specified PLUS
    // TWO...
    List<WfdiscDao> wfdiscDaos = getTestWfdiscListForCombiningE1();
    var channel = getTestChannelE1();
    for (var i = 0; i < numOfWfdiscs; i++) {
      Instant currentStartTime = LIST_OF_START_TIMES[2].plus(Duration.ofMinutes(i * 48L));
      Instant currentEndTime = LIST_OF_END_TIMES[3].plus(Duration.ofHours(i * 1L));
      var currRange = Range.openClosed(currentStartTime, currentEndTime);
      var wfdiscCreationVariables =
          new WfdiscCreationVariables(currRange, FILE_FOR_MERGING1, NUM_SAMPLES_288_000, 0L);
      wfdiscDaos.add(
          createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));
    }

    return wfdiscDaos;
  }

  public static List<WfdiscDao> getTestWfdiscListForNotCombiningE1() {
    List<WfdiscDao> wfdiscDaos = new ArrayList<>();
    var channel = getTestChannelE1();

    var range6 = Range.openClosed(LIST_OF_START_TIMES[0], LIST_OF_END_TIMES[0]);
    var wfdiscCreationVariables =
        new WfdiscCreationVariables(range6, FILE_FOR_MERGING1, NUM_SAMPLES_288_000, 0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));

    var range7 = Range.openClosed(LIST_OF_START_TIMES[1].plusSeconds(2L), LIST_OF_END_TIMES[1]);
    wfdiscCreationVariables =
        new WfdiscCreationVariables(range7, FILE_FOR_MERGING2, NUM_SAMPLES_288_000, 0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));

    return wfdiscDaos;
  }

  public static List<WfdiscDao> getTestWfdiscListForEnclosedE1() {
    List<WfdiscDao> wfdiscDaos = new ArrayList<>();
    var channel = getTestChannelE1();

    var range8 = Range.openClosed(LIST_OF_START_TIMES[0], LIST_OF_END_TIMES[1]);
    var wfdiscCreationVariables =
        new WfdiscCreationVariables(range8, FILE_FOR_MERGING1, NUM_SAMPLES_288_000, 0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));
    wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(
                LIST_OF_START_TIMES[0].plusSeconds(SECONDS_60),
                LIST_OF_END_TIMES[0].minusSeconds(SECONDS_60)),
            "SingleE1.w",
            280000,
            0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));

    return wfdiscDaos;
  }

  public static List<WfdiscDao> getTestWfdiscListForMultipleEnclosedE1() {
    List<WfdiscDao> wfdiscDaos = new ArrayList<>();
    var channel = getTestChannelE1();
    var wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(LIST_OF_START_TIMES[0], LIST_OF_END_TIMES[0]),
            FILE_FOR_MERGING1,
            NUM_SAMPLES_288_000,
            0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));
    wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(
                LIST_OF_START_TIMES[0].plusSeconds(SECONDS_60),
                LIST_OF_START_TIMES[0].plusSeconds(SECONDS_600)),
            FILE_FOR_MULTIPLE_E1,
            NUM_SAMPLES_44_000,
            0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));

    wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(LIST_OF_START_TIMES[3], LIST_OF_END_TIMES[2]),
            FILE_FOR_MERGING1,
            NUM_SAMPLES_288_000,
            0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));
    wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(
                LIST_OF_START_TIMES[3].plusSeconds(SECONDS_60),
                LIST_OF_START_TIMES[3].plusSeconds(SECONDS_600)),
            FILE_FOR_MULTIPLE_E1,
            NUM_SAMPLES_44_000,
            0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));

    return wfdiscDaos;
  }

  public static List<WfdiscDao> getTestWfdiscListWithBigDiffSampRate() {
    List<WfdiscDao> wfdiscDaos = new ArrayList<>();
    var channel = getTestChannelE1();

    var wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(LIST_OF_START_TIMES[0], LIST_OF_END_TIMES[0]),
            FILE_FOR_MERGING1,
            NUM_SAMPLES_288_000,
            0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));
    wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(LIST_OF_START_TIMES[1], LIST_OF_END_TIMES[1]),
            FILE_FOR_MERGING2,
            NUM_SAMPLES_288_000,
            0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_40, CALIB_RATE, DataType.E1, channel));

    return wfdiscDaos;
  }

  public static List<WfdiscDao> getTestWfdiscListWithSmallDiffSampRate() {
    List<WfdiscDao> wfdiscDaos = new ArrayList<>();
    var channel = getTestChannelE1();

    var wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(LIST_OF_START_TIMES[0], LIST_OF_END_TIMES[0]),
            FILE_FOR_MERGING1,
            NUM_SAMPLES_288_000,
            0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));
    wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(LIST_OF_START_TIMES[1], LIST_OF_END_TIMES[1]),
            FILE_FOR_MERGING2,
            NUM_SAMPLES_288_000,
            0L);

    wfdiscDaos.add(
        createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_99_50, CALIB_RATE, DataType.E1, channel));

    return wfdiscDaos;
  }

  public static List<WfdiscDao> getWfdiscListForPartialCombining() {
    List<WfdiscDao> wfdiscDaos = new ArrayList<>();
    var channel = getTestChannelE1();

    for (Instant startTime : LIST_OF_START_TIMES) {
      var wfdiscCreationVariables =
          new WfdiscCreationVariables(
              Range.openClosed(startTime, startTime.plus(Duration.ofMinutes(60L))),
              FILE_FOR_MERGING1,
              NUM_SAMPLES_288_000,
              0L);

      wfdiscDaos.add(
          createWfdisc(wfdiscCreationVariables, SAMPLE_RATE_100, CALIB_RATE, DataType.E1, channel));
    }
    return wfdiscDaos;
  }

  public static List<WfdiscDao> getTestWfdiscListForSingleE1() {

    var channel = getTestChannelE1();

    var wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(
                Instant.parse("1998-02-21T23:59:08.800Z"),
                Instant.parse("1998-02-22T01:59:17.760Z")),
            "SingleE1.w",
            NUM_SAMPLES_288_000,
            458656L);

    return List.of(
        createWfdisc(wfdiscCreationVariables, E1_S4_SAMP_RATE, E1_CALIB, DataType.E1, channel));
  }

  public static List<WfdiscDao> getTestWfdiscListForS4() {

    var channel = getTestChannelS4();

    var wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(
                Instant.parse("2010-05-21T13:38:20.800Z"),
                Instant.parse("2010-05-21T14:02:22.592Z")),
            "S4.w",
            59200,
            5612800L);

    return List.of(
        createWfdisc(wfdiscCreationVariables, E1_S4_SAMP_RATE, S4_CALIB, DataType.S4, channel));
  }

  public static List<WfdiscDao> getTestWfdiscListForI4() {

    var channel = getTestChannelI4F4S2();

    var wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(I4_F4_S2_START_TIME, I4_F4_S2_END_TIME),
            "I4.w",
            NUM_SAMPLES_1_061_096,
            0L);

    return List.of(
        createWfdisc(
            wfdiscCreationVariables, I4_F4_S2_SAMP_RATE, I4_F4_T4_S2_CALIB, DataType.I4, channel));
  }

  public static List<WfdiscDao> getTestWfdiscListForF4() {

    var channel = getTestChannelI4F4S2();

    var wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(I4_F4_S2_START_TIME, I4_F4_S2_END_TIME),
            "F4.w",
            NUM_SAMPLES_1_061_096,
            0L);

    return List.of(
        createWfdisc(
            wfdiscCreationVariables, I4_F4_S2_SAMP_RATE, I4_F4_T4_S2_CALIB, DataType.F4, channel));
  }

  public static List<WfdiscDao> getTestWfdiscListForT4() {

    var channel = getTestChannelT4();

    var wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(
                Instant.parse("1994-01-17T12:45:38.688Z"),
                Instant.parse("1994-01-17T13:50:05.312Z")),
            "T4.w",
            19291,
            0L);

    return List.of(
        createWfdisc(
            wfdiscCreationVariables, T4_SAMP_RATE, I4_F4_T4_S2_CALIB, DataType.T4, channel));
  }

  public static List<WfdiscDao> getTestWfdiscListForS3() {

    var channel = getTestChannelS3();

    var wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(
                Instant.parse("2004-12-25T23:59:53.856Z"),
                Instant.parse("2004-12-26T02:00:02.816Z")),
            "S3.w",
            NUM_SAMPLES_144_000,
            0L);

    return List.of(
        createWfdisc(wfdiscCreationVariables, S3_SAMP_RATE, S3_CALIB, DataType.S3, channel));
  }

  public static List<WfdiscDao> getTestWfdiscListForS2() {

    var channel = getTestChannelI4F4S2();

    var wfdiscCreationVariables =
        new WfdiscCreationVariables(
            Range.openClosed(I4_F4_S2_START_TIME, I4_F4_S2_END_TIME),
            "S2.w",
            NUM_SAMPLES_1_061_096,
            0L);

    return List.of(
        createWfdisc(
            wfdiscCreationVariables, I4_F4_S2_SAMP_RATE, I4_F4_T4_S2_CALIB, DataType.S2, channel));
  }

  public static ChannelSegment<Waveform> createChannelSegmentChannelSegmentDescriptor(
      ChannelSegmentDescriptor channelSegmentDescriptor, List<Waveform> waveforms) {

    var siteChanKey = StationDefinitionIdUtility.getCssKey(channelSegmentDescriptor.getChannel());
    Optional<ChannelTypes> channelTypesOptional =
        ChannelTypesParser.parseChannelTypes(siteChanKey.getChannelCode());

    Preconditions.checkState(
        channelTypesOptional.isPresent(), "Could not parse channel types for given channel");
    var channelTypes = channelTypesOptional.get();
    var units = Units.determineUnits(channelTypes.getDataType());

    // TODO (Other Work): Replace List.of() with ways of returning actual processing masks
    return ChannelSegment.from(channelSegmentDescriptor, units, waveforms, List.of(), Map.of());
  }

  public static ChannelSegment<Waveform> createChannelSegment(
      Channel channel, List<Waveform> waveforms, Instant creationTime) {

    var siteChanKey = StationDefinitionIdUtility.getCssKey(channel);
    Optional<ChannelTypes> channelTypesOptional =
        ChannelTypesParser.parseChannelTypes(siteChanKey.getChannelCode());

    Preconditions.checkState(
        channelTypesOptional.isPresent(), "Could not parse channel types for given channel");
    var channelTypes = channelTypesOptional.get();
    var units = Units.determineUnits(channelTypes.getDataType());

    // TODO (Other Work): Replace List.of() with ways of returning actual processing masks
    return ChannelSegment.from(channel, units, waveforms, creationTime, List.of(), Map.of());
  }

  public static ChannelSegment<Waveform> createChannelSegment(
      Channel channel, List<Waveform> waveforms) {
    return createChannelSegment(channel, waveforms, CREATION_INSTANT);
  }

  public static ChannelSegment<Waveform> createTestChannelSegmentWaveform() {
    var channel = CHANNEL_SEG_TEST;
    var units = CHANNEL_SEG_TEST.getUnits();
    var creationTime = CREATION_TIME;
    var series = WFS;
    var processingMasks = createTestProcessingMasks();

    var timeseriesType = series.iterator().next().getType();
    var sortedSeries = new ArrayList<>(series);
    Collections.sort(sortedSeries);
    final Range<Instant> timeRange = TimeseriesUtility.computeSpan(sortedSeries);

    return ChannelSegment.<Waveform>builder()
        .setId(
            ChannelSegmentDescriptor.from(
                channel, timeRange.lowerEndpoint(), timeRange.upperEndpoint(), creationTime))
        .setData(
            ChannelSegment.Data.<Waveform>builder()
                .setMaskedBy(processingMasks)
                .setUnits(units)
                .setTimeseriesType(timeseriesType)
                .setTimeseries(sortedSeries.stream().collect(Collectors.toList()))
                .setMissingInputChannels(Map.of(channel, List.of(timeRange)))
                .build())
        .build();
  }

  public static ChannelSegment<Timeseries> createTestChannelSegment() {
    var channel = CHANNEL_SEG_TEST;
    var units = CHANNEL_SEG_TEST.getUnits();
    var series = WFS;
    var creationTime = CREATION_TIME;
    var processingMasks = List.<ProcessingMask>of(); // empty list

    var timeseriesType = series.iterator().next().getType();
    var sortedSeries = new ArrayList<>(series);
    Collections.sort(sortedSeries);
    final Range<Instant> timeRange = TimeseriesUtility.computeSpan(sortedSeries);

    return ChannelSegment.builder()
        .setId(
            ChannelSegmentDescriptor.from(
                channel, timeRange.lowerEndpoint(), timeRange.upperEndpoint(), creationTime))
        .setData(
            ChannelSegment.Data.builder()
                .setMaskedBy(processingMasks)
                .setUnits(units)
                .setTimeseriesType(timeseriesType)
                .setTimeseries(sortedSeries.stream().collect(Collectors.toList()))
                .setMissingInputChannels(Map.of(channel.toEntityReference(), List.of(timeRange)))
                .build())
        .build();
  }

  public static Collection<ProcessingMask> createTestProcessingMasks() {
    var channel = CHANNEL;

    var pm1 =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM, List.of(channel), List.of());

    return List.of(pm1);
  }

  public static WfdiscDao createWfdisc(
      WfdiscCreationVariables wfdiscCreationVariables,
      double sampRate,
      double calib,
      DataType dataType,
      Channel channel) {

    var siteChanKey = StationDefinitionIdUtility.getCssKeyFromName(channel.getName());

    var wfdiscDao = new WfdiscDao();

    wfdiscDao.setId(WFDISC_DAO_ID);
    wfdiscDao.setStationCode(siteChanKey.getStationCode());
    wfdiscDao.setChannelCode(siteChanKey.getChannelCode());
    wfdiscDao.setTime(wfdiscCreationVariables.range().lowerEndpoint());
    wfdiscDao.setEndTime(wfdiscCreationVariables.range().upperEndpoint());
    wfdiscDao.setNsamp(wfdiscCreationVariables.numSamples());
    wfdiscDao.setSampRate(sampRate);
    wfdiscDao.setCalib(calib);
    wfdiscDao.setCalper(CALB_PER);
    wfdiscDao.setInsType(wfdiscDao.getInsType());
    wfdiscDao.setSegType(SegType.ORIGINAL);
    wfdiscDao.setDataType(dataType);
    wfdiscDao.setDir("/data/");
    wfdiscDao.setDfile(wfdiscCreationVariables.fileName());
    wfdiscDao.setFoff(wfdiscCreationVariables.fOff());
    wfdiscDao.setLoadDate(LOAD_DATE);

    return wfdiscDao;
  }
}
