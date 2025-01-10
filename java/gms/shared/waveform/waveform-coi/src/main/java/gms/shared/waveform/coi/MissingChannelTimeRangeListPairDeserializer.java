package gms.shared.waveform.coi;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.google.common.collect.Range;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

/**
 * Custom deserializer for converting channel name objects and startTime/endTime objects the
 * deserialized MissingChannelTimeRangeListPair object
 *
 * <p>Channels are represented as EntityReferences</br> List of startTime/endTimes are represented
 * as a list of range instants
 */
public class MissingChannelTimeRangeListPairDeserializer
    extends StdDeserializer<MissingChannelTimeRangeListPair> {

  public MissingChannelTimeRangeListPairDeserializer() {
    this(null);
  }

  public MissingChannelTimeRangeListPairDeserializer(Class<?> vc) {
    super(vc);
  }

  @Override
  public MissingChannelTimeRangeListPair deserialize(JsonParser jp, DeserializationContext ctxt)
      throws IOException {

    // read in the json nodes using json parser
    JsonNode node = jp.getCodec().readTree(jp);
    var timeRangesJson = node.get("timeRanges");

    // loop through time range json and deserialize into a list of range instants
    List<Range<Instant>> timeRangeList =
        StreamSupport.stream(timeRangesJson.spliterator(), false)
            .flatMap(
                (JsonNode obj) -> {
                  var startTimeStr = obj.get("startTime").asText();
                  var endTimeStr = obj.get("endTime").asText();
                  var startTime = Instant.parse(startTimeStr);
                  var endTime = Instant.parse(endTimeStr);
                  return Stream.of(Range.closed(startTime, endTime));
                })
            .toList();

    // deserialize the channel object
    var channelJson = node.get("channel").toString();
    Channel channel = ObjectMappers.jsonMapper().readValue(channelJson, Channel.class);

    // Use the from() with converted values to create the deserialized class
    return new MissingChannelTimeRangeListPair(channel, timeRangeList);
  }
}
