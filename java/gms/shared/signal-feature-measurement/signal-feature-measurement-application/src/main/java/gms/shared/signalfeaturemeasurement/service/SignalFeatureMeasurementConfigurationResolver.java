package gms.shared.signalfeaturemeasurement.service;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.derivedchannel.coi.BeamDescription;
import gms.shared.derivedchannel.coi.BeamformingTemplate;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.configuration.repository.client.ConfigurationResolutionException;
import gms.shared.signaldetection.coi.types.AmplitudeMeasurementType;
import gms.shared.signalenhancement.coi.rotation.RotationTemplate;
import gms.shared.signalenhancement.configuration.BeamDescriptionParameters;
import gms.shared.signalenhancement.configuration.BeamformingTemplateParameters;
import gms.shared.signalenhancement.configuration.RotationTemplateParameters;
import gms.shared.signalfeaturemeasurement.api.SignalFeatureMeasurementUtility;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementConditioningTemplate;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementDefinition;
import gms.shared.signalfeaturemeasurement.coi.AmplitudeMeasurementMethod;
import gms.shared.signalfeaturemeasurement.configuration.AmplitudeMeasurementConditioningTemplateParameters;
import gms.shared.signalfeaturemeasurement.configuration.StationParameters;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.station.Station;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

// This resolver will use the config consumer utility to resolve actual configurations
@Component
public class SignalFeatureMeasurementConfigurationResolver
    implements SignalFeatureMeasurementUtility {

  private static final String AMPLITUDE_MEASUREMENT_TYPE_SELECTOR = "amplitudeMeasurementType";
  private static final String STATION_NAME_SELECTOR = "station";
  private static final String INPUT_CHANNEL_GROUPS_EMPTY = "Input channel groups cannot be empty.";
  private static final String INPUT_CHANNELS_EMPTY = "Input channels cannot be empty.";

  private static final Logger LOGGER =
      LoggerFactory.getLogger(SignalFeatureMeasurementConfigurationResolver.class);

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  @Value("${stationsByFeatureMeasurementTypeConfig}")
  public String stationsByFeatureMeasurementTypeConfig;

  @Value("${amplitudeMeasurementConditioningTemplateConfig}")
  public String amplitudeMeasurementConditioningTemplateConfig;

  @Value("${amplitudeMeasurementDefinitionsConfig}")
  public String amplitudeMeasurementDefinitionsConfig;

  @Autowired
  public SignalFeatureMeasurementConfigurationResolver(
      ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  @Override
  public List<Station> getDefaultStationsToMeasure(
      AmplitudeMeasurementType amplitudeMeasurementType) {

    Preconditions.checkNotNull(amplitudeMeasurementType);

    var typeName = amplitudeMeasurementType.getFeatureMeasurementTypeName();
    var amplitudeMeasurementTypeSelector =
        Selector.from(AMPLITUDE_MEASUREMENT_TYPE_SELECTOR, typeName);

    var stationParameters =
        configurationConsumerUtility.resolve(
            stationsByFeatureMeasurementTypeConfig,
            List.of(amplitudeMeasurementTypeSelector),
            StationParameters.class);

    return stationParameters.stations().stream().map(Station::createEntityReference).toList();
  }

  @Override
  public AmplitudeMeasurementDefinition getAmplitudeMeasurementDefinition(
      AmplitudeMeasurementType amplitudeMeasurementType) {
    Preconditions.checkNotNull(amplitudeMeasurementType);

    var typeName = amplitudeMeasurementType.getFeatureMeasurementTypeName();

    var amplitudeMeasurementTypeSelector =
        Selector.from(AMPLITUDE_MEASUREMENT_TYPE_SELECTOR, typeName);

    return configurationConsumerUtility.resolve(
        amplitudeMeasurementDefinitionsConfig,
        List.of(amplitudeMeasurementTypeSelector),
        AmplitudeMeasurementDefinitionParams.class,
        amd -> amdFromParams(amplitudeMeasurementType, amd));
  }

  private static AmplitudeMeasurementDefinition amdFromParams(
      AmplitudeMeasurementType amplitudeMeasurementType,
      AmplitudeMeasurementDefinitionParams params) {

    var apmBuilder =
        AmplitudeMeasurementDefinition.builder()
            .setWindowArrivalTimeLead(params.windowArrivalTimeLead)
            .setWindowDuration(params.windowDuration)
            .setRemoveFilterResponse(params.removeFilterResponse)
            .setRemoveInstrumentResponse(params.removeInstrumentResponse)
            .setMeasurementMethod(params.measurementMethod)
            .setPhases(params.phases)
            .setType(amplitudeMeasurementType);

    params.maxPeriod.ifPresent(apmBuilder::setMaxPeriod);
    params.minPeriod.ifPresent(apmBuilder::setMinPeriod);
    params.smoothnessThreshold.ifPresent(apmBuilder::setSmoothnessThreshold);

    return apmBuilder.build();
  }

  /** record for storing params for amplitude measurement definition */
  private record AmplitudeMeasurementDefinitionParams(
      Duration windowArrivalTimeLead,
      Duration windowDuration,
      Optional<Duration> minPeriod,
      Optional<Duration> maxPeriod,
      boolean removeFilterResponse,
      boolean removeInstrumentResponse,
      Optional<Double> smoothnessThreshold,
      AmplitudeMeasurementMethod measurementMethod,
      Collection<PhaseType> phases) {}

  @Override
  public Optional<AmplitudeMeasurementConditioningTemplate>
      getAmplitudeMeasurementConditioningTemplate(
          Station station, AmplitudeMeasurementType amplitudeMeasurementType) {
    Preconditions.checkNotNull(station);
    Preconditions.checkNotNull(amplitudeMeasurementType);
    var stationNameSelector = Selector.from(STATION_NAME_SELECTOR, station.getName());
    var featureMeasurementTypeSelector =
        Selector.from(
            AMPLITUDE_MEASUREMENT_TYPE_SELECTOR,
            amplitudeMeasurementType.getFeatureMeasurementTypeName());

    AmplitudeMeasurementConditioningTemplateParameters amplitudeParams;
    try {
      amplitudeParams =
          configurationConsumerUtility.resolve(
              amplitudeMeasurementConditioningTemplateConfig,
              List.of(stationNameSelector, featureMeasurementTypeSelector),
              AmplitudeMeasurementConditioningTemplateParameters.class);
    } catch (ConfigurationResolutionException e) {
      handleConfigurationError(
          e,
          List.of(stationNameSelector, featureMeasurementTypeSelector),
          AmplitudeMeasurementConditioningTemplate.class);
      return Optional.empty();
    }

    // create the AmplitudeMeasurementConditioningTemplate from the parameters
    var ampType = amplitudeMeasurementType;
    var stationObj = Station.createEntityReference(station.getName());
    var beamTemplateParamsOpt = amplitudeParams.beamformingTemplate();
    var measuredChannelOpt = amplitudeParams.measuredChannel();
    var filteredDefOpt = amplitudeParams.filterDefinition();
    var rotationTemplateParamsOpt = amplitudeParams.rotationTemplate();

    // Beamforming template rules:
    // 1. Must not be populated if measuredChannel is populated
    // 2. Must not be populated if the rotationTemplate is populated.
    BeamformingTemplate beamformingTemplate = null;
    if (beamTemplateParamsOpt.isPresent()
        && !measuredChannelOpt.isPresent()
        && !rotationTemplateParamsOpt.isPresent()) {

      // resolve the beamforming template from the params
      var beamformingTemplateParams = beamTemplateParamsOpt.get();
      beamformingTemplate = createBeamformingTemplate(beamformingTemplateParams);
    }

    // Rotation template rules:
    // 1. Must not be populated if measuredChannel is populated
    // 2. Must not be populated if the beamformingTemplate is populated
    // 3. Either the inputChannels collection or inutChannelGroup attribute must be populated.
    RotationTemplate rotationTemplate = null;
    if (rotationTemplateParamsOpt.isPresent()
        && !measuredChannelOpt.isPresent()
        && !beamTemplateParamsOpt.isPresent()) {

      // resolve the rotation template from the params
      var rotationTemplateParams = rotationTemplateParamsOpt.get();
      rotationTemplate = createRotationTemplate(rotationTemplateParams);
    }

    return Optional.of(
        AmplitudeMeasurementConditioningTemplate.builder()
            .setAmplitudeMeasurementType(ampType)
            .setStation(stationObj)
            .setMeasuredChannel(
                measuredChannelOpt.isPresent()
                    ? Channel.createEntityReference(measuredChannelOpt.get())
                    : null)
            .setFilterDefinition(filteredDefOpt.orElse(null))
            .setBeamformingTemplate(beamformingTemplate)
            .setRotationTemplate(rotationTemplate)
            .build());
  }

  private static RotationTemplate createRotationTemplate(RotationTemplateParameters params) {
    var stationName = params.station();
    var channelNamesOpt = params.inputChannels();
    var channelGroupNameOpt = params.inputChannelGroup();

    // create the input channels
    List<Channel> inputChannels = new ArrayList<>();
    if (channelNamesOpt.isPresent() && channelGroupNameOpt.isPresent()) {
      var channelNames = channelNamesOpt.get();
      var channelGroupName = channelGroupNameOpt.get();
      for (var name : channelNames) {
        inputChannels.add(
            Channel.createEntityReference(stationName + "." + channelGroupName + "." + name));
      }
    }

    // create the RotationTemplate from the params
    return RotationTemplate.builder()
        .setDuration(params.duration())
        .setLeadDuration(params.leadDuration())
        .setLocationToleranceKm(params.locationToleranceKm())
        .setOrientationAngleToleranceDeg(params.orientationAngleToleranceDeg())
        .setSampleRateToleranceHz(params.sampleRateToleranceHz())
        .setStation(Station.createEntityReference(stationName))
        .setInputChannels(inputChannels)
        .setRotationDescription(params.rotationDescription())
        .build();
  }

  /**
   * Create {@link BeamformingTemplate} from {@link BeamformingTemplateParameters}
   *
   * @param {@link BeamformingTemplateParameters} params
   * @return {@link BeaformingTemplate}
   */
  private static BeamformingTemplate createBeamformingTemplate(
      BeamformingTemplateParameters params) {
    var stationName = params.station();
    var channelGroupNames = params.inputChannelGroups();
    var channelNames = params.inputChannels();
    var beamDescriptionParams = params.beamDescriptionParams();

    // check the channel groups and channels
    Preconditions.checkArgument(!channelGroupNames.isEmpty(), INPUT_CHANNEL_GROUPS_EMPTY);
    Preconditions.checkArgument(!channelNames.isEmpty(), INPUT_CHANNELS_EMPTY);

    var station = Station.createEntityReference(stationName);
    var beamDescription = createBeamDescription(beamDescriptionParams);

    // create the channel names to create entity references from
    List<Channel> inputChannels = new ArrayList<>();
    for (var channelName : channelNames) {
      for (var channelGroupName : channelGroupNames) {
        var fullName = stationName + "." + channelGroupName + "." + channelName;
        inputChannels.add(Channel.createEntityReference(fullName));
      }
    }

    return BeamformingTemplate.builder()
        .setStation(station)
        .setLeadDuration(params.leadDuration())
        .setBeamDuration(params.beamDuration())
        .setOrientationAngleToleranceDeg(params.orientationAngleToleranceDeg())
        .setSampleRateToleranceHz(params.sampleRateToleranceHz())
        .setMinWaveformsToBeam(params.minWaveformsToBeam())
        .setInputChannels(ImmutableList.copyOf(inputChannels))
        .setBeamDescription(beamDescription)
        .build();
  }

  /**
   * Create {@link BeamDescription} from {@link BeamDescriptionParameters}
   *
   * @param params {@link BeamDescriptionParameters}
   * @return {@link BeamDescription}
   */
  private static BeamDescription createBeamDescription(BeamDescriptionParameters params) {

    return BeamDescription.builder()
        .setBeamSummation(params.beamSummation())
        .setBeamType(params.beamType())
        .setPhase(params.phaseType())
        .setSamplingType(params.samplingType())
        .setTwoDimensional(params.twoDimensional())
        .setPreFilterDefinition(params.preFilterDefinition().orElse(null))
        .build();
  }

  private static void handleConfigurationError(
      ConfigurationResolutionException e,
      List<? extends Selector<?>> selectors,
      Class<?> configurationClass) {
    // TODO: This handling is temporary due to the imminent migration to the new configuration
    // framework
    // Once migrated, this handling should simplify into e.g. Optional management or specific
    // exception handling, as these checks are brittle and difficult to maintain

    // Only log stack trace if the cause is null
    var cause = e.getCause();
    var causeStr = "Unknown";
    if (cause != null) {
      LOGGER.debug(
          "Configuration for selectors {} failed to fully resolve as {} with cause '{}' Please"
              + " check the configuration parameters.",
          selectors,
          configurationClass.getName(),
          cause.getMessage());
    } else {
      LOGGER.warn(
          "Configuration for selectors {} failed to fully resolve as {} with cause '{}' Please"
              + " check the configuration parameters.",
          selectors,
          configurationClass.getName(),
          "Unknown",
          e);
    }
  }
}
