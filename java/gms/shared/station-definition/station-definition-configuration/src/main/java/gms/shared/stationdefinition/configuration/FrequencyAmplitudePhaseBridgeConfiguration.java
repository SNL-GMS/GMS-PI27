package gms.shared.stationdefinition.configuration;

import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Retrieves {@link FrequencyAmplitudePhaseDefinition} objects from configuration, */
@Component
public class FrequencyAmplitudePhaseBridgeConfiguration {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(FrequencyAmplitudePhaseBridgeConfiguration.class);

  private static final String STATION_NAME_SELECTOR = "station";
  private static final String CHANNEL_NAME_SELECTOR = "channel";
  private static final String CHANNEL_GROUP_NAME_SELECTOR = "channelGroup";
  private static final String CHANNEL_BAND_NAME_SELECTOR = "channelBand";
  private static final String CHANNEL_INSTRUMENT_NAME_SELECTOR = "channelInstrument";

  @Value("${instrumentResponseDefinitionConfig}")
  public String instrumentResponseDefinitionConfig;

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  @Autowired
  public FrequencyAmplitudePhaseBridgeConfiguration(
      ConfigurationConsumerUtility configurationConsumerUtility) {

    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  /**
   * Retrieves the {@link FrequencyAmplitudePhaseDefinition} based on the input parameters. If there
   * are no matching definitions, a default all-encompassing definition will be returned.
   *
   * @param station the station name for the channel
   * @param fdsnChannelName the 3-character SEED/FDSN channel name
   * @param channelGroup the channel group
   * @param channelBand the channel band type code
   * @param channelInstrument the channel instrument type code
   * @return {@link FrequencyAmplitudePhaseDefinition} associated with provided {@link Channel}
   */
  public FrequencyAmplitudePhaseDefinition getFrequencyAmplitudePhaseDefinition(
      String station,
      String fdsnChannelName,
      String channelGroup,
      String channelBand,
      String channelInstrument) {

    var selectorList = new ArrayList<Selector<?>>();

    selectorList.addAll(
        List.of(
            Selector.from(STATION_NAME_SELECTOR, station),
            Selector.from(CHANNEL_NAME_SELECTOR, fdsnChannelName),
            Selector.from(CHANNEL_GROUP_NAME_SELECTOR, channelGroup),
            Selector.from(CHANNEL_BAND_NAME_SELECTOR, channelBand),
            Selector.from(CHANNEL_INSTRUMENT_NAME_SELECTOR, channelInstrument)));

    LOGGER.info("Querying for FrequencyAmplitudePhaseDefinition with parameters:{}", selectorList);

    return configurationConsumerUtility.resolve(
        instrumentResponseDefinitionConfig, selectorList, FrequencyAmplitudePhaseDefinition.class);
  }
}
