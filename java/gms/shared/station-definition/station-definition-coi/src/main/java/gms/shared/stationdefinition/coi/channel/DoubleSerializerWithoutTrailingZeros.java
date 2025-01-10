package gms.shared.stationdefinition.coi.channel;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import java.io.IOException;

// this serializer removes trailing zeros (e.g. 2.0 is written 2) to match with typescript json
public class DoubleSerializerWithoutTrailingZeros extends JsonSerializer<Double> {

  @Override
  public void serialize(Double val, JsonGenerator jsonGen, SerializerProvider provider)
      throws IOException {

    var asInt = (int) Math.rint(val);

    if (asInt == val) {
      jsonGen.writeNumber(asInt);
    } else {
      jsonGen.writeNumber(val);
    }
  }
}
