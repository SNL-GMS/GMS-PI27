package gms.shared.waveform.coi;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.common.collect.Range;
import gms.shared.stationdefinition.coi.channel.Channel;
import java.time.Instant;
import java.util.List;

/** Record containing missing input channels with time range list */
@JsonSerialize(using = MissingChannelTimeRangeListPairSerializer.class)
@JsonDeserialize(using = MissingChannelTimeRangeListPairDeserializer.class)
public record MissingChannelTimeRangeListPair(Channel channel, List<Range<Instant>> timeRanges) {}
