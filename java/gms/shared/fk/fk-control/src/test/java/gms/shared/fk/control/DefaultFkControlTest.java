package gms.shared.fk.control;

import static gms.shared.fk.control.DefaultFkControl.CHANNEL_SEGMENT_FACETING_DEFINITION;
import static gms.shared.fk.testfixtures.FkTestFixtures.DEFINITION;
import static gms.shared.fk.testfixtures.FkTestFixtures.REQUEST;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.CHANNEL;
import static gms.shared.stationdefinition.testfixtures.UtilsTestFixtures.STATION;
import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_CHANNELS;
import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_CHANNEL_SEGMENTS;
import static gms.shared.waveform.testfixture.FkTestFixtures.BASE_FKS;
import static gms.shared.waveform.testfixture.FkTestFixtures.FK_CHANNEL;
import static gms.shared.waveform.testfixture.WaveformTestFixtures.CHANNEL_SEGMENT;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.fk.control.configuration.FkConfiguration;
import gms.shared.fk.control.exception.FkControlException;
import gms.shared.fk.plugin.fkattributes.FkAttributesPlugin;
import gms.shared.fk.plugin.fkspectra.FkSpectraPlugin;
import gms.shared.fk.plugin.util.FkSpectraInfo;
import gms.shared.fk.pluginregistry.PluginRegistry;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.stationdefinition.api.station.util.StationsTimeFacetRequest;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.repository.util.ChannelFactory;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.FkAttributes;
import gms.shared.waveform.coi.FkSpectra;
import gms.shared.waveform.coi.Waveform;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.apache.http.client.HttpResponseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DefaultFkControlTest {

  private static final ChannelTimeRangeRequest waveformRequest =
      ChannelTimeRangeRequest.builder()
          .setChannels(Set.copyOf(BASE_CHANNELS))
          .setStartTime(REQUEST.getStartTime())
          .setEndTime(
              REQUEST
                  .getStartTime()
                  .plusNanos(
                      (long)
                          ((1.0 / REQUEST.getSampleRate()) * 1E9 * (REQUEST.getSampleCount() - 1)))
                  .plus(REQUEST.getWindowLength()))
          .setFacetingDefinition(CHANNEL_SEGMENT_FACETING_DEFINITION)
          .build();

  private static final StationsTimeFacetRequest stationRequest =
      StationsTimeFacetRequest.builder()
          .setStationNames(List.of(STATION.getName()))
          .setEffectiveTime(REQUEST.getStartTime())
          .build();

  @Mock private ControlContext controlContext;

  @Mock private PluginRegistry pluginRegistry;

  @Mock private WebRequests webRequests;

  @Mock private ConfigurationConsumerUtility configurationConsumerUtility;

  @Mock private FkSpectraPlugin fkSpectraPlugin;

  @Mock private FkAttributesPlugin fkAttributesPlugin;

  private DefaultFkControl fkControl;

  @BeforeEach
  void testSetup() {
    fkControl =
        DefaultFkControl.create(
            pluginRegistry, FkConfiguration.create(configurationConsumerUtility), webRequests);
  }

  @Test
  void testCreateValidation() {
    NullPointerException ex =
        assertThrows(NullPointerException.class, () -> DefaultFkControl.create(null));
    assertEquals("Cannot create FkControl from null ControlContext", ex.getMessage());
  }

  @Test
  void testCreate() {
    when(controlContext.getProcessingConfigurationConsumerUtility())
        .thenReturn(configurationConsumerUtility);

    DefaultFkControl fkControl = assertDoesNotThrow(() -> DefaultFkControl.create(controlContext));
    assertNotNull(fkControl);

    verify(controlContext, times(1)).getProcessingConfigurationConsumerUtility();
    verifyNoMoreInteractions(controlContext);
    verifyNoInteractions(pluginRegistry, webRequests, configurationConsumerUtility);
  }

  @Test
  void testHandleRequestValidation() {
    NullPointerException ex =
        assertThrows(NullPointerException.class, () -> fkControl.handleRequest(null));
    assertEquals("Cannot execute FK calculation from null FkStreamingRequest", ex.getMessage());
    verifyNoInteractions(controlContext, pluginRegistry, webRequests, configurationConsumerUtility);
  }

  @Test
  void testHandleRequestFailedWaveformRequest() throws IOException {
    when(webRequests.waveformRequest(waveformRequest)).thenThrow(HttpResponseException.class);

    assertThrows(FkControlException.class, () -> fkControl.handleRequest(REQUEST));

    verify(webRequests, times(1)).waveformRequest(waveformRequest);
    verifyNoMoreInteractions(webRequests);
    verifyNoInteractions(
        controlContext,
        pluginRegistry,
        configurationConsumerUtility,
        fkSpectraPlugin,
        fkAttributesPlugin);
  }

  @Test
  void testHandleRequestNoWaveformsReturned() throws IOException {
    when(webRequests.waveformRequest(waveformRequest)).thenReturn(List.of());

    Exception ex =
        assertThrows(IllegalStateException.class, () -> fkControl.handleRequest(REQUEST));
    assertEquals(
        "Cannot calculate FK - no waveforms were found for provided channels and time range",
        ex.getMessage());

    verify(webRequests, times(1)).waveformRequest(waveformRequest);
    verifyNoMoreInteractions(webRequests);
    verifyNoInteractions(
        controlContext,
        pluginRegistry,
        configurationConsumerUtility,
        fkSpectraPlugin,
        fkAttributesPlugin);
  }

  @Test
  void testHandlRequestMultipleStationWaveforms() throws IOException {
    List<ChannelSegment<Waveform>> mismatchedChannelSegments =
        new ArrayList<>(BASE_CHANNEL_SEGMENTS);

    Channel station2Channel =
        CHANNEL.toBuilder()
            .setData(
                CHANNEL
                    .getData()
                    .map(
                        data ->
                            data.toBuilder()
                                .setStation(Station.createEntityReference("testStation2"))
                                .build()))
            .build();

    ChannelSegmentDescriptor station2Descriptor =
        ChannelSegmentDescriptor.from(
            station2Channel,
            CHANNEL_SEGMENT.getId().getStartTime(),
            CHANNEL_SEGMENT.getId().getEndTime(),
            CHANNEL_SEGMENT.getId().getCreationTime());

    ChannelSegment<Waveform> channelSegmentStation2 =
        CHANNEL_SEGMENT.toBuilder().setId(station2Descriptor).build();
    mismatchedChannelSegments.add(channelSegmentStation2);
    when(webRequests.waveformRequest(waveformRequest)).thenReturn(mismatchedChannelSegments);
    Exception ex =
        assertThrows(IllegalArgumentException.class, () -> fkControl.handleRequest(REQUEST));
    assertEquals("Can only compute FK from channels in same station.", ex.getMessage());
    verify(webRequests, times(1)).waveformRequest(waveformRequest);
    verifyNoMoreInteractions(webRequests);
    verifyNoInteractions(
        controlContext,
        pluginRegistry,
        configurationConsumerUtility,
        fkSpectraPlugin,
        fkAttributesPlugin);
  }

  @Test
  void testHandleRequestFailedStationRequest() throws IOException {
    when(webRequests.waveformRequest(waveformRequest)).thenReturn(BASE_CHANNEL_SEGMENTS);
    when(webRequests.stationDefinitionStationRequest(stationRequest))
        .thenThrow(HttpResponseException.class);

    assertThrows(FkControlException.class, () -> fkControl.handleRequest(REQUEST));

    verify(webRequests, times(1)).waveformRequest(waveformRequest);
    verify(webRequests, times(1)).stationDefinitionStationRequest(stationRequest);
    verifyNoMoreInteractions(webRequests);
    verifyNoInteractions(
        controlContext,
        pluginRegistry,
        configurationConsumerUtility,
        fkSpectraPlugin,
        fkAttributesPlugin);
  }

  @Test
  void testHandleRequestDuplicateStations() throws IOException {
    when(webRequests.waveformRequest(waveformRequest)).thenReturn(BASE_CHANNEL_SEGMENTS);
    when(webRequests.stationDefinitionStationRequest(stationRequest))
        .thenReturn(List.of(STATION, Station.createEntityReference("test2")));

    Exception ex =
        assertThrows(IllegalStateException.class, () -> fkControl.handleRequest(REQUEST));

    verify(webRequests, times(1)).waveformRequest(waveformRequest);
    verify(webRequests, times(1)).stationDefinitionStationRequest(stationRequest);

    verifyNoMoreInteractions(webRequests);
    verifyNoInteractions(
        controlContext,
        pluginRegistry,
        configurationConsumerUtility,
        fkSpectraPlugin,
        fkAttributesPlugin);
  }

  @Test
  void testHandleRequest() throws IOException {
    try (MockedStatic<ChannelFactory> channelFactory = mockStatic(ChannelFactory.class)) {
      FkSpectra.Builder builder =
          FkSpectra.builder()
              .setStartTime(Instant.EPOCH)
              .setSampleRateHz(DEFINITION.getSampleRateHz())
              .withValues(BASE_FKS);

      builder
          .metadataBuilder()
          .setPhaseType(DEFINITION.getPhaseType())
          .setSlowStartX(DEFINITION.getSlowStartXSecPerKm())
          .setSlowDeltaX(DEFINITION.getSlowDeltaXSecPerKm())
          .setSlowStartY(DEFINITION.getSlowStartYSecPerKm())
          .setSlowDeltaY(DEFINITION.getSlowDeltaYSecPerKm());

      List<FkSpectra> fkSpectras = List.of(builder.build());

      FkSpectraInfo fkSpectraInfo =
          FkSpectraInfo.builder()
              .setLowFrequency(DEFINITION.getLowFrequencyHz())
              .setHighFrequency(DEFINITION.getHighFrequencyHz())
              .setEastSlowStart(DEFINITION.getSlowStartXSecPerKm())
              .setEastSlowDelta(DEFINITION.getSlowDeltaXSecPerKm())
              .setNorthSlowStart(DEFINITION.getSlowStartYSecPerKm())
              .setNorthSlowDelta(DEFINITION.getSlowDeltaYSecPerKm())
              .build();

      FkAttributes fkAttributes =
          FkAttributes.builder()
              .setAzimuth(3.0)
              .setAzimuthUncertainty(0.1)
              .setSlowness(32.3)
              .setSlownessUncertainty(.098)
              .setPeakFStat(23.2)
              .build();

      when(webRequests.waveformRequest(waveformRequest)).thenReturn(BASE_CHANNEL_SEGMENTS);
      when(webRequests.stationDefinitionStationRequest(stationRequest))
          .thenReturn(List.of(STATION));
      when(configurationConsumerUtility.resolve(
              "fk-control.fk-spectra-definitions", List.of(), FkSpectraDefinition.class))
          .thenReturn(DEFINITION);
      doReturn(fkSpectraPlugin)
          .when(pluginRegistry)
          .get("caponFkSpectraPlugin", FkSpectraPlugin.class);
      doReturn(fkAttributesPlugin)
          .when(pluginRegistry)
          .get("maxPowerFkAttributesPlugin", FkAttributesPlugin.class);
      when(fkSpectraPlugin.generateFk(any(), any(), any())).thenReturn(fkSpectras);
      channelFactory
          .when(() -> ChannelFactory.createFkChannel(any(), any(), any()))
          .thenReturn(FK_CHANNEL);
      when(fkAttributesPlugin.generateFkAttributes(fkSpectraInfo, BASE_FKS.get(0)))
          .thenReturn(fkAttributes);

      ChannelSegment<FkSpectra> result = assertDoesNotThrow(() -> fkControl.handleRequest(REQUEST));
      assertNotNull(result);

      verify(webRequests, times(1)).waveformRequest(waveformRequest);
      verify(webRequests, times(1)).stationDefinitionStationRequest(stationRequest);
      verify(configurationConsumerUtility, times(1))
          .resolve("fk-control.fk-spectra-definitions", List.of(), FkSpectraDefinition.class);
      verify(pluginRegistry, times(1)).get("caponFkSpectraPlugin", FkSpectraPlugin.class);
      verify(pluginRegistry, times(1)).get("maxPowerFkAttributesPlugin", FkAttributesPlugin.class);
      verify(fkSpectraPlugin, times(1)).generateFk(any(), any(), any());
      channelFactory.verify(() -> ChannelFactory.createFkChannel(any(), any(), any()), times(1));
      verify(fkAttributesPlugin, times(1)).generateFkAttributes(fkSpectraInfo, BASE_FKS.get(0));

      verifyNoMoreInteractions(
          webRequests,
          configurationConsumerUtility,
          pluginRegistry,
          fkSpectraPlugin,
          fkAttributesPlugin);
      channelFactory.verifyNoMoreInteractions();
      verifyNoInteractions(controlContext);
    }
  }
}
