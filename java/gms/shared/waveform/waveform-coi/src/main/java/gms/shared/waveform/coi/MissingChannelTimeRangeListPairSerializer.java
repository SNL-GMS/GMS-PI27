package gms.shared.waveform.coi;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import com.google.common.collect.Range;
import java.io.IOException;
import java.time.Instant;

/**
 * Custom serializer for missing channel timerange list pairs to missing input channels
 *
 * <p>Channels are represented as EntityReferences (eg. name)</br> List of time ranges are
 * represented as lists of startTime/endTime objects
 */
public class MissingChannelTimeRangeListPairSerializer
    extends StdSerializer<MissingChannelTimeRangeListPair> {

  public MissingChannelTimeRangeListPairSerializer() {
    this(MissingChannelTimeRangeListPair.class);
  }

  public MissingChannelTimeRangeListPairSerializer(Class<MissingChannelTimeRangeListPair> clazz) {
    super(clazz);
  }

  @Override
  public void serialize(
      MissingChannelTimeRangeListPair pairClass,
      JsonGenerator generator,
      SerializerProvider provider)
      throws IOException {
    // first serialize the channel entity object
    generator.writeStartObject();
    generator.writeObjectField("channel", pairClass.channel().toEntityReference());

    // loop through time ranges and serialize custom time range array
    generator.writeFieldName("timeRanges");
    generator.writeStartArray();
    for (Range<Instant> range : pairClass.timeRanges()) {
      var startTime = range.lowerEndpoint();
      var endTime = range.upperEndpoint();
      generator.writeStartObject();
      generator.writeStringField("startTime", startTime.toString());
      generator.writeStringField("endTime", endTime.toString());
      generator.writeEndObject();
    }
    generator.writeEndArray();
    generator.writeEndObject();
  }
}
