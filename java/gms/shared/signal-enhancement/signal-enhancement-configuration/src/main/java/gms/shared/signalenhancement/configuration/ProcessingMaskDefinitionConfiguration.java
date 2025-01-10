package gms.shared.signalenhancement.configuration;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.signalenhancement.coi.utils.ChannelComponents;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskConfigurationObject;
import gms.shared.stationdefinition.coi.qc.ProcessingMaskDefinition;
import gms.shared.stationdefinition.coi.qc.ProcessingOperation;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/** Retrieves {@link ProcessingMaskDefinition} objects from configuration, */
@Configuration
public class ProcessingMaskDefinitionConfiguration {

  private static final String STATION_NAME_SELECTOR = "station";
  private static final String CHANNEL_NAME_SELECTOR = "channel";
  private static final String CHANNEL_GROUP_NAME_SELECTOR = "channelGroup";
  private static final String CHANNEL_BAND_NAME_SELECTOR = "channelBand";
  private static final String CHANNEL_INSTRUMENT_NAME_SELECTOR = "channelInstrument";
  private static final String PHASE_TYPE_NAME_SELECTOR = "phaseType";
  private static final String PROCESSING_OPERATION_NAME_SELECTOR = "processingOperation";

  private static final String CHANNEL_NULL_STR = "Channel should not be null";
  private static final String PHASETYPE_NULL_STR = "PhaseType should not be null";
  private static final String PROCESSINGOPERATION_NULL_STR =
      "ProcessingOperation should not be null";

  @Value("${processingMaskDefinitionConfig}")
  public String processingMaskDefinitionConfig;

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  @Autowired
  public ProcessingMaskDefinitionConfiguration(
      ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  /**
   * Retrieves the {@link ProcessingMaskDefinition} based on the input parameters. If there are no
   * matching definitions, a default all encompassing definition will be returned
   *
   * @param processingOperation {@link ProcessingOperation} to use in configuration query
   * @param channel {@link Channel} to use in configuration query
   * @param phaseType {@link PhaseType} to use in configuration query
   * @return Populated {@link ProcessingMaskDefinition} object
   */
  public ProcessingMaskDefinition getProcessingMaskDefinition(
      ProcessingOperation processingOperation, Channel channel, PhaseType phaseType) {

    return getProcessingMaskDefinition(processingOperation, channel, phaseType, List.of());
  }

  /**
   * Retrieves the {@link ProcessingMaskDefinition} based on the input parameters. If there are no
   * matching definitions, a default all encompassing definition will be returned
   *
   * @param processingOperation {@link ProcessingOperation} to use in configuration query
   * @param channel {@link Channel} to use in configuration query
   * @param phaseType {@link PhaseType} to use in configuration query
   * @param extraSelectors List of extra {@link Selector} object used to narrow down the search
   * @return Populated {@link ProcessingMaskDefinition} object
   */
  private ProcessingMaskDefinition getProcessingMaskDefinition(
      ProcessingOperation processingOperation,
      Channel channel,
      PhaseType phaseType,
      List<? extends Selector<?>> extraSelectors) {

    checkNotNull(processingOperation, PROCESSINGOPERATION_NULL_STR);
    checkNotNull(channel, CHANNEL_NULL_STR);
    checkNotNull(phaseType, PHASETYPE_NULL_STR);

    var channelComponents = ChannelComponents.fromChannelName(channel.getName());
    var station = channelComponents.stationName();
    var channelGroup = channelComponents.channelGroupName();
    var channelName = channelComponents.shortChannelName();

    var channelBand = String.valueOf(channelComponents.channelCode().getBandType().getCode());
    var channelInstrument =
        String.valueOf(channelComponents.channelCode().getInstrumentType().getCode());
    var selectorList = new ArrayList<Selector<?>>();

    selectorList.addAll(
        List.of(
            Selector.from(PROCESSING_OPERATION_NAME_SELECTOR, processingOperation.toString()),
            Selector.from(PHASE_TYPE_NAME_SELECTOR, phaseType.toString()),
            Selector.from(STATION_NAME_SELECTOR, station),
            Selector.from(CHANNEL_NAME_SELECTOR, channelName),
            Selector.from(CHANNEL_GROUP_NAME_SELECTOR, channelGroup),
            Selector.from(CHANNEL_BAND_NAME_SELECTOR, channelBand),
            Selector.from(CHANNEL_INSTRUMENT_NAME_SELECTOR, channelInstrument)));

    selectorList.addAll(extraSelectors);

    var configurationObject =
        configurationConsumerUtility.resolve(
            processingMaskDefinitionConfig, selectorList, ProcessingMaskConfigurationObject.class);

    return new ProcessingMaskDefinition(configurationObject, processingOperation);
  }
}
