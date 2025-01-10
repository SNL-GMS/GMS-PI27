package gms.shared.signalenhancement.configuration;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.common.coi.types.SamplingType;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.signalenhancement.coi.rotation.RotationDescription;
import gms.shared.signalenhancement.coi.rotation.RotationTemplate;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.station.Station;
import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Processing configuration resolver for Rotation COI */
@Component
public class RotationConfiguration {

  private static final String STATION_NAME_SELECTOR = "station";
  private static final String PHASE_NAME_SELECTOR = "phase";

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  @Value("${rotationTemplateConfig}")
  public String rotationTemplateConfig;

  @Autowired
  public RotationConfiguration(ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  /**
   * Resolve a {@link RotationTemplate} from processing configuration
   *
   * @param station Station to constrain resolution by
   * @param phase Phase to constrain resolution by
   * @return A {@link RotationTemplate} from processing configuration
   * @throws IllegalArgumentException when the resolved configuration map is not mappable to a
   *     {@link RotationTemplate}
   * @throws NullPointerException when the resolved configuration map is missing required {@link
   *     RotationTemplate} fields
   */
  public RotationTemplate getRotationTemplate(Station station, PhaseType phase) {

    var stationNameSelector = Selector.from(STATION_NAME_SELECTOR, station.getName());
    var phaseNameSelector = Selector.from(PHASE_NAME_SELECTOR, phase.getLabel());

    return configurationConsumerUtility.resolve(
        rotationTemplateConfig,
        List.of(stationNameSelector, phaseNameSelector),
        RotationTemplateParams.class,
        rtp -> rtFromParams(station, phase, rtp));
  }

  private static RotationTemplate rtFromParams(
      Station station, PhaseType phase, RotationTemplateParams rtParams) {
    var rtBuilder =
        RotationTemplate.builder()
            .setStation(station.toEntityReference())
            .setLeadDuration(rtParams.leadDuration)
            .setDuration(rtParams.duration)
            .setLocationToleranceKm(rtParams.locationToleranceKm)
            .setSampleRateToleranceHz(rtParams.sampleRateToleranceHz)
            .setOrientationAngleToleranceDeg(rtParams.orientationAngleToleranceDeg)
            .setRotationDescription(
                new RotationDescription(phase, rtParams.samplingType, rtParams.twoDimensional));

    rtParams.inputChannels.ifPresent(rtBuilder::setInputChannels);
    rtParams.inputChannelGroup.ifPresent(rtBuilder::setInputChannelGroup);

    return rtBuilder.build();
  }

  private record RotationTemplateParams(
      Duration duration,
      Optional<Collection<Channel>> inputChannels,
      Optional<ChannelGroup> inputChannelGroup,
      Duration leadDuration,
      double locationToleranceKm,
      double orientationAngleToleranceDeg,
      SamplingType samplingType,
      boolean twoDimensional,
      double sampleRateToleranceHz) {}
}
