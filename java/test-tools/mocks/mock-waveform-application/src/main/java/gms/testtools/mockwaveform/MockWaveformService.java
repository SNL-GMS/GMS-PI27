package gms.testtools.mockwaveform;

import gms.shared.frameworks.common.ContentType;
import gms.shared.frameworks.common.annotations.Component;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import java.util.Collection;

@Component("mock-waveform")
@Path("/waveform-manager-service/waveform")
public interface MockWaveformService {
  @Path("/channel-segment/query/channel-timerange")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(summary = "Loads and returns ChannelSegment<Waveform> based on channel and time range")
  Collection<ChannelSegment<Waveform>> findWaveformsByChannelsAndTimeRange(
      @RequestBody(
              description =
                  "List of channels and time range used to query ChannelSegment<Waveform>")
          ChannelTimeRangeRequest channelTimeRangeRequest);
}
