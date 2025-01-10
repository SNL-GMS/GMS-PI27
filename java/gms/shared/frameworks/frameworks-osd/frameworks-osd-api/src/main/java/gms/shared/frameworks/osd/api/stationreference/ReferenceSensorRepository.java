package gms.shared.frameworks.osd.api.stationreference;

import gms.shared.frameworks.common.ContentType;
import gms.shared.frameworks.osd.coi.stationreference.ReferenceSensor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Interface for the endpoint that returns and stores {*link ReferenceSensor}s */
public interface ReferenceSensorRepository {

  /**
   * Retrieves Collection of {@link ReferenceSensor} objects corresponding to the list of sensor ids
   * passed in.
   *
   * @param sensorIds a list of the {@link Sensor} ids of interest
   * @return list of sensors; may be empty.
   */
  @Path("/station-reference/reference-sensors/sensor-id")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieve sensors corresponding to the list of sensor IDs passed in")
  List<ReferenceSensor> retrieveReferenceSensorsById(
      @RequestBody(description = "collection of sensor ids to retrieve")
          Collection<UUID> sensorIds);

  /**
   * Retrieves sensors by the channel they are associated with.
   *
   * @param channelNames the name of the channel whose reference sensors we are retrieving.
   * @return list of sensors; may be empty.
   */
  @Path("/station-reference/reference-sensors/channel-name")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(
      summary =
          "retrieve reference sensors corresponding to the collection of channel names"
              + " passed in")
  Map<String, List<ReferenceSensor>> retrieveSensorsByChannelName(
      @RequestBody(
              description =
                  "collection of channel names from which we retrieve reference sensors for")
          Collection<String> channelNames);

  /**
   * Stores a collection of {@link ReferenceSensor} objects
   *
   * @param sensors the sensors
   */
  @Path("/station-reference/reference-sensors/new")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "retrieve sensors corresponding to the list of sensor IDs passed in")
  void storeReferenceSensors(
      @RequestBody(description = "collection of reference sensor objects to store.")
          Collection<ReferenceSensor> sensors);
}
