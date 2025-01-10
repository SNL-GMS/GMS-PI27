package gms.testtools.mockwaveform;

import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChannelSegmentCreator {

  private final WaveformCreator waveformCreator;

  private ChannelSegmentCreator(WaveformCreator waveformCreator) {
    this.waveformCreator = waveformCreator;
  }

  public static ChannelSegmentCreator create(WaveformCreator waveformCreator) {
    Objects.requireNonNull(waveformCreator);
    return new ChannelSegmentCreator(waveformCreator);
  }

  public static final long WAVEFORM_NUM_HOURS = 2;
  private static final Duration WAVEFORM_DURATION = Duration.ofHours(WAVEFORM_NUM_HOURS);
  private static final Logger logger = LoggerFactory.getLogger(ChannelSegmentCreator.class);

  public List<ChannelSegment<Waveform>> getChannelSegments(
      Set<Channel> channels, Instant startTime, Instant stopTime) {

    Objects.requireNonNull(channels);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(stopTime);

    if (channels.isEmpty() || stopTime.isBefore(startTime)) {
      logger.warn(
          "Must provide non-empty list of channels and stoptime that is after start time,"
              + "returning empty list of channel segments");
      return Collections.emptyList();
    }

    var duration = Duration.between(startTime, stopTime);

    var numIntervals = duration.toHours() / WAVEFORM_NUM_HOURS;
    var remDuration = duration.minus(Duration.ofHours(WAVEFORM_NUM_HOURS * numIntervals));
    List<Range<Instant>> timeRanges = new ArrayList<>();
    var currentTimeInstant = startTime;

    for (var i = 0; i < numIntervals; i++) {
      timeRanges.add(
          Range.openClosed(currentTimeInstant, currentTimeInstant.plus(WAVEFORM_DURATION)));
      currentTimeInstant = currentTimeInstant.plus(WAVEFORM_DURATION);
    }

    if (remDuration.toMinutes() != 0) {
      timeRanges.add(Range.openClosed(currentTimeInstant, currentTimeInstant.plus(remDuration)));
    }

    return channels.stream()
        .map(
            channel -> {
              var initialPos = new SecureRandom().nextInt(waveformCreator.getsamplesLength());
              var waveformList = waveformCreator.getWaveforms(timeRanges, initialPos);

              if (channel.isPresent()) {
                return ChannelSegment.from(
                    channel, channel.getUnits(), waveformList, Instant.now(), List.of(), Map.of());
              }

              var siteChanKey = StationDefinitionIdUtility.getCssKey(channel);
              Optional<ChannelTypes> channelTypesOptional =
                  ChannelTypesParser.parseChannelTypes(siteChanKey.getChannelCode());

              Preconditions.checkState(
                  channelTypesOptional.isPresent(),
                  "Could not parse channel types for given channel");
              var channelTypes = channelTypesOptional.get();
              var units = Units.determineUnits(channelTypes.getDataType());

              return ChannelSegment.from(
                  channel, units, waveformList, Instant.now(), List.of(), Map.of());
            })
        .collect(Collectors.toList());
  }
}
