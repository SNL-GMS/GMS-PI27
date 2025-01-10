package gms.shared.fk.control;

import static gms.shared.fk.control.WebRequests.create;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_CHANNELS;
import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_CHANNEL_SEGMENTS;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.stationdefinition.api.station.util.StationsTimeFacetRequest;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import org.apache.http.HttpEntity;
import org.apache.http.StatusLine;
import org.apache.http.client.HttpResponseException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WebRequestsTest {

  @Mock private CloseableHttpClient mockHttpClient;

  @Mock private CloseableHttpResponse mockHttpResponse;

  @Mock private StatusLine mockStatusLine;

  @Mock private HttpEntity mockEntity;

  private ObjectMapper objectMapper;
  private WebRequests webRequests;

  private StationsTimeFacetRequest stationsRequest =
      StationsTimeFacetRequest.builder()
          .setEffectiveTime(Instant.EPOCH)
          .setStationNames(List.of("Example Station"))
          .build();

  private ChannelTimeRangeRequest waveformRequest =
      ChannelTimeRangeRequest.builder()
          .setChannels(Set.copyOf(BASE_CHANNELS))
          .setStartTime(Instant.EPOCH)
          .setEndTime(Instant.EPOCH.plusSeconds(600))
          .build();

  @BeforeEach
  void setup() {
    objectMapper = ObjectMappers.jsonMapper();
    webRequests = create("testStationDefinition", "testWaveform", objectMapper);
  }

  @ParameterizedTest
  @MethodSource("getCreateArguments")
  void testCreateValidation(
      Class<? extends Exception> expectedException,
      String expectedMessage,
      String stationUrl,
      String waveformUrl,
      ObjectMapper objectMapper) {

    Exception ex =
        assertThrows(
            expectedException, () -> webRequests.create(stationUrl, waveformUrl, objectMapper));
    assertEquals(expectedMessage, ex.getMessage());
  }

  static Stream<Arguments> getCreateArguments() {
    return Stream.of(
        arguments(
            NullPointerException.class,
            "Cannot create WebRequests from null stationUrl",
            null,
            "testWaveform",
            mock(ObjectMapper.class)),
        arguments(
            NullPointerException.class,
            "Cannot create WebRequests from null waveformUrl",
            "testStationDefinition",
            null,
            mock(ObjectMapper.class)),
        arguments(
            NullPointerException.class,
            "Cannot create WebRequests from null objectMapper",
            "testStationDefinition",
            "testWaveform",
            null),
        arguments(
            IllegalArgumentException.class,
            "Cannot create WebRequests from blank stationUrl",
            "",
            "testWaveform",
            mock(ObjectMapper.class)),
        arguments(
            IllegalArgumentException.class,
            "Cannot create WebRequests from blank waveformUrl",
            "testStationDefinition",
            "",
            mock(ObjectMapper.class)));
  }

  @Test
  void testCreate() {
    WebRequests requests =
        assertDoesNotThrow(
            () ->
                webRequests.create(
                    "testStationDefinition", "testWaveform", mock(ObjectMapper.class)));
    assertNotNull(requests);
  }

  @Test
  void testStationDefinitionStationRequestValidation() {
    Exception ex =
        assertThrows(
            NullPointerException.class, () -> webRequests.stationDefinitionStationRequest(null));
    assertEquals("Cannot request stations from null StationTimeFacetRequest", ex.getMessage());
  }

  @Test
  void testStationDefinitionStationRequestSuccessful() throws IOException {
    try (MockedStatic<HttpClients> mockHttpClients = mockStatic(HttpClients.class)) {
      mockHttpClients.when(HttpClients::createDefault).thenReturn(mockHttpClient);
      when(mockHttpClient.execute(any(HttpPost.class))).thenReturn(mockHttpResponse);
      when(mockHttpResponse.getStatusLine()).thenReturn(mockStatusLine);
      when(mockStatusLine.getStatusCode()).thenReturn(200);
      when(mockHttpResponse.getEntity()).thenReturn(mockEntity);
      when(mockEntity.getContent())
          .thenReturn(new ByteArrayInputStream(objectMapper.writeValueAsBytes(List.of(STATION))));

      List<Station> stations = webRequests.stationDefinitionStationRequest(stationsRequest);
      assertEquals(List.of(STATION), stations);

      mockHttpClients.verify(() -> HttpClients.createDefault(), times(1));
      mockHttpClients.verifyNoMoreInteractions();

      verify(mockHttpClient, times(1)).execute(any(HttpPost.class));
      verify(mockHttpResponse, times(1)).getStatusLine();
      verify(mockStatusLine, times(1)).getStatusCode();
      verify(mockHttpResponse, times(1)).getEntity();
      verify(mockEntity, times(1)).getContent();
      verify(mockHttpClient, times(1)).close();
      verifyNoMoreInteractions(mockHttpClient, mockHttpResponse, mockStatusLine, mockEntity);
    }
  }

  @Test
  void testStationDefinitionStationRequestFailure() throws IOException {
    try (MockedStatic<HttpClients> mockHttpClients = mockStatic(HttpClients.class)) {
      mockHttpClients.when(HttpClients::createDefault).thenReturn(mockHttpClient);
      when(mockHttpClient.execute(any(HttpPost.class))).thenReturn(mockHttpResponse);
      when(mockHttpResponse.getStatusLine()).thenReturn(mockStatusLine);
      when(mockStatusLine.getStatusCode()).thenReturn(503);
      when(mockStatusLine.getReasonPhrase()).thenReturn("sporadic failure");

      HttpResponseException ex =
          assertThrows(
              HttpResponseException.class,
              () -> webRequests.stationDefinitionStationRequest(stationsRequest));
      assertEquals("sporadic failure", ex.getReasonPhrase());
      assertEquals(503, ex.getStatusCode());

      mockHttpClients.verify(() -> HttpClients.createDefault(), times(1));
      mockHttpClients.verifyNoMoreInteractions();

      verify(mockHttpClient, times(1)).execute(any(HttpPost.class));
      verify(mockHttpResponse, times(3)).getStatusLine();
      verify(mockStatusLine, times(2)).getStatusCode();
      verify(mockStatusLine, times(1)).getReasonPhrase();
      verify(mockHttpClient, times(1)).close();
      verifyNoInteractions(mockEntity);
      verifyNoMoreInteractions(mockHttpClient, mockHttpResponse, mockStatusLine);
    }
  }

  @Test
  void testWaveformRequestValidation() throws IOException {
    Exception ex =
        assertThrows(NullPointerException.class, () -> webRequests.waveformRequest(null));
    assertEquals(
        "Cannot request channel segments from null ChannelTimeRangeRequest", ex.getMessage());
  }

  @Test
  void testWaveformRequestSuccess() throws IOException {
    try (MockedStatic<HttpClients> mockHttpClients = mockStatic(HttpClients.class)) {
      mockHttpClients.when(HttpClients::createDefault).thenReturn(mockHttpClient);
      when(mockHttpClient.execute(any(HttpPost.class))).thenReturn(mockHttpResponse);
      when(mockHttpResponse.getStatusLine()).thenReturn(mockStatusLine);
      when(mockStatusLine.getStatusCode()).thenReturn(200);
      when(mockHttpResponse.getEntity()).thenReturn(mockEntity);
      when(mockEntity.getContent())
          .thenReturn(
              new ByteArrayInputStream(objectMapper.writeValueAsBytes(BASE_CHANNEL_SEGMENTS)));

      List<ChannelSegment<Waveform>> channelSegments = webRequests.waveformRequest(waveformRequest);
      assertEquals(BASE_CHANNEL_SEGMENTS, channelSegments);

      mockHttpClients.verify(() -> HttpClients.createDefault(), times(1));
      mockHttpClients.verifyNoMoreInteractions();

      verify(mockHttpClient, times(1)).execute(any(HttpPost.class));
      verify(mockHttpResponse, times(1)).getStatusLine();
      verify(mockStatusLine, times(1)).getStatusCode();
      verify(mockHttpResponse, times(1)).getEntity();
      verify(mockEntity, times(1)).getContent();
      verify(mockHttpClient, times(1)).close();
      verifyNoMoreInteractions(mockHttpClient, mockHttpResponse, mockStatusLine, mockEntity);
    }
  }

  @Test
  void testWaveformRequestFailure() throws IOException {
    try (MockedStatic<HttpClients> mockHttpClients = mockStatic(HttpClients.class)) {
      mockHttpClients.when(HttpClients::createDefault).thenReturn(mockHttpClient);
      when(mockHttpClient.execute(any(HttpPost.class))).thenReturn(mockHttpResponse);
      when(mockHttpResponse.getStatusLine()).thenReturn(mockStatusLine);
      when(mockStatusLine.getStatusCode()).thenReturn(503);
      when(mockStatusLine.getReasonPhrase()).thenReturn("sporadic failure");

      HttpResponseException ex =
          assertThrows(
              HttpResponseException.class, () -> webRequests.waveformRequest(waveformRequest));
      assertEquals("sporadic failure", ex.getReasonPhrase());
      assertEquals(503, ex.getStatusCode());

      mockHttpClients.verify(() -> HttpClients.createDefault(), times(1));
      mockHttpClients.verifyNoMoreInteractions();

      verify(mockHttpClient, times(1)).execute(any(HttpPost.class));
      verify(mockHttpResponse, times(3)).getStatusLine();
      verify(mockStatusLine, times(2)).getStatusCode();
      verify(mockStatusLine, times(1)).getReasonPhrase();
      verify(mockHttpClient, times(1)).close();
      verifyNoInteractions(mockEntity);
      verifyNoMoreInteractions(mockHttpClient, mockHttpResponse, mockStatusLine);
    }
  }
}
