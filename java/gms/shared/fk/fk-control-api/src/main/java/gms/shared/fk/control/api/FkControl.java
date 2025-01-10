package gms.shared.fk.control.api;

import gms.shared.frameworks.common.annotations.Component;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.FkSpectra;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;

/** Interface for the FK control class, its claim check, and its streaming commands */
@Component("fk-control")
@Path("/fk-control-service")
public interface FkControl {

  /**
   * Computes FKs per a given request and returns them
   *
   * @param request the {@link FkStreamingRequest}
   * @return the {@link FkSpectra} {@link ChannelSegment}
   */
  @POST
  @Path("/spectra/interactive")
  @Operation(description = "Compute FK's per the given request and return them")
  ChannelSegment<FkSpectra> handleRequest(
      @RequestBody(description = "The request") FkStreamingRequest request);
}
