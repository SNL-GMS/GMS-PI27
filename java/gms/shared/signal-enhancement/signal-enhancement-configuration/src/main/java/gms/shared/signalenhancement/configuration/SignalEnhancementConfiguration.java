package gms.shared.signalenhancement.configuration;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.derivedchannel.coi.BeamDescription;
import gms.shared.derivedchannel.coi.BeamformingTemplate;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.event.coi.LocationSolution;
import gms.shared.featureprediction.utilities.math.GeoMath;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.configuration.repository.client.ConfigurationResolutionException;
import gms.shared.signalenhancement.api.FilterDefinitionByFilterDefinitionUsage;
import gms.shared.signalenhancement.coi.filter.FilterConfiguration;
import gms.shared.signalenhancement.coi.filter.FilterDefinitionForDistanceRange;
import gms.shared.signalenhancement.coi.filter.FilterDefinitionsForDistanceRangesByUsage;
import gms.shared.signalenhancement.coi.filter.FilterDefsForDistRangesByUsage;
import gms.shared.signalenhancement.coi.filter.FilterList;
import gms.shared.signalenhancement.coi.filter.FilterListDefinition;
import gms.shared.signalenhancement.coi.fk.FkSpectraTemplate;
import gms.shared.signalenhancement.coi.fk.FkSpectraTemplateConfiguration;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.api.StationDefinitionAccessor;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.fk.FkSpectraParameters;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.converter.util.StationDefinitionCoiFilter;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * A utility providing clients access to resolved processing configuration used by signal
 * enhancement operations such as beaming, filtering, and Fk spectra calculations.
 */
@Component
public class SignalEnhancementConfiguration {

  private static final String STATION_NAME_SELECTOR = "station";
  private static final String CHANNEL_GROUP_NAME_SELECTOR = "channelGroup";
  private static final String CHANNEL_BAND_NAME_SELECTOR = "channelBand";
  private static final String CHANNEL_INSTRUMENT_NAME_SELECTOR = "channelInstrument";
  private static final String CHANNEL_ORIENTATION_NAME_SELECTOR = "channelOrientation";
  private static final String PHASE_NAME_SELECTOR = "phase";
  private static final String DISTANCE_NAME_SELECTOR = "distance";
  private static final String FILTER_DEFINITION_USAGE_SELECTOR = "filter";
  private static final String DISTANCE_OUT_OF_RANGE = "-99.0";
  private static final String WILD_CARD = "*";
  private static final String BEAM_TYPE_SELECTOR = "beamType";
  private static final String STATION_SELECTOR = "station";
  private static final String PHASE_TYPE_SELECTOR = "phaseType";
  private static final String ACTIVITY_SELECTOR = "activity";

