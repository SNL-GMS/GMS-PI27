package gms.shared.signaldetection.repository;

import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE;
import static gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnectorTypes.ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.Multimap;
import gms.shared.signaldetection.coi.detection.WaveformAndFilterDefinition;
import gms.shared.signaldetection.dao.css.AmplitudeDao;
import gms.shared.signaldetection.dao.css.AmplitudeDynParsIntDao;
import gms.shared.signaldetection.repository.utils.AmplitudeDaoAndChannelAssociation;
import gms.shared.signaldetection.util.SourcedWfdisc;
import gms.shared.signalenhancement.coi.types.FilterDefinitionUsage;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelSegmentDescriptor;
import gms.shared.stationdefinition.coi.filter.FilterDefinition;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.repository.BridgedChannelRepository;
import gms.shared.stationdefinition.repository.BridgedFilterDefinitionRepository;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** General-purpose utility class for use by BridgedSignalDetectionRepository. */
@Component
public class SdhBridgeHelperUtility {

  private static final Logger LOGGER = LoggerFactory.getLogger(SdhBridgeHelperUtility.class);

  private final BridgedChannelRepository channelRepository;
  private final SignalDetectionBridgeDatabaseConnectors signalDetectionBridgeDatabaseConnectors;
  private final BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository;

  public SdhBridgeHelperUtility(
      BridgedChannelRepository channelRepository,
      SignalDetectionBridgeDatabaseConnectors signalDetectionBridgeDatabaseConnectors,
      BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository) {

    this.channelRepository = channelRepository;
    this.signalDetectionBridgeDatabaseConnectors = signalDetectionBridgeDatabaseConnectors;
    this.bridgedFilterDefinitionRepository = bridgedFilterDefinitionRepository;
  }

  private Optional<Channel> createUnfilteredChannel(SourcedWfdisc sourcedWfdisc) {
    Channel channel = null;

    var wfdisc = sourcedWfdisc.getWfdiscDao();
    try {
      if (sourcedWfdisc.getAssociatedWfTagDao().isPresent()) {
        var wftag = sourcedWfdisc.getAssociatedWfTagDao().orElseThrow();
        LOGGER.debug(
            "Create Unfiltered Channel w/WFTAG - WFDISC: {}, STA/CHAN: {}/{}, WFTAG: {}",
            wfdisc.getId(),
            wfdisc.getStationCode(),
            wfdisc.getChannelCode(),
            wftag.getWfTagKey());
        channel =
            channelRepository.beamedChannelFromWfdisc(
                List.of(wfdisc.getId()),
                wftag.getWfTagKey().getTagName(),
                wftag.getWfTagKey().getId(),
                wfdisc.getTime(),
                wfdisc.getEndTime());
      } else {
        LOGGER.debug(
            "Create Unfiltered Channel no WFTAG - WFDISC: {}, STA/CHAN: {}/{}",
            wfdisc.getId(),
            wfdisc.getStationCode(),
            wfdisc.getChannelCode());
        channel =
            channelRepository.rawChannelFromWfdisc(
                List.of(wfdisc.getId()), wfdisc.getTime(), wfdisc.getEndTime());
      }
    } catch (IllegalArgumentException e) {
      LOGGER.warn(
          "Create SDH - Failed to bridge unfiltered channel for signal detection hypothesis,"
              + " no signal detection hypothesis will be returned",
          e);
    }

    if (channel == null) {
      LOGGER.debug(
          "Loading unfiltered channel from WFDISC resolved a 'null' channel. Returning empty"
              + " optional.");
    }
    return Optional.ofNullable(channel);
  }

