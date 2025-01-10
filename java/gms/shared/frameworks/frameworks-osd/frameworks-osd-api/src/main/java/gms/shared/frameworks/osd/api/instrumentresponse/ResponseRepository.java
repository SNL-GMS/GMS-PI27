package gms.shared.frameworks.osd.api.instrumentresponse;

import gms.shared.frameworks.common.ContentType;
import gms.shared.frameworks.osd.coi.signaldetection.Response;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import java.util.Collection;
import java.util.Map;
import java.util.Set;

/** Interface for the endpoint that provides and stores Instrument {@link Response}s */
public interface ResponseRepository {

  /**
   * Returns a list of Instrument {@link Response}s based on {@link Channel} names
   *
   * @param channelNames the channel names of interest
   * @return a list of Instrument {@link Response}s
   */
  @Path("/instrument-response/by-chans")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "Retrieve Responses by channels")
  Map<String, Response> retrieveResponsesByChannels(
      @RequestBody(description = "Channel names") Set<String> channelNames);

  /**
   * Stores a collection of Instrument {@link Response}s
   *
   * @param responses the collection of Instrument {@link Response}s to store
   */
  @Path("/instrument-response/new")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "Store Responses")
  void storeResponses(Collection<Response> responses);
}
