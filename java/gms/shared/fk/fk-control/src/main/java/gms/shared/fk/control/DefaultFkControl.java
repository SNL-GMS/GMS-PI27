package gms.shared.fk.control;

import com.google.common.annotations.VisibleForTesting;
import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import gms.shared.fk.coi.FkSpectraDefinition;
import gms.shared.fk.control.api.FkControl;
import gms.shared.fk.control.api.FkStreamingRequest;
import gms.shared.fk.control.configuration.FkAttributesParameters;
import gms.shared.fk.control.configuration.FkConfiguration;
import gms.shared.fk.control.exception.FkControlException;
import gms.shared.fk.plugin.fkattributes.FkAttributesPlugin;
import gms.shared.fk.plugin.fkspectra.FkSpectraPlugin;
import gms.shared.fk.plugin.util.FkSpectraInfo;
import gms.shared.fk.pluginregistry.PluginRegistry;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.stationdefinition.api.station.util.StationsTimeFacetRequest;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.facet.FacetingTypes;
import gms.shared.stationdefinition.repository.util.ChannelFactory;
import gms.shared.utilities.javautilities.objectmapper.ObjectMappers;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.FkSpectra;
import gms.shared.waveform.coi.FkSpectrum;
import gms.shared.waveform.coi.Waveform;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class DefaultFkControl implements FkControl {

  private static final Logger LOGGER = LoggerFactory.getLogger(DefaultFkControl.class);
  private static final double BILLION = 1E9;
  private static final int PORT_8080 = 8080;
  private static final FacetingDefinition CHANNEL_FACETING_DEFINITION =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.CHANNEL_TYPE.getValue())
          .setPopulated(true)
          .build();

  static final FacetingDefinition CHANNEL_SEGMENT_FACETING_DEFINITION =
      FacetingDefinition.builder()
          .setClassType(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue())
          .setPopulated(true)
          .setFacetingDefinitions(
              Map.of(FacetingTypes.ID_CHANNEL_KEY.getValue(), CHANNEL_FACETING_DEFINITION))
          .build();

  private final PluginRegistry pluginRegistry;
  private final WebRequests webRequests;
  private FkConfiguration fkConfiguration;

  /**
   * Constructs a FkControl with provided plugin fkSpectraPluginRegistry and OSD gateway access
   * library.
   *
   * @param pluginRegistry plugin registry, not null
   */
  private DefaultFkControl(
      PluginRegistry pluginRegistry, FkConfiguration fkConfiguration, WebRequests webRequests) {

    this.pluginRegistry = pluginRegistry;
    this.fkConfiguration = fkConfiguration;
    this.webRequests = webRequests;
  }

  @VisibleForTesting
  static DefaultFkControl create(
      PluginRegistry pluginRegistry, FkConfiguration fkConfiguration, WebRequests webRequests) {
    return new DefaultFkControl(pluginRegistry, fkConfiguration, webRequests);
  }

  /**
   * Factory method for creating a DefaultFkControl
   *
   * @param context control context, not null
   * @return a new DefaultFkControl object
   */
  public static DefaultFkControl create(ControlContext context) {
    Objects.requireNonNull(context, "Cannot create FkControl from null ControlContext");

    var stationDefinitionUrl =
        String.format(
            "http://%s:%d%s%s",
            "station-definition-service",
            PORT_8080,
            "/station-definition-service",
            "/station-definition/stations/query/names");
    var waveformUrl =
        String.format(
            "http://%s:%d%s%s",
            "waveform-manager-service",
            PORT_8080,
            "/waveform-manager-service",
            "/waveform/channel-segment/query/channel-timerange");
    var objectMapper = ObjectMappers.jsonMapper();
    var webRequests = WebRequests.create(stationDefinitionUrl, waveformUrl, objectMapper);

    return new DefaultFkControl(
        PluginRegistry.create(),
        FkConfiguration.create(context.getProcessingConfigurationConsumerUtility()),
        webRequests);
  }

  /**
   * Execute FK processing using the provided {@link FkStreamingRequest}
   *
   * @param request object describing the Fk Spectrum processing request, not null
   * @return list of generated {@link ChannelSegment}, not null
   */
  @Override
  public ChannelSegment<FkSpectra> handleRequest(FkStreamingRequest request) {
    Objects.requireNonNull(request, "Cannot execute FK calculation from null FkStreamingRequest");

    LOGGER.info("FkControl executing streaming request:\n{}", request);

    final double samplePeriod = 1.0 / request.getSampleRate();
    long nanosToEnd = (long) (samplePeriod * BILLION * (request.getSampleCount() - 1));

    Range<Instant> waveformRange =
        computeRange(
            request.getStartTime(),
            request.getStartTime().plusNanos(nanosToEnd),
            request.getWindowLead(),
            request.getWindowLength());

    Collection<ChannelSegment<Waveform>> channelSegments;
    try {
      channelSegments =
          webRequests.waveformRequest(
              ChannelTimeRangeRequest.builder()
                  .setChannels(Set.copyOf(request.getChannels()))
                  .setStartTime(waveformRange.lowerEndpoint())
                  .setEndTime(waveformRange.upperEndpoint())
                  .setFacetingDefinition(CHANNEL_SEGMENT_FACETING_DEFINITION)
                  .build());
    } catch (IOException ex) {
      LOGGER.error("Error retrieving waveforms", ex);
      throw new FkControlException("Error retrieving waveforms", ex);
    }

    Preconditions.checkState(
        !channelSegments.isEmpty(),
        "Cannot calculate FK - no waveforms were found for provided channels and time range");

    List<Channel> channels =
        channelSegments.stream()
            .map(ChannelSegment::getId)
            .map(ChannelSegmentDescriptor::getChannel)
            .distinct()
            .toList();

    Preconditions.checkArgument(
        channels.stream().map(Channel::getStation).map(Station::getName).distinct().count() == 1,
        "Can only compute FK from channels in same station.");

    List<String> stationNames =
        channels.stream().map(Channel::getStation).map(Station::getName).distinct().toList();

    Preconditions.checkState(
        stationNames.size() == 1, "Cannot calculate FK from channels from multiple stations");

    List<Station> stationList;
    try {
      stationList =
          webRequests.stationDefinitionStationRequest(
              StationsTimeFacetRequest.builder()
                  .setStationNames(stationNames)
                  .setEffectiveTime(request.getStartTime())
                  .build());
    } catch (IOException ex) {
      LOGGER.error("Error retrieving stations", ex);
      throw new FkControlException("Error retrieving stations", ex);
    }

    Preconditions.checkState(
        stationList.size() == 1,
        "Station retrieval should return exactly one station. Was instead %s",
        stationList.size());

    var station = stationList.get(0);

    var fkSpectraParameters =
        fkConfiguration.createFkSpectraParameters(request, getModalSampleRate(channels));

    var fkSpectraPlugin =
        this.pluginRegistry.get(fkSpectraParameters.getPluginName(), FkSpectraPlugin.class);

    List<FkAttributesParameters> fkAttributesParameters =
        FkConfiguration.createFkAttributesParameters(fkSpectraParameters.getDefinition());

    List<FkAttributesPlugin> attributesPlugins =
        fkAttributesParameters.stream()
            .map(
                parameters ->
                    this.pluginRegistry.get(parameters.getPluginName(), FkAttributesPlugin.class))
            .toList();

    return createFkSpectraSegment(
        fkSpectraPlugin,
        attributesPlugins,
        fkSpectraParameters.getDefinition(),
        request.getStartTime(),
        station,
        channelSegments);
  }

  static double getModalSampleRate(Collection<Channel> channels) {
    final Map<Double, Long> sampleRateFreqs =
        channels.stream()
            .map(Channel::getNominalSampleRateHz)
            .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

    return Collections.max(sampleRateFreqs.entrySet(), Map.Entry.comparingByValue()).getKey();
  }

  private static Range<Instant> computeRange(
      Instant start, Instant end, Duration lead, Duration length) {
    return Range.closed(start.minus(lead), end.plus(length.minus(lead)));
  }

  /**
   * Creates a new {@link ChannelSegment} as results from Fk Spectra from the input {@link
   * ChannelSegment} using the supplied {@link FkSpectraPlugin}. The new ChannelSegment is defined
   * using the a new output channel id that is not the same as the channel id referenced by the
   * input {@link ChannelSegment}.
   *
   * @param fkSpectraPlugin The plugin Fk Spectra algorithm
   * @param fkAttributesPlugins The plugins for Fk Attributes generation given an Fk Spectrum
   * @param fkSpectrumDefinition The Fk Spectrum definition identifying window lead and length,
   *     low/high frequencies, sample rate, etc. used by the Fk Spectra plugin
   * @param channelSegments The input ChannelSegment supplying the waveforms as input to Fk Spectra
   * @return The new ChannelSegment of type FkSpectra
   */
  private static ChannelSegment<FkSpectra> createFkSpectraSegment(
      FkSpectraPlugin fkSpectraPlugin,
      List<FkAttributesPlugin> fkAttributesPlugins,
      FkSpectraDefinition fkSpectrumDefinition,
      Instant startTime,
      Station station,
      Collection<ChannelSegment<Waveform>> channelSegments) {

    // Create a collection of FkSpectrum to be aggregated by new ChannelSegment<FkSpectra>.
    List<FkSpectra> fkSpectraList =
        fkSpectraPlugin.generateFk(station, channelSegments, fkSpectrumDefinition);

    LOGGER.info("Fk Spectrum on ChannelSegments output {} FkSpectra", fkSpectraList.size());

    // Instantiate a List of FkSpectrum objects to be aggregated by
    // ChannelSegment<FkSpectra>.
    List<Channel> inputChannels =
        channelSegments.stream()
            .map(ChannelSegment::getId)
            .map(ChannelSegmentDescriptor::getChannel)
            .toList();
    var fkChannel = ChannelFactory.createFkChannel(station, inputChannels, fkSpectrumDefinition);

    List<FkSpectrum> fkSpectrumListWithAttributes = new ArrayList<>();

    fkSpectraList
        .get(0)
        .getValues()
        .forEach(
            (FkSpectrum spectrum) -> {
              var builder = spectrum.toBuilder();
              fkAttributesPlugins.forEach(
                  (FkAttributesPlugin plugin) -> {
                    FkSpectraInfo info = buildInfo(fkSpectrumDefinition);
                    builder.setAttributes(plugin.generateFkAttributes(info, spectrum));
                  });
              fkSpectrumListWithAttributes.add(builder.build());
            });

    var fkSpectraBuilder =
        FkSpectra.builder()
            .setStartTime(startTime)
            .setSampleRateHz(fkSpectrumDefinition.getSampleRateHz())
            .withValues(fkSpectrumListWithAttributes)
            .setMetadata(createMetadataFromDefinition(fkSpectrumDefinition));

    return ChannelSegment.from(
        fkChannel,
        Units.NANOMETERS_SQUARED_PER_SECOND,
        List.of(fkSpectraBuilder.build()),
        Instant.now(),
        List.of(),
        Map.of());
  }

  private static FkSpectraInfo buildInfo(FkSpectraDefinition fkSpectrumDefinition) {
    return FkSpectraInfo.builder()
        .setLowFrequency(fkSpectrumDefinition.getLowFrequencyHz())
        .setHighFrequency(fkSpectrumDefinition.getHighFrequencyHz())
        .setEastSlowStart(fkSpectrumDefinition.getSlowStartXSecPerKm())
        .setEastSlowDelta(fkSpectrumDefinition.getSlowDeltaXSecPerKm())
        .setNorthSlowStart(fkSpectrumDefinition.getSlowStartYSecPerKm())
        .setNorthSlowDelta(fkSpectrumDefinition.getSlowDeltaYSecPerKm())
        .build();
  }

  private static FkSpectra.Metadata createMetadataFromDefinition(FkSpectraDefinition definition) {
    return FkSpectra.Metadata.builder()
        .setPhaseType(definition.getPhaseType())
        .setSlowStartX(definition.getSlowStartXSecPerKm())
        .setSlowDeltaX(definition.getSlowDeltaXSecPerKm())
        .setSlowStartY(definition.getSlowStartYSecPerKm())
        .setSlowDeltaY(definition.getSlowDeltaYSecPerKm())
        .build();
  }
}
