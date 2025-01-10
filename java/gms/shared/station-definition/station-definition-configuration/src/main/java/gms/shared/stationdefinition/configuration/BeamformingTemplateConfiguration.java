package gms.shared.stationdefinition.configuration;

import com.google.common.base.Preconditions;
import com.google.common.collect.ImmutableList;
import gms.shared.common.coi.types.BeamSummation;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.common.coi.types.SamplingType;
import gms.shared.derivedchannel.coi.BeamDescription;
import gms.shared.derivedchannel.coi.BeamformingTemplate;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.configuration.repository.client.ConfigurationResolutionException;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.converter.util.StationDefinitionCoiFilter;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class BeamformingTemplateConfiguration {
  private static final Logger logger =
      LoggerFactory.getLogger(BeamformingTemplateConfiguration.class);

  private static final String BEAM_TYPE_SELECTOR = "beamType";
  private static final String STATION_SELECTOR = "station";
  private static final String PHASE_TYPE_SELECTOR = "phaseType";

  private static final String BEAMFORMING_TEMPLATE_MSG =
      "Beamforming Template " + "could not be created because";
  private static final String STATION_NULL = "Station cannot be null.";
  private static final String PHASE_TYPE_NULL = "PhaseType cannot be null.";
  private static final String BEAM_TYPE_NULL = "BeamType cannot be null.";
  private static final String INPUT_CHANNEL_GROUPS_EMPTY = "Input channel groups cannot be empty.";
  private static final String INPUT_CHANNELS_EMPTY = "Input channels cannot be empty.";

  private final ConfigurationConsumerUtility configurationConsumerUtility;
  public static final String BEAMFORMING_TEMPLATE_CONFIG = "global.beamforming-configuration";

  @Autowired
  public BeamformingTemplateConfiguration(
      ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;
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

    BeamformingTemplateParams btParams;

    try {
      btParams =
          configurationConsumerUtility.resolve(
              BEAMFORMING_TEMPLATE_CONFIG,
              List.of(stationNameSelector, phaseNameSelector, beamNameSelector),
              BeamformingTemplateParams.class);
    } catch (ConfigurationResolutionException ex) {
      logger.warn(
          "Configuration could not be resolved and returned an error message of {} for the"
              + " following criterion {}.  This indicates a possible misconfiguration.",
          ex.getMessage());
      return Optional.empty();
    }

    // get input channel groups and channels from the beamforming config
    var inputChannelGroups = btParams.inputChannelGroups;
    var inputChannels = btParams.inputChannels;

    Preconditions.checkArgument(!inputChannelGroups.isEmpty(), INPUT_CHANNEL_GROUPS_EMPTY);
    Preconditions.checkArgument(!inputChannels.isEmpty(), INPUT_CHANNELS_EMPTY);

    // if station DNE we can't get raw chans
    // filter raw channels using input channel groups & channels
    List<Channel> beamformingChannels =
        StationDefinitionCoiFilter.filterStationRawChannels(
            station.getAllRawChannels(), inputChannelGroups, inputChannels);

    if (beamformingChannels.isEmpty()) {
      logger.error(
          BEAMFORMING_TEMPLATE_MSG + " station {} does not have any channels to beam",
          station.getName());
      return Optional.empty();
    }

    var effectiveAt = station.getEffectiveAt().orElseThrow();
    var beamDescriptionParams = btParams.beamDescriptionParams;

    var beamDescription =
        BeamDescription.builder()
            .setBeamSummation(beamDescriptionParams.beamSummation)
            .setBeamType(beamType)
            .setPhase(phase)
            .setSamplingType(beamDescriptionParams.samplingType)
            .setTwoDimensional(beamDescriptionParams.twoDimensional)
            .setPreFilterDefinition(beamDescriptionParams.preFilterDefinition.orElse(null))
            .build();

    return Optional.of(
        BeamformingTemplate.builder()
            .setLeadDuration(btParams.leadDuration)
            .setBeamDuration(btParams.beamDuration)
            .setOrientationAngleToleranceDeg(btParams.orientationAngleToleranceDeg)
            .setSampleRateToleranceHz(btParams.sampleRateToleranceHz)
            .setMinWaveformsToBeam(btParams.minWaveformsToBeam)
            .setBeamDescription(beamDescription)
            .setInputChannels(ImmutableList.copyOf(beamformingChannels))
            .setStation(Station.createVersionReference(station.getName(), effectiveAt))
            .build());
  }

  private record BeamformingTemplateParams(
      Duration leadDuration,
      Duration beamDuration,
      Double orientationAngleToleranceDeg,
      Double sampleRateToleranceHz,
      Integer minWaveformsToBeam,
      ImmutableList<String> inputChannelGroups,
      ImmutableList<String> inputChannels,
      BeamDescriptionParams beamDescriptionParams) {}

  private record BeamDescriptionParams(
      BeamSummation beamSummation,
      boolean twoDimensional,
      SamplingType samplingType,
      BeamType beamType,
      Optional<FilterDefinition> preFilterDefinition) {}
}
