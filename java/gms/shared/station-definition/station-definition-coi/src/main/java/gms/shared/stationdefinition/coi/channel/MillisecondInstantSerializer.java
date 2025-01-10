package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.datatype.jsr310.ser.InstantSerializer;
import java.time.format.DateTimeFormatterBuilder;

// this serializer ensures a milisecond precision to match with typescript json
public class MillisecondInstantSerializer extends InstantSerializer {

  private static final int NUM_DIGITS = 3;

  public MillisecondInstantSerializer() {
    super(
        InstantSerializer.INSTANCE,
        false,
        false,
        new DateTimeFormatterBuilder().appendInstant(NUM_DIGITS).toFormatter());
  }
}