  private Optional<Channel> createFilteredChannel(SourcedWfdisc sourcedWfdisc, long filterId) {
    Channel channel = null;

    var wfdisc = sourcedWfdisc.getWfdiscDao();
    try {
      if (sourcedWfdisc.getAssociatedWfTagDao().isPresent()) {
        var wftag = sourcedWfdisc.getAssociatedWfTagDao().orElseThrow();
        LOGGER.debug(
            "Create Filtered Channel w/WFTAG - WFDISC: {}, STA/CHAN: {}/{}, WFTAG: {}",
            wfdisc.getId(),
            wfdisc.getStationCode(),
            wfdisc.getChannelCode(),
            wftag.getWfTagKey());
        channel =
            channelRepository.filteredBeamedChannelFromWfdisc(
                List.of(wfdisc.getId()),
                wftag.getWfTagKey().getTagName(),
                wftag.getWfTagKey().getId(),
                wfdisc.getTime(),
                wfdisc.getEndTime(),
                filterId);
      } else {
        LOGGER.debug(
            "Create Filtered Channel no WFTAG - WFDISC: {}, STA/CHAN: {}/{}",
            wfdisc.getId(),
            wfdisc.getStationCode(),
            wfdisc.getChannelCode());
        channel =
            channelRepository.filteredRawChannelFromWfdisc(
                List.of(wfdisc.getId()), wfdisc.getTime(), wfdisc.getEndTime(), filterId);
      }
    } catch (IllegalArgumentException e) {
      LOGGER.warn(
          "Create SDH - Failed to bridge filtered channel for signal detection hypothesis,"
              + " no signal detection hypothesis will be returned",
          e);
    }

    if (channel == null) {
      LOGGER.debug(
          "Loading filtered channel from WFDISC resolved a 'null' channel. Returning empty"
              + " optional.");
    }
    return Optional.ofNullable(channel);
  }

  Optional<Channel> createFilteredChannelForArrival(
      SourcedWfdisc sourcedWfdisc, long arid, WorkflowDefinitionId stageId) {

    var wfdisc = sourcedWfdisc.getWfdiscDao();
    LOGGER.debug(
        "Create Filtered Channel for Arrival - STA/CHAN: {}/{}, Stage ID: {}",
        wfdisc.getStationCode(),
        wfdisc.getChannelCode(),
        stageId.getName());

    var adpiConnector =
        signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageId.getName(), ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE);

    var optionalFilterId = FilterIdUtility.getFilterIdForArid(adpiConnector, arid);

