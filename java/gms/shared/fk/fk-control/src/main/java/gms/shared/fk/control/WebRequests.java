package gms.shared.fk.control;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.api.station.util.StationsTimeFacetRequest;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.io.IOException;
import java.util.List;
import java.util.Objects;
import org.apache.http.client.HttpResponseException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Utility for managing web requests needed for the FK Control */
public final class WebRequests {

  private static final Logger LOGGER = LoggerFactory.getLogger(WebRequests.class);

  private static final String APPLICATION_JSON = "application/json";
  private static final String CONTENT_TYPE_HEADER = "Content-Type";
  private static final String ACCEPT_HEADER = "Accept";
  private static final int STATUS_OK = 200;

  private final String stationUrl;
  private final String waveformUrl;
  private final ObjectMapper objectMapper;

  private WebRequests(String stationUrl, String waveformUrl, ObjectMapper objectMapper) {
    this.stationUrl = stationUrl;
    this.waveformUrl = waveformUrl;
    this.objectMapper = objectMapper;
  }

  public static WebRequests create(
      String stationUrl, String waveformUrl, ObjectMapper objectMapper) {
    Objects.requireNonNull(stationUrl, "Cannot create WebRequests from null stationUrl");
    Objects.requireNonNull(waveformUrl, "Cannot create WebRequests from null waveformUrl");
    Objects.requireNonNull(objectMapper, "Cannot create WebRequests from null objectMapper");
    Preconditions.checkArgument(
        !stationUrl.isBlank(), "Cannot create WebRequests from blank stationUrl");
    Preconditions.checkArgument(
        !waveformUrl.isBlank(), "Cannot create WebRequests from blank waveformUrl");

    return new WebRequests(stationUrl, waveformUrl, objectMapper);
  }

  public List<Station> stationDefinitionStationRequest(StationsTimeFacetRequest request)
      throws IOException {
    Objects.requireNonNull(request, "Cannot request stations from null StationTimeFacetRequest");

    try (CloseableHttpClient client = HttpClients.createDefault()) {
      LOGGER.info("Requesting stations from {}", stationUrl);
      var post = new HttpPost(stationUrl);
      post.setHeader(ACCEPT_HEADER, APPLICATION_JSON);
      post.setHeader(CONTENT_TYPE_HEADER, APPLICATION_JSON);

      var jsonRequest = objectMapper.writeValueAsString(request);
      post.setEntity(new StringEntity(jsonRequest));

      CloseableHttpResponse response = client.execute(post);
      if (response.getStatusLine().getStatusCode() == STATUS_OK) {
        var typeFactory = objectMapper.getTypeFactory();
        JavaType stationListType = typeFactory.constructCollectionType(List.class, Station.class);
        try (var content = response.getEntity().getContent()) {
          return objectMapper.readValue(content, stationListType);
        }
      } else {
        throw new HttpResponseException(
            response.getStatusLine().getStatusCode(), response.getStatusLine().getReasonPhrase());
      }
    }
  }

  public List<ChannelSegment<Waveform>> waveformRequest(ChannelTimeRangeRequest request)
      throws IOException {
    Objects.requireNonNull(
        request, "Cannot request channel segments from null ChannelTimeRangeRequest");

    try (CloseableHttpClient client = HttpClients.createDefault()) {
      LOGGER.info("requesting waveforms from {}", waveformUrl);
      var post = new HttpPost(waveformUrl);
      post.setHeader(ACCEPT_HEADER, APPLICATION_JSON);
      post.setHeader(CONTENT_TYPE_HEADER, APPLICATION_JSON);

      var jsonRequest = objectMapper.writeValueAsString(request);
      post.setEntity(new StringEntity(jsonRequest));

      CloseableHttpResponse response = client.execute(post);
      if (response.getStatusLine().getStatusCode() == STATUS_OK) {
        var typeFactory = objectMapper.getTypeFactory();
        JavaType channelSegmentType =
            typeFactory.constructParametricType(ChannelSegment.class, Waveform.class);
        JavaType channelSegmentListType =
            typeFactory.constructCollectionType(List.class, channelSegmentType);
        try (var content = response.getEntity().getContent()) {
          return objectMapper.readValue(content, channelSegmentListType);
        }
      } else {
        throw new HttpResponseException(
            response.getStatusLine().getStatusCode(), response.getStatusLine().getReasonPhrase());
      }
    }
  }
}
