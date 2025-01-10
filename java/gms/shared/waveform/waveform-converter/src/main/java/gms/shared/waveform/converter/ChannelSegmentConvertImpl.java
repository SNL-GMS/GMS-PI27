package gms.shared.waveform.converter;

import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.utilities.logging.TimingLogger;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.coi.util.TimeseriesUtility;
import gms.shared.waveform.coi.util.WaveformUtility;
import gms.utilities.waveformreader.DefaultWaveformReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class ChannelSegmentConvertImpl implements ChannelSegmentConverter {

  /**
   * creates and validates a new {@link ChannelSegmentConvertImpl}
   *
   * @return a {@link ChannelSegmentConvertImpl}
   */
  private static final Logger LOGGER = LoggerFactory.getLogger(ChannelSegmentConvertImpl.class);

  private static final TimingLogger<Optional<Waveform>> timingLogger = TimingLogger.create(LOGGER);

  @Autowired private Environment environment;

  private static final double NANO_SECOND_PER_SECOND = 1e9;

  private static final double SAMPLE_DIFF_ALLOWED = 1.5;

  /**
   * Converts a Channel a list of WfdiscDao and File pairs into a {@link ChannelSegment<Waveform>}
   *
   * @param channel The channel corresponding to the wfdiscDaos
   * @param wfdiscDaos a list of WfdiscDaos
   * @param startTime defines the time range of interest
   * @param endTime defines the time range of interest
   * @return A ChannelSegment representing the provided channel, wfdisDaos, and .w files
   */
  @Override
  public ChannelSegment<Waveform> convert(
      Channel channel, List<WfdiscDao> wfdiscDaos, Instant startTime, Instant endTime) {

    Objects.requireNonNull(channel);
    Objects.requireNonNull(wfdiscDaos);

    if (wfdiscDaos.isEmpty()) {
      LOGGER.warn("List of wfdiscs and files is empty, returning null ChannelSegment");
      return null;
    }

    List<Waveform> waveforms = readWaveforms(wfdiscDaos, channel, startTime, endTime);

    if (waveforms.isEmpty()) {
      return null;
    }

    var units = getUnits(channel);
    Collections.sort(waveforms);

    final Range<Instant> timeRange = TimeseriesUtility.computeSpan(waveforms);

    return ChannelSegment.from(
        channel, units, waveforms, timeRange.lowerEndpoint(), List.of(), Map.of());
  }

  /**
   * Converts a Channel a list of WfdiscDao and File pairs into a {@link ChannelSegment<Waveform>}
   *
   * @param channelSegmentDescriptor The channel segment descriptor corresponding to the channel
   *     segment
   * @param wfdiscDaos a list of WfdiscDaos
   * @return A ChannelSegment representing the provided channelSegmentDescriptor, wfdisDaos, and .w
   *     files
   */
  public ChannelSegment<Waveform> convert(
      ChannelSegmentDescriptor channelSegmentDescriptor, List<WfdiscDao> wfdiscDaos) {

    Objects.requireNonNull(channelSegmentDescriptor);
    Objects.requireNonNull(wfdiscDaos);

    if (wfdiscDaos.isEmpty()) {
      LOGGER.warn("List of wfdiscs and files is empty, returning null ChannelSegment");
      return null;
    }

    var channel = channelSegmentDescriptor.getChannel();
    var startTime = channelSegmentDescriptor.getStartTime();
    var endTime = channelSegmentDescriptor.getEndTime();

    List<Waveform> waveformList = readWaveforms(wfdiscDaos, channel, startTime, endTime);

    if (waveformList.isEmpty()) {
      return null;
    }
    var units = getUnits(channel);
    Collections.sort(waveformList);

    return ChannelSegment.from(channelSegmentDescriptor, units, waveformList, List.of(), Map.of());
  }

  private List<Waveform> readWaveforms(
      List<WfdiscDao> wfdiscDaos, Channel channel, Instant startTime, Instant endTime) {
    return WaveformUtility.mergeWaveforms(
        wfdiscDaos.stream()
            .map(
                wfdiscDao ->
                    timingLogger.apply(
                        "readWaveform",
                        () -> tryReadWaveform(wfdiscDao, channel, startTime, endTime),
                        environment.getActiveProfiles()))
            .flatMap(Optional::stream)
            .toList(),
        1,
        SAMPLE_DIFF_ALLOWED);
  }

  private static Optional<Waveform> tryReadWaveform(
      WfdiscDao wfdiscDao, Channel channel, Instant startTime, Instant endTime) {
    try {
      return Optional.of(readWaveform(wfdiscDao, channel, startTime, endTime));
    } catch (IOException | IllegalArgumentException | IllegalStateException e) {
      LOGGER.warn(
          "Unable to process Waveform for Wfdisc {} using file: {}",
          wfdiscDao.getId(),
          getWfDiscFile(wfdiscDao),
          e);
      return Optional.empty();
    }
  }

  /**
   * readWaveforms from a file, producing multiple waveforms if the file contains more data than a
   * single double array can hold
   *
   * @return single Waveform object
   */
  private static Waveform readWaveform(
      WfdiscDao wfdiscDao, Channel channel, Instant startTime, Instant endTime) throws IOException {

    Instant wfdiscStartTime = wfdiscDao.getTime();
    Instant wfdiscEndTime = wfdiscDao.getEndTime();
    double sampRateSeconds = wfdiscDao.getSampRate();
    var dataType = wfdiscDao.getDataType();
    int nsamp = wfdiscDao.getNsamp();
    long foff = wfdiscDao.getFoff();

    Instant readingStartTime = startTime.isBefore(wfdiscStartTime) ? wfdiscStartTime : startTime;
    Instant readingEndTime = endTime.isAfter(wfdiscEndTime) ? wfdiscEndTime : endTime;
    long readingDurationNano = Duration.between(readingStartTime, readingEndTime).toNanos();
    long expectedSamplesToRead =
        ((long) (readingDurationNano / NANO_SECOND_PER_SECOND * sampRateSeconds)) + 1;
    long actualSamplesToRead = Math.min(nsamp, expectedSamplesToRead);

    long skipNanos =
        !startTime.isAfter(wfdiscStartTime)
            ? 0
            : Duration.between(wfdiscStartTime, startTime).toNanos();
    long currentSkip = (long) (skipNanos / NANO_SECOND_PER_SECOND * sampRateSeconds);

    var file = getWfDiscFile(wfdiscDao);
    try (InputStream inputStream = new FileInputStream(file)) {
      LOGGER.info("Reading waveform for {}", channel.getName());
      LOGGER.info(
          "Start: {}, End: {}, skip: {}, num samples: {}",
          wfdiscStartTime,
          wfdiscEndTime,
          currentSkip,
          nsamp);
      double[] data =
          DefaultWaveformReader.readSamples(
              inputStream, dataType.toString(), (int) actualSamplesToRead, foff, (int) currentSkip);
      double calibration = wfdiscDao.getCalib();
      for (var i = 0; i < data.length; i++) {
        data[i] *= calibration;
      }

      return Waveform.create(readingStartTime, sampRateSeconds, data);
    }
  }

  private static File getWfDiscFile(WfdiscDao wfdiscDao) {
    return new File(wfdiscDao.getDir() + File.separator + wfdiscDao.getDfile());
  }

  private static Units getUnits(Channel channel) {
    var siteChanKey = StationDefinitionIdUtility.getCssKey(channel);
    Optional<ChannelTypes> channelTypesOptional =
        ChannelTypesParser.parseChannelTypes(siteChanKey.getChannelCode());

    Preconditions.checkState(
        channelTypesOptional.isPresent(), "Could not parse channel types for given channel");
    var channelTypes = channelTypesOptional.get();

    return Units.determineUnits(channelTypes.getDataType());
  }
}
