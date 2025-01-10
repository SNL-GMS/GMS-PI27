package gms.shared.stationdefinition.repository;

import gms.shared.stationdefinition.api.channel.FrequencyAmplitudePhaseRepository;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.configuration.FrequencyAmplitudePhaseBridgeConfiguration;
import gms.shared.stationdefinition.configuration.FrequencyAmplitudePhaseDefinition;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.database.connector.InstrumentDatabaseConnector;
import gms.shared.stationdefinition.repository.util.InstrumentResponseFileToFapConverter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * A {@link FrequencyAmplitudePhaseRepository} implementation that uses the bridged database to
 * provide {@link FrequencyAmplitudePhase} instances
 */
@Component("bridgedFrequencyAmplitudePhaseRepository")
public class BridgedFrequencyAmplitudePhaseRepository implements FrequencyAmplitudePhaseRepository {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(BridgedFrequencyAmplitudePhaseRepository.class);

  private static final Pattern CHANNEL_NAME_PATTERN =
      Pattern.compile(
          "(.*?)"
              + Pattern.quote(Channel.NAME_SEPARATOR)
              + "(.*?)"
              + Pattern.quote(Channel.NAME_SEPARATOR)
              + "(.*?)("
              + Pattern.quote(Channel.COMPONENT_SEPARATOR)
              + ".*|$)");
  private static final int STATION_INDEX = 1;
  private static final int GROUP_INDEX = 2;
  private static final int FDSN_INDEX = 3;

  private final StationDefinitionIdUtility stationDefinitionIdUtility;
  private final InstrumentDatabaseConnector instrumentDatabaseConnector;
  private final FrequencyAmplitudePhaseBridgeConfiguration
      frequencyAmplitudePhaseBridgeConfiguration;

  @Autowired
  public BridgedFrequencyAmplitudePhaseRepository(
      StationDefinitionIdUtility stationDefinitionIdUtility,
      InstrumentDatabaseConnector instrumentDatabaseConnector,
      FrequencyAmplitudePhaseBridgeConfiguration frequencyAmplitudePhaseBridgeConfiguration) {
    this.stationDefinitionIdUtility = stationDefinitionIdUtility;
    this.instrumentDatabaseConnector = instrumentDatabaseConnector;
    this.frequencyAmplitudePhaseBridgeConfiguration = frequencyAmplitudePhaseBridgeConfiguration;
  }

  /**
   * Returns a {@link FrequencyAmplitudePhase} object corresponding to the passed {@link UUID}
   *
   * @param id the {@link UUID} of the desired {@link FrequencyAmplitudePhase} object
   * @return the {@link FrequencyAmplitudePhase} corresponding to the passed {@link UUID}; this
   *     {@link FrequencyAmplitudePhase} is an entity reference if an error was encountered or fully
   *     populated otherwise
   */
  @Override
  public FrequencyAmplitudePhase findFrequencyAmplitudePhaseById(UUID id) {

    var fapDefOpt = getFapDefOptional(id);
    if (fapDefOpt.isEmpty()) {
      return FrequencyAmplitudePhase.createEntityReference(id);
    }

    var instrumentDaoOpt = getInstrumentDaoOptional(id);
    if (instrumentDaoOpt.isEmpty()) {
      return FrequencyAmplitudePhase.createEntityReference(id);
    }

    // The optionals have already been verified
    var instrumentDao = instrumentDaoOpt.get();
    var fapDef = fapDefOpt.get();
    var channelDataType = getChannelDataType(id);

    return InstrumentResponseFileToFapConverter.convertFileToFrequencyAmplitudePhase(
        instrumentDao, fapDef, id, channelDataType);
  }

  /** Gets the FAPDefinition based on the id; returns empty Optional on error */
  private Optional<FrequencyAmplitudePhaseDefinition> getFapDefOptional(UUID id) {
    var channelNameOpt =
        stationDefinitionIdUtility.retrieveChannelNameFromFrequencyAmplitudePhaseUUID(id);
    if (channelNameOpt.isEmpty()) {
      LOGGER.error("Channel name not found for FAP UUID: {}", id);
      return Optional.empty();
    }
    var channelName = channelNameOpt.get();

    Optional<FrequencyAmplitudePhaseDefinition> fapDefOpt;
    var matcher = CHANNEL_NAME_PATTERN.matcher(channelName);
    if (matcher.find()) {
      var fdsnChannelName = matcher.group(FDSN_INDEX);

      var channelTypesOpt = ChannelTypesParser.parseChannelTypes(fdsnChannelName);
      if (channelTypesOpt.isEmpty()) {
        LOGGER.error("Channel name {} did not parse into types for FAP UUID: {}", channelName, id);
        return Optional.empty();
      }
      var channelTypes = channelTypesOpt.get();

      var channelBand = String.valueOf(channelTypes.getBandType().getCode());
      var channelInstrument = String.valueOf(channelTypes.getInstrumentType().getCode());
      var station = matcher.group(STATION_INDEX);
      var channelGroup = matcher.group(GROUP_INDEX);

      fapDefOpt =
          Optional.of(
              frequencyAmplitudePhaseBridgeConfiguration.getFrequencyAmplitudePhaseDefinition(
                  station, fdsnChannelName, channelGroup, channelBand, channelInstrument));
    } else {
      LOGGER.error(
          "Channel name {} did not parse into station/group/fdsn for FAP UUID: {}",
          channelName,
          id);
      fapDefOpt = Optional.empty();
    }

    return fapDefOpt;
  }

  /** Gets the InstrumentDao based on the id; returns empty Optional on error */
  private Optional<InstrumentDao> getInstrumentDaoOptional(UUID id) {
    var instrumentDaoIdOpt =
        stationDefinitionIdUtility.retrieveInstrumentIdFromFrequencyAmplitudePhaseUUID(id);
    if (instrumentDaoIdOpt.isEmpty()) {
      LOGGER.error("InstrumentDao ID not found for FAP UUID: {}", id);
      return Optional.empty();
    }
    var instrumentDaoId = instrumentDaoIdOpt.get();

    var daoList = instrumentDatabaseConnector.findInstruments(List.of(instrumentDaoId));
    if (daoList.isEmpty()) {
      LOGGER.error(
          "InstrumentDao not found for InstrumentDao ID: {} / FAP UUID: {}", instrumentDaoId, id);
      return Optional.empty();
    } else if (daoList.size() > 1) {
      LOGGER.warn(
          "Multiple InstrumentDaos found for InstrumentDao ID: {} - using the first result",
          instrumentDaoId);
    } else {
      // we will use the first element for all lists
    }

    return Optional.of(daoList.get(0));
  }

  /** Gets the Channel Data Type; the optional and the match have already been verified */
  private ChannelDataType getChannelDataType(UUID id) {
    var channelName =
        stationDefinitionIdUtility
            .retrieveChannelNameFromFrequencyAmplitudePhaseUUID(id)
            .orElseThrow();

    var matcher = CHANNEL_NAME_PATTERN.matcher(channelName);

    matcher.find();
    var fdsnChannelName = matcher.group(FDSN_INDEX);

    return ChannelTypesParser.parseChannelTypes(fdsnChannelName).orElseThrow().getDataType();
  }
}
