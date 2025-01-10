package gms.shared.waveform.coi;

import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.randomSamples0To1;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import com.fasterxml.jackson.core.type.TypeReference;
import com.google.common.collect.Range;
import com.google.common.io.Files;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.utilities.test.JsonTestUtilities;
import gms.shared.waveform.coi.util.TimeseriesUtility;
import gms.shared.waveform.processingmask.coi.ProcessingMask;
import gms.shared.waveform.testfixture.ChannelSegmentTestFixtures;
import gms.shared.waveform.testfixture.ProcessingMaskTestFixtures;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/** Test {@link Waveform} creation and usage semantics. */
class ChannelSegmentTest {

  private final Timeseries.Type seriestype = Timeseries.Type.WAVEFORM;
  private static final Instant START = Instant.EPOCH;
  private static final Instant CREATION_TIME = START.minus(1, ChronoUnit.MINUTES);
  private static final Waveform EARLIER_WAVEFORM = Waveform.create(START, 1.0, new double[5]);
  private static final Waveform LATER_WAVEFORM =
      Waveform.create(START.plusSeconds(30), 1.0, new double[10]);
  private static final List<Waveform> WFS =
      List.of(LATER_WAVEFORM, EARLIER_WAVEFORM); // purposely in reverse time order
  private static final Pattern SPACE_REGEX_PATTERN =
      Pattern.compile("\\s", Pattern.UNICODE_CHARACTER_CLASS);

  @Test
  void testBuilderGood() {

    var channel = CHANNEL;
    var units = CHANNEL.getUnits();
    var series = WFS;
    var creationTime = CREATION_TIME;
    var processingMasks = List.<ProcessingMask>of(); // empty list

    var timeseriesType = series.iterator().next().getType();
    var sortedSeries = new ArrayList<>(series);
    Collections.sort(sortedSeries);
    final Range<Instant> timeRange = TimeseriesUtility.computeSpan(sortedSeries);

    var csBuilder =
        ChannelSegment.builder()
            .setId(
                ChannelSegmentDescriptor.from(
                    channel, timeRange.lowerEndpoint(), timeRange.upperEndpoint(), creationTime))
            .setData(
                ChannelSegment.Data.builder()
                    .setMaskedBy(processingMasks)
                    .setUnits(units)
                    .setTimeseriesType(timeseriesType)
                    .setTimeseries(sortedSeries.stream().collect(Collectors.toList()))
                    .setMissingInputChannels(Set.of())
                    .build());
    assertDoesNotThrow(
        () -> csBuilder.build(), "Builder threw exception when it should have been built");
  }

  @Test
  void testBuilderProcessingOperationMismatch() {

    var channel = CHANNEL;
    var units = CHANNEL.getUnits();
    var series = WFS;

    var timeseriesType = series.iterator().next().getType();
    var sortedSeries = new ArrayList<>(series);
    Collections.sort(sortedSeries);

    var pm1 =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.AMPLITUDE_MEASUREMENT_BEAM, List.of(channel), List.of());
    var pm2 =
        ProcessingMaskTestFixtures.getProcessingMask(
            ProcessingOperation.DISPLAY_FILTER, List.of(channel), List.of());

    var processingMasks = List.<ProcessingMask>of(pm1, pm2);

    var dataBuilder =
        ChannelSegment.Data.builder()
            .setMaskedBy(processingMasks)
            .setUnits(units)
            .setTimeseriesType(timeseriesType)
            .setTimeseries(sortedSeries.stream().collect(Collectors.toList()))
            .setMissingInputChannels(Set.of());