  private static final String STATION_NULL = "Station cannot be null.";
  private static final String PHASE_TYPE_NULL = "PhaseType cannot be null.";
  private static final String BEAM_TYPE_NULL = "BeamType cannot be null.";
  private static final String INPUT_CHANNEL_GROUPS_EMPTY = "Input channel groups cannot be empty.";
  private static final String INPUT_CHANNELS_EMPTY = "Input channels cannot be empty.";
  private static final String STATION_EFFECTIVE_AT_PRESENT = "Station effectiveAt must be present";

  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalEnhancementConfiguration.class);

  private final StationDefinitionAccessor stationDefinitionAccessor;
  private final ConfigurationConsumerUtility configurationConsumerUtility;
  private final ProcessingMaskDefinitionConfiguration processingMaskDefinitionConfiguration;

  @Value("${filterListDefinitionConfig}")
  public String filterListDefinitionConfig;

  @Value("${filterDefinitionsByUsageConfig}")
  public String filterDefinitionsByUsageConfig;

  @Value("${filterMetadataConfig}")
  public String filterMetadataConfig;

  @Value("${signalEnhancementBeamformingConfig}")
  public String signalEnhancementBeamformingConfig;

  @Value("${fkSpectraTemplatesConfig}")
  public String signalEnhancementFkConfig;

  @Value("${fkReviewablePhasesConfig}")
  public String fkReviewablePhasesConfig;

  @Autowired
  public SignalEnhancementConfiguration(
      StationDefinitionAccessor stationDefinitionAccessor,
      ConfigurationConsumerUtility configurationConsumerUtility,
      ProcessingMaskDefinitionConfiguration processingMaskDefinitionConfiguration) {
    this.stationDefinitionAccessor = stationDefinitionAccessor;
    this.configurationConsumerUtility = configurationConsumerUtility;
    this.processingMaskDefinitionConfiguration = processingMaskDefinitionConfiguration;
  }

  /**
   * Uses the ConfigurationConsumerUtility to resolve the {@link FilterList}s available to Analysts
   *
   * @return the resolved {@link FilterListsDefinition}
   */
  public FilterListDefinition filterListDefinition() {
    return configurationConsumerUtility.resolve(
        filterListDefinitionConfig, List.of(), FilterListDefinition.class);
  }

  /**
   * Resolves a {@link FilterDefinition} for each {@link FilterDefinitionUsage} literal in the
   * channel data
   *
   * @param channel a populated {@link Channel} instance
   * @param eventHypothesis a populated {@link EventHypothesis} instance or an empty Optional
   * @param phaseType the {@link PhaseType} or an empty Optional
   * @return the resolved {@link FilterDefinition}s
   */
  public FilterDefinitionByFilterDefinitionUsage getDefaultFilterDefinitionByUsageForChannel(
      Channel channel, EventHypothesis eventHypothesis, PhaseType phaseType) {

    Preconditions.checkArgument(channel.getData().isPresent(), "Channel is not populated.");

    if (phaseType == null) {
      phaseType = PhaseType.UNKNOWN;
    }
    var properties = getFilterDefinitionProperties(channel, phaseType, eventHypothesis);

    return FilterDefinitionByFilterDefinitionUsage.from(
        getFilterDefinitionUsageByFilterDefinitionMap(properties));
  }

  Map<FilterDefinitionUsage, FilterDefinition> getFilterDefinitionUsageByFilterDefinitionMap(
      Properties criterionProperties) {
    var stationNameSelector =
        Selector.from(
            STATION_NAME_SELECTOR, criterionProperties.getProperty(STATION_NAME_SELECTOR));
    var channelGroupNameSelector =
        Selector.from(
            CHANNEL_GROUP_NAME_SELECTOR,
            criterionProperties.getProperty(CHANNEL_GROUP_NAME_SELECTOR));
    var channelBandNameSelector =
        Selector.from(
            CHANNEL_BAND_NAME_SELECTOR,
            criterionProperties.getProperty(CHANNEL_BAND_NAME_SELECTOR));
    var channelInstrumentNameSelector =
        Selector.from(
            CHANNEL_INSTRUMENT_NAME_SELECTOR,
            criterionProperties.getProperty(CHANNEL_INSTRUMENT_NAME_SELECTOR));
    var channelOrientationNameSelector =
        Selector.from(
            CHANNEL_ORIENTATION_NAME_SELECTOR,
            criterionProperties.getProperty(CHANNEL_ORIENTATION_NAME_SELECTOR));
    var phaseNameSelector =
        Selector.from(PHASE_NAME_SELECTOR, criterionProperties.getProperty(PHASE_NAME_SELECTOR));
    var distanceNameSelector =
        Selector.from(DISTANCE_NAME_SELECTOR, getDistance(criterionProperties));

    return Arrays.stream(FilterDefinitionUsage.values())
        .collect(
            Collectors.toMap(
                Function.identity(),
                filterDefinitionUsage ->
                    configurationConsumerUtility
                        .resolve(
                            filterMetadataConfig,
                            List.of(
                                stationNameSelector,
                                channelGroupNameSelector,
                                channelBandNameSelector,
                                channelInstrumentNameSelector,
                                channelOrientationNameSelector,
                                phaseNameSelector,
                                distanceNameSelector,
                                Selector.from(
                                    FILTER_DEFINITION_USAGE_SELECTOR,
                                    filterDefinitionUsage.getName())),
                            FilterConfiguration.class)
                        .getFilterDefinition()));
  }

  /**
   * Retrieves the {@link ProcessingMaskDefinition} based on the input parameters. If there are no
   * matching definitions, a default all encompassing definition will be returned
   *
   * @param processingOperation {@link ProcessingOperation} to use in configuration query
   * @param stationGroup {@link StationGroup} to use in configuration query
   * @param channel {@link Channel} to use in configuration query
   * @param phaseType {@link PhaseType} to use in configuration query
   * @return Populated {@link ProcessingMaskDefinition} object
   */
  public ProcessingMaskDefinition getProcessingMaskDefinition(
      ProcessingOperation processingOperation, Channel channel, PhaseType phaseType) {

    return processingMaskDefinitionConfiguration.getProcessingMaskDefinition(
        processingOperation, channel, phaseType);
  }

  /**
   * Resolve {@link BeamformingTemplate} using processing configuration, input {@link Station},
   * {@link PhaseType} and {@link BeamType}
   *
   * @param station input {@link Station}
   * @param phase input {@link PhaseType}
   * @param beamType input {@link BeamType}
   * @return {@link BeamformingTemplate}
   */
  public Optional<BeamformingTemplate> getBeamformingTemplate(
      Station station, PhaseType phase, BeamType beamType) {

    Preconditions.checkNotNull(station, STATION_NULL);
    Preconditions.checkNotNull(phase, PHASE_TYPE_NULL);
    Preconditions.checkNotNull(beamType, BEAM_TYPE_NULL);

    var stationNameSelector = Selector.from(STATION_SELECTOR, station.getName());
    var phaseNameSelector = Selector.from(PHASE_TYPE_SELECTOR, phase.getLabel());
    var beamNameSelector = Selector.from(BEAM_TYPE_SELECTOR, beamType.getLabel());

    BeamformingTemplateParameters btParams;

    try {
      btParams =
          configurationConsumerUtility.resolve(
              signalEnhancementBeamformingConfig,
              List.of(stationNameSelector, phaseNameSelector, beamNameSelector),
              BeamformingTemplateParameters.class);
    } catch (ConfigurationResolutionException ex) {
      LOGGER.warn(
          "Configuration could not be resolved and returned an error message of {} for the"
              + " following criterion {}.  This indicates a possible misconfiguration.",
          ex.getMessage());
      return Optional.empty();
    }

    // get input channel groups and channels from the beamforming config
    var inputChannelGroups = btParams.inputChannelGroups();
    var inputChannels = btParams.inputChannels();

    Preconditions.checkArgument(!inputChannelGroups.isEmpty(), INPUT_CHANNEL_GROUPS_EMPTY);
    Preconditions.checkArgument(!inputChannels.isEmpty(), INPUT_CHANNELS_EMPTY);
    var effectiveAt =
        station
            .getEffectiveAt()
            .orElseThrow(() -> new IllegalArgumentException(STATION_EFFECTIVE_AT_PRESENT));

    if (!station.isPresent()) {
      // query for station data before filtering channel groups & channels
      var stationName = station.getName();
      List<Station> stations =
          stationDefinitionAccessor.findStationsByNameAndTime(List.of(stationName), effectiveAt);
      if (stations.isEmpty()) {
        LOGGER.warn(
            "Beamforming Template could not be created because station {} could not be found",
            station);
        return Optional.empty();
      }
      station = stations.get(0);
    }

    // filter raw channels using input channel groups & channels
    List<Channel> beamformingChannels =
        StationDefinitionCoiFilter.filterStationRawChannels(
            station.getAllRawChannels(), inputChannelGroups, inputChannels);
    Optional<BeamformingTemplate> result;

    if (beamformingChannels.isEmpty()) {
      LOGGER.warn(
          "Beamforming Template could not be created because station {} does not have any channels"
              + " to beam that match configuration",
          station);
      result = Optional.empty();
    } else {
      result =
          buildBeamformingTemplate(
              btParams, beamType, phase, beamformingChannels, station, effectiveAt);
    }

    return result;
  }

  private static Optional<BeamformingTemplate> buildBeamformingTemplate(
      BeamformingTemplateParameters btParams,
      BeamType beamType,
      PhaseType phase,
      List<Channel> beamformingChannels,
      Station station,
      Instant effectiveAt) {
    var beamDescriptionParams = btParams.beamDescriptionParams();
    var beamDescription =
        BeamDescription.builder()
            .setBeamSummation(beamDescriptionParams.beamSummation())
            .setBeamType(beamType)
            .setPhase(phase)
            .setSamplingType(beamDescriptionParams.samplingType())
            .setTwoDimensional(beamDescriptionParams.twoDimensional())
            .setPreFilterDefinition(beamDescriptionParams.preFilterDefinition().orElse(null))
            .build();
    return Optional.of(
        BeamformingTemplate.builder()
            .setLeadDuration(btParams.leadDuration())
            .setBeamDuration(btParams.beamDuration())
            .setOrientationAngleToleranceDeg(btParams.orientationAngleToleranceDeg())
            .setSampleRateToleranceHz(btParams.sampleRateToleranceHz())
            .setMinWaveformsToBeam(btParams.minWaveformsToBeam())
            .setBeamDescription(beamDescription)
            .setInputChannels(ImmutableList.copyOf(beamformingChannels))
            .setStation(Station.createVersionReference(station.getName(), effectiveAt))
            .build());
  }

  /**
   * Resolve {@link FkSpectraTemplate} using processing configuration, input {@link Station} and
   * {@link PhaseType}
   *
   * @param station input {@link Station}, must be populated
   * @param phaseType input {@link PhaseType}
   * @return {@link FkSpectraTemplate}
   */
  public FkSpectraTemplate getFkSpectraTemplate(Station station, PhaseType phaseType) {

    Preconditions.checkNotNull(station);
    Preconditions.checkNotNull(phaseType);
    Preconditions.checkArgument(station.isPresent(), "Station must be populated.");

    var stationNameSelector = Selector.from(STATION_SELECTOR, station.getName());
    var phaseTypeSelector = Selector.from(PHASE_TYPE_SELECTOR, phaseType.getLabel());

    return configurationConsumerUtility.resolve(
        signalEnhancementFkConfig,
        List.of(stationNameSelector, phaseTypeSelector),
        FkSpectraTemplateConfiguration.class,
        (FkSpectraTemplateConfiguration fkConfig) -> {

          // filter raw channels using input channel groups & channels
          List<Channel> fkInputChannels =
              StationDefinitionCoiFilter.filterStationRawChannels(
                  station.getAllRawChannels(),
                  fkConfig.inputChannelGroups(),
                  fkConfig.inputChannels());

          var versionStation = Station.createVersionReference(station);

          return getTemplateFromConfig(fkConfig, phaseType, versionStation, fkInputChannels);
        });
  }

  private static FkSpectraTemplate getTemplateFromConfig(
      FkSpectraTemplateConfiguration fkConfig,
      PhaseType phaseType,
      Station versionStation,
      Collection<Channel> fkInputChannels) {

    var fkSpectraParametersBuilder =
        FkSpectraParameters.builder()
            .setFftTaperFunction(fkConfig.fkSpectraParameters().fftTaperFunction())
            .setFftTaperPercent(fkConfig.fkSpectraParameters().fftTaperPercent())
            .setFkSpectrumWindow(fkConfig.fkSpectraParameters().fkSpectrumWindow())
            .setFkUncertaintyOption(fkConfig.fkSpectraParameters().fkUncertaintyOption())
            .setFkWaveformSampleRate(fkConfig.fkSpectraParameters().waveformSampleRate())
            .setFrequencyRange(fkConfig.fkSpectraParameters().fkFrequencyRange())
            .setMinimumWaveformsForSpectra(
                fkConfig.fkSpectraParameters().minimumWaveformsForSpectra())
            .setNormalizeWaveforms(fkConfig.fkSpectraParameters().normalizeWaveforms())
            .setOrientationAngleTolerance(
                fkConfig.fkSpectraParameters().orientationAngleToleranceDeg())
            .setPhaseType(phaseType)
            .setSlownessGrid(fkConfig.fkSpectraParameters().slownessGrid())
            .setSpectrumStepDuration(fkConfig.fkSpectraParameters().spectrumStepDuration())
            .setTwoDimensional(fkConfig.fkSpectraParameters().twoDimensional());

    fkConfig.fkSpectraParameters().preFilter().ifPresent(fkSpectraParametersBuilder::setPreFilter);

    return new FkSpectraTemplate(
        fkConfig.fkSpectraWindow(),
        versionStation,
        phaseType,
        fkInputChannels,
        fkSpectraParametersBuilder.build());
  }

  /**
   * Retrieves configured reviewable phases if such configuration exists
   *
   * @param stationName Name of the station used to resolve reviewable phases
   * @param activity ID referencing the activity used to resolve reviewable phases
   * @return An optional set of phases if properly configured. Empty if configuration not found or
   *     unable to be parsed.
   */
  public Optional<Set<PhaseType>> getFkReviewablePhases(
      String stationName, WorkflowDefinitionId activity)
      throws IllegalArgumentException, IllegalStateException {

    var stationSelector = Selector.from(STATION_SELECTOR, stationName);
    var activitySelector = Selector.from(ACTIVITY_SELECTOR, activity.getName());

    try {
      FkReviewablePhasesConfiguration phasesConfig =
          configurationConsumerUtility.resolve(
              fkReviewablePhasesConfig,
              List.of(stationSelector, activitySelector),
              FkReviewablePhasesConfiguration.class);

      return Optional.of(phasesConfig.phases());
    } catch (ConfigurationResolutionException e) {
      handleConfigurationError(
          e, List.of(stationSelector, activitySelector), FkReviewablePhasesConfiguration.class);
      return Optional.empty();
    }
  }

  private static void handleConfigurationError(
      ConfigurationResolutionException e,
      List<? extends Selector<?>> selectors,
      Class<?> configurationClass)
      throws RuntimeException {
    // TODO: This handling is temporary due to the imminent migration to the new configuration
    // framework
    // Once migrated, this handling should simplify into e.g. Optional management or specific
    // exception handling, as these checks are brittle and difficult to maintain

    var cause = e.getCause();

    LOGGER.warn(
        """
            Configuration for selectors {} failed to fully resolve as {} with cause
                '{}'
            Please check the configuration parameters.""",
        selectors,
        configurationClass.getName(),
        cause.getMessage());
  }

  /**
   * Get the filter definition properties used to create selectors
   *
   * @param channel input {@link Channel}
   * @param phaseType input {@link PhaseType}
   * @param eventHypothesis nullable {@link EventHypothesis}
   * @return filter definition properties
   */
  private static Properties getFilterDefinitionProperties(
      Channel channel, PhaseType phaseType, EventHypothesis eventHypothesis) {
    var station = channel.getStation().getName();
    var channelGroup =
        channel.getProcessingMetadata().get(ChannelProcessingMetadataType.CHANNEL_GROUP).toString();
    var channelBand = String.valueOf(channel.getChannelBandType().getCode());
    var channelInstrument = String.valueOf(channel.getChannelInstrumentType().getCode());
    var channelOrientation = String.valueOf(channel.getChannelOrientationType().getCode());
    var phase = phaseType.getLabel();
    var properties = new Properties();

    properties.setProperty(STATION_NAME_SELECTOR, station);
    properties.setProperty(CHANNEL_GROUP_NAME_SELECTOR, channelGroup);
    properties.setProperty(CHANNEL_BAND_NAME_SELECTOR, channelBand);
    properties.setProperty(CHANNEL_INSTRUMENT_NAME_SELECTOR, channelInstrument);
    properties.setProperty(CHANNEL_ORIENTATION_NAME_SELECTOR, channelOrientation);
    properties.setProperty(PHASE_NAME_SELECTOR, phase);
    properties.setProperty(DISTANCE_NAME_SELECTOR, "");

    if (eventHypothesis != null) {
      eventHypothesis
          .getData()
          .ifPresent(
              data ->
                  data.getPreferredLocationSolution()
                      .ifPresent(
                          preferredLocation ->
                              preferredLocation
                                  .getData()
                                  .ifPresent(
                                      location ->
                                          properties.setProperty(
                                              DISTANCE_NAME_SELECTOR,
                                              getGreatCircleAngularSeparation(
                                                  location, channel)))));
    }

    return properties;
  }

  private static String getGreatCircleAngularSeparation(
      LocationSolution.Data location, Channel channel) {
    return String.valueOf(
        GeoMath.greatCircleAngularSeparation(
            location.getLocation().getLatitudeDegrees(),
            location.getLocation().getLongitudeDegrees(),
            channel.getLocation().getLatitudeDegrees(),
            channel.getLocation().getLongitudeDegrees()));
  }

  private static double getDistance(Properties criterionProperties) {
    String distance = criterionProperties.getProperty(DISTANCE_NAME_SELECTOR);
    if (distance.equals(WILD_CARD) || distance.isEmpty()) {
      distance = DISTANCE_OUT_OF_RANGE;
    }

    return Double.parseDouble(distance);
  }

  /**
   * Resolves a mapping from {@link FilterDefinitionUsage} to {@link
   * FilterDefinitionForDistanceRange}s from processing configuration.
   *
   * @param stationName Name of the station to select for
   * @param channelGroupName Name of the channel group to select for
   * @param channelCode {@link ChannelTypes} containing channel band/instrument/orientation to
   *     select for
   * @param phase Phase to select for
   * @return A mapping from {@link FilterDefinitionUsage} to {@link
   *     FilterDefinitionForDistanceRange}s resolved from processing configuration.
   */
  public FilterDefsForDistRangesByUsage getDefaultFilterDefinitionByUsageMap(
      String stationName, String channelGroupName, ChannelTypes channelCode, PhaseType phase) {

    var stationNameSelector = Selector.from(STATION_NAME_SELECTOR, stationName);
    var channelGroupNameSelector = Selector.from(CHANNEL_GROUP_NAME_SELECTOR, channelGroupName);
    var channelBandNameSelector =
        Selector.from(
            CHANNEL_BAND_NAME_SELECTOR, String.valueOf(channelCode.getBandType().getCode()));
    var channelInstrumentNameSelector =
        Selector.from(
            CHANNEL_INSTRUMENT_NAME_SELECTOR,
            String.valueOf(channelCode.getInstrumentType().getCode()));
    var channelOrientationNameSelector =
        Selector.from(
            CHANNEL_ORIENTATION_NAME_SELECTOR,
            String.valueOf(channelCode.getOrientationType().getCode()));
    var phaseNameSelector = Selector.from(PHASE_NAME_SELECTOR, phase.getLabel());

    var selectorsList =
        List.of(
            stationNameSelector,
            channelGroupNameSelector,
            channelBandNameSelector,
            channelInstrumentNameSelector,
            channelOrientationNameSelector,
            phaseNameSelector);

    return configurationConsumerUtility.resolve(
        filterDefinitionsByUsageConfig,
        selectorsList,
        FilterDefinitionsForDistanceRangesByUsage.class,
        fdbuMapConfig ->
            fdbuMapConfig.filterDefinitionsForDistanceRangesByUsage().entrySet().stream()
                .collect(FilterDefsForDistRangesByUsage.toFilterDefsForDistRangesByUsage()));
  }

  /**
   * Resolves a mapping from {@link FilterDefinitionUsage} to {@link
   * FilterDefinitionForDistanceRange}s from processing configuration for the default configuration.
   * Since the default configuration must be there, if this method fails to find a default config an
   * exception will be propagated up
   *
   * @return A mapping from {@link FilterDefinitionUsage} to {@link
   *     FilterDefinitionForDistanceRange}s resolved from processing configuration for the default
   *     configuration
   */
  public FilterDefsForDistRangesByUsage getDefaultFilterDefinitionByUsageMap() {
    return configurationConsumerUtility
        .resolve(
            filterDefinitionsByUsageConfig,
            Collections.emptyList(),
            FilterDefinitionsForDistanceRangesByUsage.class)
        .filterDefinitionsForDistanceRangesByUsage()
        .entrySet()
        .stream()
        .collect(FilterDefsForDistRangesByUsage.toFilterDefsForDistRangesByUsage());
  }
}
