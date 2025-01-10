package gms.shared.event.api;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.stationdefinition.coi.channel.ChannelBandType;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.Location;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.utilities.test.JsonTestUtilities;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class PredictFeaturesForEventLocationRequestTest {

  @Test
  void testSerializationEmpty() {

    var receiver = ReceiverLocationsAndTypes.from(Optional.empty(), Optional.empty(), Map.of());
    var request =
        PredictFeaturesForEventLocationRequest.from(
            EventTestFixtures.EVENT_LOCATION, List.of(), List.of(receiver));
    JsonTestUtilities.assertSerializes(request, PredictFeaturesForEventLocationRequest.class);
  }

  @Test
  void testSerialization() {

    var receiverMap = new HashMap<String, Location>();
    receiverMap.put("TestLocation", Location.from(100.0, 50.0, 50.0, 100.0));
    var receiver =
        ReceiverLocationsAndTypes.from(
            Optional.of(ChannelDataType.SEISMIC),
            Optional.of(ChannelBandType.EXTREMELY_LONG_PERIOD),
            receiverMap);
    var request =
        PredictFeaturesForEventLocationRequest.from(
            EventTestFixtures.EVENT_LOCATION, List.of(PhaseType.P), List.of(receiver));
    JsonTestUtilities.assertSerializes(request, PredictFeaturesForEventLocationRequest.class);
  }

  @Test
  @Disabled("Disabled so it doesn't run in the pipeline. Re-enable locally to generate dump")
  void testDumpMockPredictFeaturesForEventLocationRequest() throws IOException {
    var receiverMap = new HashMap<String, Location>();
    receiverMap.put("TestLocation", Location.from(100.0, 50.0, 50.0, 100.0));
    receiverMap.put("TestLocation_DiffName", Location.from(50.0, 50.0, 50.0, 50.0));
    var receiver =
        ReceiverLocationsAndTypes.from(
            Optional.of(ChannelDataType.SEISMIC),
            Optional.of(ChannelBandType.EXTREMELY_LONG_PERIOD),
            receiverMap);
    var receiverMap2 = new HashMap<String, Location>();
    receiverMap2.put("TestLocation2", Location.from(50.0, 50.0, 50.0, 50.0));

    var receiver2 =
        ReceiverLocationsAndTypes.from(
            Optional.of(ChannelDataType.SEISMIC),
            Optional.of(ChannelBandType.EXTREMELY_LONG_PERIOD),
            receiverMap2);
    var request =
        PredictFeaturesForEventLocationRequest.from(
            EventTestFixtures.EVENT_LOCATION, List.of(PhaseType.P), List.of(receiver, receiver2));
    try (FileOutputStream outputStream =
        new FileOutputStream("build/mock-events-for-even-location.json")) {
      assertDoesNotThrow(
          () ->
              outputStream.write(
                  ObjectMappers.jsonWriter()
                      .withDefaultPrettyPrinter()
                      .writeValueAsBytes(request)));
    }
  }
}