    var exceptionMessage = assertThrows(IllegalStateException.class, () -> dataBuilder.build());
    assertTrue(
        exceptionMessage
            .toString()
            .contains("Only 1 ProcessingOperation allowed per channel segment"),
        "Error Message did not contain proper text");
  }

  @Test
  void testFrom() {
    final ChannelSegment<Waveform> segment =
        ChannelSegment.from(CHANNEL, CHANNEL.getUnits(), WFS, CREATION_TIME, List.of(), Map.of());
    assertEquals(CHANNEL, segment.getId().getChannel());
    assertEquals(seriestype, segment.getTimeseriesType());
    assertEquals(EARLIER_WAVEFORM.getStartTime(), segment.getId().getStartTime());
    assertEquals(LATER_WAVEFORM.getEndTime(), segment.getId().getEndTime());
    // below: using set so order doesn't matter.  channel segment sorts it's series.
    assertEquals(new HashSet<>(WFS), new HashSet<>(segment.getTimeseries()));
  }

  @Test
  void testFromChannelSegmentDescriptor() {
    final ChannelSegmentDescriptor channelSegmentDescriptor =
        ChannelSegmentDescriptor.from(
            CHANNEL, EARLIER_WAVEFORM.getStartTime(), LATER_WAVEFORM.getEndTime(), CREATION_TIME);
    final ChannelSegment<Waveform> segment =
        ChannelSegment.from(
            channelSegmentDescriptor,
            CHANNEL.getUnits(),
            WFS,
            List.of(),
            Map.of()); // add processing mask data??
    assertEquals(CHANNEL, segment.getId().getChannel());
    assertEquals(seriestype, segment.getTimeseriesType());
    assertEquals(EARLIER_WAVEFORM.getStartTime(), segment.getId().getStartTime());
    assertEquals(LATER_WAVEFORM.getEndTime(), segment.getId().getEndTime());
    // below: using set so order doesn't matter.  channel segment sorts it's series.
    assertEquals(new HashSet<>(WFS), new HashSet<>(segment.getTimeseries()));
  }

  @ParameterizedTest
  @MethodSource("getFromArguments")
  void testFromValidation(
      Class<? extends Exception> expectedException,
      Channel channel,
      List<Waveform> waveforms,
      Instant creationTime) {
    assertThrows(
        expectedException,
        () ->
            ChannelSegment.from(
                channel, CHANNEL.getUnits(), waveforms, creationTime, List.of(), Map.of()));
  }

  static Stream<Arguments> getFromArguments() {
    return Stream.of(
        arguments(IllegalArgumentException.class, CHANNEL, List.of(), CREATION_TIME),
        arguments(
            NullPointerException.class,
            null,
            List.of(
                Waveform.create(START, 5.0, new double[50]),
                Waveform.create(START.plusSeconds(1), 100.0, new double[50])),
            CREATION_TIME),
        arguments(
            NullPointerException.class,
            CHANNEL,
            List.of(
                Waveform.create(START, 5.0, new double[50]),
                Waveform.create(START.plusSeconds(1), 100.0, new double[50])),
            null));
  }

  @ParameterizedTest
  @MethodSource("getFromChannelSegmentDescriptorArguments")
  void testFromChannelSegmentDescriptorValidation(
      Class<? extends Exception> expectedException,
      ChannelSegmentDescriptor channelSegmentDescriptor,
      List<Waveform> waveforms) {
    assertThrows(
        expectedException,
        () ->
            ChannelSegment.from(
                channelSegmentDescriptor, CHANNEL.getUnits(), waveforms, List.of(), Map.of()));
  }

  static Stream<Arguments> getFromChannelSegmentDescriptorArguments() {
    final ChannelSegmentDescriptor channelSegmentDescriptor =
        ChannelSegmentDescriptor.from(
            CHANNEL, EARLIER_WAVEFORM.getStartTime(), LATER_WAVEFORM.getEndTime(), CREATION_TIME);
    return Stream.of(
        arguments(NullPointerException.class, channelSegmentDescriptor, null),
        arguments(IllegalArgumentException.class, channelSegmentDescriptor, List.of()),
        arguments(
            NullPointerException.class,
            null,
            List.of(
                Waveform.create(START, 5.0, new double[50]),
                Waveform.create(START.plusSeconds(1), 100.0, new double[50]))));
  }

  @Test
  void testCompareExpectNegative() {
    final ChannelSegment<Waveform> segment1 =
        ChannelSegment.from(CHANNEL, CHANNEL.getUnits(), WFS, CREATION_TIME, List.of(), Map.of());

    final List<Waveform> wfs2 = List.of(Waveform.create(START.plusMillis(1), 1.0, new double[1]));
    final ChannelSegment<Waveform> segment2 =
        ChannelSegment.from(CHANNEL, CHANNEL.getUnits(), wfs2, CREATION_TIME, List.of(), Map.of());

    assertTrue(segment1.compareTo(segment2) < 0);
  }

  @Test
  void testCompareExpectPositive() {
    final List<Waveform> wfs2 = List.of(Waveform.create(START.plusMillis(1), 1.0, new double[1]));
    final ChannelSegment<Waveform> segment1 =
        ChannelSegment.from(CHANNEL, CHANNEL.getUnits(), wfs2, CREATION_TIME, List.of(), Map.of());

    final ChannelSegment<Waveform> segment2 =
        ChannelSegment.from(CHANNEL, CHANNEL.getUnits(), WFS, CREATION_TIME, List.of(), Map.of());

    assertTrue(segment1.compareTo(segment2) > 0);
  }

  @Test
  void testCompareEqualExpectEqual() {
    final ChannelSegment<Waveform> segment1 =
        ChannelSegment.from(CHANNEL, CHANNEL.getUnits(), WFS, CREATION_TIME, List.of(), Map.of());

    final ChannelSegment<Waveform> segment2 =
        ChannelSegment.from(CHANNEL, CHANNEL.getUnits(), WFS, CREATION_TIME, List.of(), Map.of());

    assertEquals(segment1, segment2);
  }

  @ParameterizedTest
  @MethodSource("getCompareEndTimeArguments")
  void testCompareToEndtime(
      int expected, ChannelSegment<Waveform> base, ChannelSegment<Waveform> other) {
    assertEquals(expected, base.compareTo(other));
  }

  static Stream<Arguments> getCompareEndTimeArguments() {
    Instant end1 = Instant.EPOCH.plusSeconds(10);
    Instant end2 = Instant.EPOCH.plusSeconds(15);
    ChannelSegment<Waveform> channelSegment1 =
        ChannelSegment.from(
            CHANNEL,
            CHANNEL.getUnits(),
            List.of(randomSamples0To1(Instant.EPOCH, end1, 2)),
            CREATION_TIME,
            List.of(),
            Map.of());
    ChannelSegment<Waveform> channelSegment2 =
        ChannelSegment.from(
            CHANNEL,
            CHANNEL.getUnits(),
            List.of(randomSamples0To1(Instant.EPOCH, end2, 2)),
            CREATION_TIME,
            List.of(),
            Map.of());
    return Stream.of(
        arguments(end1.compareTo(end2), channelSegment1, channelSegment2),
        arguments(end2.compareTo(end1), channelSegment2, channelSegment1, CREATION_TIME));
  }

  @Test
  void testSerialization() throws IOException {
    ChannelSegment<Timeseries> channelSegment =
        ChannelSegmentTestFixtures.createTestChannelSegment();

    JsonTestUtilities.assertSerializes(channelSegment, new TypeReference<>() {});
  }

  @Test
  void testSerializationIdOnly() {
    var channelSegment =
        ChannelSegment.builder()
            .setId(
                ChannelSegmentDescriptor.from(
                    Channel.createEntityReference("ChannelName"),
                    Instant.EPOCH,
                    Instant.ofEpochSecond(1),
                    Instant.EPOCH))
            .build();

    JsonTestUtilities.assertSerializes(channelSegment, ChannelSegment.class);
  }

  /**
   * Format json strings for comparing in tests
   *
   * @param jsonString - input json string to compare
   * @return json string
   */
  private String formatJsonString(String jsonString) {
    return SPACE_REGEX_PATTERN.matcher(jsonString).replaceAll("");
  }

  /**
   * Read in the json file as a string.
   *
   * @param file string file to read
   * @return String of file contents
   * @throws IOException
   */
  private String readFileAsString(String file) throws IOException {
    var url = this.getClass().getClassLoader().getResource(file);
    var fileObj = new File(url.getFile());
    List<String> lines = Files.readLines(fileObj, StandardCharsets.UTF_8);
    return String.join(System.lineSeparator(), lines);
  }
}
