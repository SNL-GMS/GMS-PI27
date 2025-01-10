package gms.shared.frameworks.osd.api.station;

import gms.shared.frameworks.common.ContentType;
import gms.shared.frameworks.osd.coi.signaldetection.Station;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import java.util.Collection;
import java.util.List;

/** Interface for the endpoint that returns and stores {*link Station}s */
public interface StationRepository {

  /**
   * Given a list of stationNames, this method will return those list of Stations. If an empty list
   * is provided, this method will retrieve and return all stations stored.
   *
   * @param stationNames - list of station names representing stations to retrieve. Can be empty if
   *     all stations are requested.
   * @return List of Station objects
   */
  @Path("/stations")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(
      description =
          "returns all stations specified by list of names or all stations if none is specified")
  List<Station> retrieveAllStations(
      @RequestBody(description = "list of station names to retrieve")
          Collection<String> stationNames);

  /**
   * Stores the given list of Station objects.
   *
   * @param stations - non-empty list of station objects.
   */
  @Path("/stations/store")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(
      description = "stores new stations if not present, otherwise updates existing stations")
  void storeStations(
      @RequestBody(description = "set of stations to store", required = true)
          Collection<Station> stations);
}