    try {
      return optionalFilterId
          .flatMap(filterId -> createFilteredChannel(sourcedWfdisc, filterId))
          .or(
              () -> {
                LOGGER.debug(
                    "Create Filtered Channel for Arrival - STA/CHAN: {}/{}, Stage ID: {} - Filtered"
                        + " Channel attempt failed. Attempting bridging unfiltered channel.",
                    wfdisc.getStationCode(),
                    wfdisc.getChannelCode(),
                    stageId.getName());
                return createUnfilteredChannel(sourcedWfdisc);
              });
    } catch (IllegalArgumentException e) {
      LOGGER.warn("Exception trying to create filtered arrival channel. Returning empty.", e);
      return Optional.empty();
    }
  }

  Optional<Channel> createFilteredChannelForAmplitude(
      SourcedWfdisc sourcedWfdisc, AmplitudeDao amplitudeDao, WorkflowDefinitionId stageId) {

    var wfdisc = sourcedWfdisc.getWfdiscDao();
    LOGGER.debug(
        "Create Filtered Channel for Amplitude {} - STA/CHAN: {}/{}, Stage ID: {}",
        amplitudeDao.getAmplitudeType(),
        wfdisc.getStationCode(),
        wfdisc.getChannelCode(),
        stageId.getName());

    var adpiConnector =
        signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageId.getName(), AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE);

    var optionalFilterId = FilterIdUtility.getFilterIdForAmpid(adpiConnector, amplitudeDao.getId());

    try {
      return optionalFilterId
          .flatMap(filterId -> createFilteredChannel(sourcedWfdisc, filterId))
          .or(
              () -> {
                LOGGER.debug(
                    "Create Filtered Channel for Amplitude {} - STA/CHAN: {}/{}, Stage ID: {} -"
                        + " Filtered Channel attempt failed. Attempting bridging unfiltered"
                        + " channel.",
                    amplitudeDao.getAmplitudeType(),
                    wfdisc.getStationCode(),
                    wfdisc.getChannelCode(),
                    stageId.getName());
                return createUnfilteredChannel(sourcedWfdisc);
              });
    } catch (IllegalArgumentException e) {
      LOGGER.warn("Exception trying to create filtered amplitude channel. Returning empty.", e);
      return Optional.empty();
    }
  }

  List<Pair<AmplitudeDao, Channel>> createAmplitudeDaoChannelMap(
      Collection<AmplitudeDao> amplitudeDaos,
      SourcedWfdisc sourcedWfdisc,
      WorkflowDefinitionId stageId) {
    return amplitudeDaos.stream()
        .distinct()
        // Create a Optional<Channel> from the amplitudeDao, then make that to an
        // Optional<Map,Entry>
        .map(
            amplitudeDao ->
                createFilteredChannelForAmplitude(sourcedWfdisc, amplitudeDao, stageId)
                    .map(channel -> Pair.of(amplitudeDao, channel)))
        // Use Optional::stream to create a stream of the map entry, or empty stream if it
        // was not created
        .flatMap(Optional::stream)
        .toList();
  }

  WaveformAndFilterDefinition createAnalysisWaveform(
      SourcedWfdisc sourcedWfdisc, long arid, WorkflowDefinitionId stageId) {

    var channel =
        createUnfilteredChannel(sourcedWfdisc)
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "createAnalysisWaveform - failed to retrieve unfiltered channel"));

    var adpiConnector =
        signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageId.getName(), ARRIVAL_DYN_PARS_INT_CONNECTOR_TYPE);

    var adpiDaoOptional = FilterIdUtility.getArrivalDynParsIntDaoForArid(adpiConnector, arid);

    // WaveformAndFilterDefinition builder takes Optionals, so just create
    // those optionals here.
    var filterDefinitionOptional =
        adpiDaoOptional.flatMap(
            adpi ->
                Optional.ofNullable(
                    bridgedFilterDefinitionRepository
                        .loadFilterDefinitionsForFilterIds(Set.of(adpi.getIvalue()))
                        .get(adpi.getIvalue())));

    if (adpiDaoOptional.isPresent() && filterDefinitionOptional.isEmpty()) {
      LOGGER.debug(
          "Found a filter ID but no filter definition: {}, {}, {}, {}",
          sourcedWfdisc,
          arid,
          stageId,
          adpiDaoOptional.get().getIvalue());
    }

    var filterDefinitionUsageOptional =
        adpiDaoOptional
            .map(adpi -> adpi.getArrivalDynParsIntKey().getGroupName())
            .map(FilterDefinitionUsage::fromString)
            // If no ADPI, then check if this is a beam channel, and return FK
            // if so.
            .or(
                () ->
                    sourcedWfdisc
                        .getAssociatedWfTagDao()
                        .map(dummyWfTagDao -> FilterDefinitionUsage.FK))
            // If not beam channel, return ONSET.
            .or(() -> Optional.of(FilterDefinitionUsage.ONSET));

    var wfdisc = sourcedWfdisc.getWfdiscDao();

    return WaveformAndFilterDefinition.builder()
        .setFilterDefinition(filterDefinitionOptional)
        .setFilterDefinitionUsage(filterDefinitionUsageOptional)
        .setWaveform(
            ChannelSegment.<Waveform>builder()
                .setId(
                    ChannelSegmentDescriptor.from(
                        Channel.createVersionReference(channel),
                        wfdisc.getTime(),
                        wfdisc.getEndTime(),
                        wfdisc.getTime()))
                .build())
        .build();
  }

  /**
   * Bridge waveforms and filter definitions for the passed amplitude daos.
   *
   * @param sourcedWfdisc @{link SourcedWfdisc} wfdisc that supplies the channel segment times.
   * @param amplitudeAssociations @{AmplitudeDaoAndChannelAssociation} bridge waveforms and filter
   *     definitions for these amplitude feature measurements
   * @param stageId @{WorkflowDefinitionId} bridge amplitude waveforms and filter definitions from
   *     this analyst stage
   * @return a map of ampIds to their bridged waveform and filter definitions.
   */
  Map<Long, WaveformAndFilterDefinition> createAmplitudeAnalysisWaveforms(
      SourcedWfdisc sourcedWfdisc,
      Collection<AmplitudeDaoAndChannelAssociation> amplitudeAssociations,
      WorkflowDefinitionId stageId) {
    var ampdpiConnector =
        signalDetectionBridgeDatabaseConnectors.getConnectorForCurrentStageOrThrow(
            stageId.getName(), AMPLITUDE_DYN_PARS_INT_CONNECTOR_TYPE);

    // Restructure amplitudeAssociations to facilitate the query for AmplitudeDynParsIntDaos
    var amplitudeAssociationForAmpId =
        amplitudeAssociations.stream()
            .collect(
                Collectors.toMap(
                    ampAssoc -> ampAssoc.getAmplitudeDao().getId(), Function.identity()));

    // Can return none, one, or many AmplitudeDynParsIntDaos per passed ampId.
    // Get all of the needed AmplitudeDynParsIntDao in one query.
    List<AmplitudeDynParsIntDao> ampdpiDaos =
        ampdpiConnector.findFilterAdpisByIds(amplitudeAssociationForAmpId.keySet());

    // Restructure the query results in order to select a single AmplitudeDynParsIntDao per ampId
    Multimap<Long, AmplitudeDynParsIntDao> ampdpiDaosForAmpIds = ArrayListMultimap.create();

    ampdpiDaos.forEach(
        ampdpiDao ->
            ampdpiDaosForAmpIds.put(ampdpiDao.getAmplitudeDynParsIntKey().getAmpid(), ampdpiDao));

    // For each ampId, select the AmplitudeDynParsIntDao with the most recent LDDATE
    List<AmplitudeDynParsIntDao> reducedAmpdpiDaos =
        ampdpiDaosForAmpIds.keySet().stream()
            .map(
                ampId ->
                    ampdpiDaosForAmpIds.get(ampId).stream()
                        .max(
                            (ampdpiDaoLeft, ampdpiDaoRight) ->
                                ampdpiDaoLeft.getLdDate().compareTo(ampdpiDaoRight.getLdDate())))
            .flatMap(Optional::stream)
            .toList();

    // Map <filterID, FilterDefinition>
    Map<Long, FilterDefinition> filterDefinitions =
        bridgedFilterDefinitionRepository.loadFilterDefinitionsForFilterIds(
            reducedAmpdpiDaos.stream().map(AmplitudeDynParsIntDao::getIvalue).toList());

    reducedAmpdpiDaos.stream()
        .filter(ampdpiDao -> !filterDefinitions.containsKey(ampdpiDao.getIvalue()))
        .forEach(
            ampdpiDao ->
                LOGGER.warn(
                    "Found a filter ID but no filter definition: {}, {}, {}, {}",
                    sourcedWfdisc,
                    ampdpiDao.getAmplitudeDynParsIntKey().getAmpid(),
                    stageId,
                    ampdpiDao.getIvalue()));

    return amplitudeAssociations.stream()
        .collect(
            Collectors.toMap(
                amplitudeAssociation -> amplitudeAssociation.getAmplitudeDao().getId(),
                amplitudeAssociation ->
                    buildWaveformAndFilterDefinition(
                        amplitudeAssociation.getAmplitudeDao().getId(),
                        filterDefinitions,
                        reducedAmpdpiDaos,
                        amplitudeAssociationForAmpId
                            .get(amplitudeAssociation.getAmplitudeDao().getId())
                            .getChannel(),
                        sourcedWfdisc.getWfdiscDao())));
  }

  private static WaveformAndFilterDefinition buildWaveformAndFilterDefinition(
      long ampid,
      Map<Long, FilterDefinition> filterDefinitions,
      List<AmplitudeDynParsIntDao> ampdpiDaos,
      Channel channel,
      WfdiscDao wfdisc) {

    var ampdipiDaoOpt =
        ampdpiDaos.stream()
            .filter(ampdpiDao -> ampdpiDao.getAmplitudeDynParsIntKey().getAmpid() == ampid)
            .findFirst();

    if (ampdipiDaoOpt.isEmpty()) {
      LOGGER.warn("Could not find an AmplitudeDynParsIntDao for AmpId:{}", ampid);
    }

    Optional<FilterDefinition> filterDefinition =
        ampdipiDaoOpt.isPresent()
            ? Optional.ofNullable(filterDefinitions.get(ampdipiDaoOpt.get().getIvalue()))
            : Optional.empty();

    Optional<FilterDefinitionUsage> filterDefinitionUsage =
        ampdipiDaoOpt.flatMap(
            ampDpiDao -> filterDefinition.map(filterDef -> parseGroupName(ampDpiDao)));

    return WaveformAndFilterDefinition.builder()
        .setFilterDefinition(filterDefinition)
        .setFilterDefinitionUsage(filterDefinitionUsage)
        .setWaveform(
            ChannelSegment.<Waveform>builder()
                .setId(
                    ChannelSegmentDescriptor.from(
                        Channel.createVersionReference(channel),
                        wfdisc.getTime(),
                        wfdisc.getEndTime(),
                        wfdisc.getTime()))
                .build())
        .build();
  }

  private static FilterDefinitionUsage parseGroupName(AmplitudeDynParsIntDao ampDpiDao) {
    var groupName = ampDpiDao.getAmplitudeDynParsIntKey().getGroupName();
    // cast MEASURE into an AMPLITUDE
    if ("measure".equalsIgnoreCase(groupName)) {
      groupName = "AMPLITUDE";
    }
    return FilterDefinitionUsage.fromString(groupName);
  }
}
