package gms.shared.stationdefinition.repository;

import static gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType.BEAM_TYPE;
import static gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType.BRIDGED;

import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import com.google.common.collect.TreeRangeMap;
import gms.shared.common.coi.types.BeamSummation;
import gms.shared.derivedchannel.coi.BeamDefinition;
import gms.shared.derivedchannel.coi.BeamDescription;
import gms.shared.derivedchannel.coi.BeamParameters;
import gms.shared.derivedchannel.coi.BeamformingTemplate;
import gms.shared.event.coi.EventHypothesis;
import gms.shared.stationdefinition.api.channel.ChannelRepository;
import gms.shared.stationdefinition.cache.DerivedChannelVersionCache;
import gms.shared.stationdefinition.cache.util.DerivedChannelIdComponents;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.BeamType;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.Orientation;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.configuration.StationDefinitionBridgeConfiguration;
import gms.shared.stationdefinition.converter.util.StationDefinitionDataHolder;
import gms.shared.stationdefinition.converter.util.assemblers.ChannelAssembler;
import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.StationChannelTimeKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.css.enums.ChannelType;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import gms.shared.stationdefinition.database.connector.BeamDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.repository.util.ChannelFactory;
import gms.shared.stationdefinition.repository.util.CssCoiConverterUtility;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** A {@link ChannelAccessorInterface} implementation that uses a bridged database */
@Component("bridgedChannelRepository")
public class BridgedChannelRepository implements ChannelRepository {

  private static final Logger LOGGER = LoggerFactory.getLogger(BridgedChannelRepository.class);

  private static final String SITECHAN_ERR = "No sitechan from which to load channel";
  private static final String SITE_ERR = "No site from which to load channel";
  private static final String WFDISC_ERR = "No wfdisc from which to load channel";
  private static final String BEAM_LITERAL = "beam";
  private static final String NONE_LITERAL = "NONE";
  private static final String SZB_RECIPE = "szb";

  private final BeamDatabaseConnector beamDatabaseConnector;
  private final SiteDatabaseConnector siteDatabaseConnector;
  private final SiteChanDatabaseConnector siteChanDatabaseConnector;
  private final SensorDatabaseConnector sensorDatabaseConnector;
  private final WfdiscDatabaseConnector wfdiscDatabaseConnector;
  private final BridgedResponseRepository responseRepository;
  private final BridgedStationRepository stationRepository;
  private final ChannelAssembler channelAssembler;
  private final StationDefinitionIdUtility stationDefinitionIdUtility;
  private final DerivedChannelVersionCache versionCache;
  private final BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository;
  private final StationDefinitionBridgeConfiguration stationDefinitionBridgeConfiguration;

  @Autowired
  public BridgedChannelRepository(
      BeamDatabaseConnector beamDatabaseConnector,
      SiteDatabaseConnector siteDatabaseConnector,
      SiteChanDatabaseConnector siteChanDatabaseConnector,
      SensorDatabaseConnector sensorDatabaseConnector,
      WfdiscDatabaseConnector wfdiscDatabaseConnector,
      ChannelAssembler channelAssembler,
      StationDefinitionIdUtility stationDefinitionIdUtility,
      DerivedChannelVersionCache versionCache,
      BridgedResponseRepository responseRepository,
      BridgedStationRepository stationRepository,
      BridgedFilterDefinitionRepository bridgedFilterDefinitionRepository,
      StationDefinitionBridgeConfiguration stationDefinitionBridgeConfiguration) {
    this.beamDatabaseConnector = beamDatabaseConnector;
    this.siteDatabaseConnector = siteDatabaseConnector;
    this.siteChanDatabaseConnector = siteChanDatabaseConnector;
    this.sensorDatabaseConnector = sensorDatabaseConnector;
    this.wfdiscDatabaseConnector = wfdiscDatabaseConnector;
    this.channelAssembler = channelAssembler;
    this.stationDefinitionIdUtility = stationDefinitionIdUtility;
    this.versionCache = versionCache;
    this.responseRepository = responseRepository;
    this.stationRepository = stationRepository;
    this.bridgedFilterDefinitionRepository = bridgedFilterDefinitionRepository;
    this.stationDefinitionBridgeConfiguration = stationDefinitionBridgeConfiguration;
  }

  @Override
  public List<Channel> findChannelsByNameAndTime(List<String> channelNames, Instant effectiveAt) {
    Objects.requireNonNull(channelNames, "channelNames must not be null");
    Preconditions.checkState(!channelNames.isEmpty());

    // look for derived channels
    var derivedChannels = findDerivedCachedChannelsByTime(channelNames, effectiveAt);

    List<SiteChanKey> siteChanKeys =
        CssCoiConverterUtility.getSiteChanKeysFromChannelNames(channelNames);

    var channels = new ArrayList<Channel>();
    channels.addAll(findChannelsBySiteChanKeysAndTime(siteChanKeys, effectiveAt));

    var channelNamesSet = channels.stream().map(Channel::getName).collect(Collectors.toSet());

    // because derived channel cache can sometimes contain raw channels,
    // only add channels not already found in raw channels
    for (var derivedChannel : derivedChannels) {
      if (!channelNamesSet.contains(derivedChannel.getName())) {
        channels.add(derivedChannel);
      }
    }

    return channels;
  }

  private List<Channel> findChannelsBySiteChanKeysAndTime(
      List<SiteChanKey> siteChanKeys, Instant effectiveAt) {

    StationDefinitionDataHolder data =
        BridgedRepositoryUtils.findDataByTimeForChannel(
            siteChanKeys,
            effectiveAt,
            siteDatabaseConnector,
            siteChanDatabaseConnector,
            sensorDatabaseConnector,
            wfdiscDatabaseConnector);

    Pair<Instant, Instant> minMaxTimes =
        BridgedRepositoryUtils.getMinMaxFromSiteChanDaos(
            data.getSiteChanDaos(), effectiveAt, effectiveAt);

    List<Response> responses =
        responseRepository.findResponsesGivenSensorAndWfdisc(
            data,
            minMaxTimes.getLeft(),
            minMaxTimes.getRight() == Instant.MAX ? Instant.now() : minMaxTimes.getRight());

    var channels =
        channelAssembler.buildAllForTime(
            effectiveAt,
            data.getSiteDaos(),
            data.getSiteChanDaos(),
            data.getSensorDaos(),
            data.getWfdiscVersions(),
            responses,
            data.getStartEndBoolean());

    // now find correct stations for time
    List<String> stationNames =
        channels.stream()
            .map(Functions.compose(Station::getName, Channel::getStation))
            .distinct()
            .toList();

    Map<String, Station> stationNameMap =
        stationRepository.findStationsByNameAndTime(stationNames, effectiveAt).stream()
            .collect(Collectors.toMap(Station::getName, Functions.identity()));

    channels =
        channels.stream()
            .map(
                (Channel channel) -> {
                  var posStation = stationNameMap.get(channel.getStation().getName());
                  var newchan = channel;
                  if (posStation != null && posStation.getEffectiveAt().isPresent()) {
                    newchan =
                        channel.toBuilder()
                            .setData(
                                channel.getData().get().toBuilder()
                                    .setStation(
                                        Station.createVersionReference(
                                            posStation.getName(),
                                            posStation.getEffectiveAt().get()))
                                    .build())
                            .build();
                  }

                  return newchan;
                })
            .toList();

    cacheResponseIds(channels);
    return channels;
  }

  @Override
  public List<Channel> findChannelsByNameAndTimeRange(
      List<String> channelNames, Instant startTime, Instant endTime) {
    Objects.requireNonNull(channelNames, "channelNames must not be null");
    Preconditions.checkState(!channelNames.isEmpty());
    Preconditions.checkState(startTime.isBefore(endTime));
    List<SiteChanKey> siteChanKeys =
        CssCoiConverterUtility.getSiteChanKeysFromChannelNames(channelNames);

    var channels = findDerivedCachedChannelByIdAndTimeRange(channelNames, startTime, endTime);

    StationDefinitionDataHolder data =
        BridgedRepositoryUtils.findDataByTimeRangeForChannel(
            siteChanKeys,
            startTime,
            endTime,
            siteDatabaseConnector,
            siteChanDatabaseConnector,
            sensorDatabaseConnector,
            wfdiscDatabaseConnector);

    Pair<Instant, Instant> minMaxTimes =
        BridgedRepositoryUtils.getMinMaxFromSiteChanDaos(
            data.getSiteChanDaos(), startTime, endTime);

    List<Response> responses =
        responseRepository.findResponsesGivenSensorAndWfdisc(
            data,
            minMaxTimes.getLeft(),
            minMaxTimes.getRight() == Instant.MAX ? Instant.now() : minMaxTimes.getRight());

    channels =
        Stream.concat(
                channels.stream(),
                channelAssembler
                    .buildAllForTimeRange(
                        startTime,
                        endTime,
                        data.getSiteDaos(),
                        data.getSiteChanDaos(),
                        data.getSensorDaos(),
                        data.getWfdiscVersions(),
                        responses,
                        data.getStartEndBoolean())
                    .stream())
            .toList();

    cacheResponseIds(channels);

    return channels;
  }

  /**
   * Finds a {@link Channel} using the provided wfdisc record identifier (i.e. wfid) to bridge the
   * RAW or DERIVED Channel associated with a particular ChannelSegment&lt;Waveform&gt This method
   * has no AssociatedRecordType, associatedRecordId or filter ID
   *
   * @param wfids List of wfdisc record identifiers
   * @param channelEffectiveTime the time at which the channel is effective
   * @param channelEndTime the time at which the channel is no longer effective
   * @return a {@link Channel} meeting or derived from the provided criteria
   */
  public Channel rawChannelFromWfdisc(
      List<Long> wfids, Instant channelEffectiveTime, Instant channelEndTime) {
    Preconditions.checkState(
        channelEffectiveTime.isBefore(channelEndTime),
        "Attempting to load channel from wfdisc, channel effective time must be before channel end"
            + " time");

    return createRawChannel(wfids, channelEffectiveTime).orElse(null);
  }

  /**
   * Finds a {@link Channel} using the provided wfdisc record identifier (i.e. wfid) to bridge the
   * RAW or DERIVED Channel associated with a particular ChannelSegment&lt;Waveform&gt. This method
   * has no AssociatedRecordType or associatedRecordId
   *
   * @param wfids List of wfdisc record identifiers
   * @param channelEffectiveTime the time at which the channel is effective
   * @param channelEndTime the time at which the channel is no longer effective
   * @param filterId parameter used for filtering operations
   * @return a {@link Channel} meeting or derived from the provided criteria
   */
  public Channel filteredRawChannelFromWfdisc(
      List<Long> wfids, Instant channelEffectiveTime, Instant channelEndTime, Long filterId) {

    var filterDefinition =
        bridgedFilterDefinitionRepository
            .loadFilterDefinitionsForFilterIds(Set.of(filterId))
            .get(filterId);

    if (filterDefinition == null) {
      LOGGER.debug(
          "Failed to bridge FilterDefinition from FILTERID {},"
              + " will attempt to bridge unfiltered channel instead.",
          filterId);
      return rawChannelFromWfdisc(wfids, channelEffectiveTime, channelEndTime);
    } else {
      var wfid = wfids.get(0);

      var id = DerivedChannelIdComponents.builder().setFilterId(filterId).setWfid(wfid).build();

      var cachedChannel = retrieveChannelFromCache(id);
      if (cachedChannel != null) {
        return cachedChannel;
      }

      var filteredChannel =
          ChannelFactory.createFiltered(
              rawChannelFromWfdisc(wfids, channelEffectiveTime, channelEndTime), filterDefinition);

      if (filteredChannel == null) {
        LOGGER.debug("Bridging filtered channel returned 'null'. Returning null channel");
        return null;
      } else {
        // store the built derived channel using record type, record id and wfid
        id = DerivedChannelIdComponents.builder().setWfid(wfid).setFilterId(filterId).build();
        stationDefinitionIdUtility.storeDerivedChannelMapping(id, filteredChannel);
        cacheVersion(filteredChannel);
        return filteredChannel;
      }
    }
  }

  /**
   * Finds a {@link Channel} using the provided wfdisc record identifier (i.e. wfid) to bridge the
   * RAW or DERIVED Channel associated with a particular ChannelSegment&lt;Waveform&gt This method
   * AssociatedRecordType and associatedRecordId and no Filter ID
   *
   * @param wfids List of wfdisc record identifiers
   * @param associatedRecordType record type, e.g. arrival or origin
   * @param associatedRecordId associated record id, arid or orid
   * @param channelEffectiveTime the time at which the channel is effective
   * @param channelEndTime the time at which the channel is no longer effective
   * @return a {@link Channel} meeting or derived from the provided criteria
   */
  public Channel beamedChannelFromWfdisc(
      List<Long> wfids,
      TagName associatedRecordType,
      Long associatedRecordId,
      Instant channelEffectiveTime,
      Instant channelEndTime) {

    // create channel using Event or FK Beam
    // ensure that we have exactly one wfid
    Preconditions.checkState(
        wfids.size() == 1,
        "Attempting to load channel from wfdisc, must contain a single wfid for derived channels");

    Preconditions.checkState(associatedRecordType != null, "associatedRecordType cannot be null");

    Preconditions.checkState(associatedRecordId != null, "associatedRecordId cannot be null");

    var wfid = wfids.get(0);

    final var id =
        DerivedChannelIdComponents.builder()
            .setWfid(wfid)
            .setAssociatedRecordInfo(
                DerivedChannelIdComponents.AssociatedRecordInfo.create(
                    associatedRecordType, associatedRecordId))
            .build();

    var cachedChannel = retrieveChannelFromCache(id);
    if (cachedChannel != null) {
      return cachedChannel;
    }

    // create the beam derived channel
    var beamDerivedChannel =
        createBeamDerivedChannel(
            wfid, associatedRecordType, associatedRecordId, channelEffectiveTime, channelEndTime);

    beamDerivedChannel.ifPresentOrElse(
        (Channel newChannel) -> {
          // store the built derived channel using record type, record id and wfid
          stationDefinitionIdUtility.storeDerivedChannelMapping(id, newChannel);
          cacheVersion(newChannel);
        },
        () ->
            LOGGER.debug("Attempt to bridge BEAM derived channel failed. Returning null channel."));

    return beamDerivedChannel.orElse(null);
  }

  /**
   * Finds a {@link Channel} using the provided wfdisc record identifier (i.e. wfid) to bridge the
   * RAW or DERIVED Channel associated with a particular ChannelSegment&lt;Waveform&gt; This is the
   * most general form of this filteredBeamedChannelFromWfdisc method.
   *
   * @param wfids List of wfdisc record identifiers
   * @param associatedRecordType record type, e.g. arrival or origin
   * @param associatedRecordId associated record id, arid or orid
   * @param channelEffectiveTime the time at which the channel is effective
   * @param channelEndTime the time at which the channel is no longer effective
   * @param filterId parameter used for filtering operations
   * @return a {@link Channel} meeting or derived from the provided criteria
   */
  public Channel filteredBeamedChannelFromWfdisc(
      List<Long> wfids,
      TagName associatedRecordType,
      Long associatedRecordId,
      Instant channelEffectiveTime,
      Instant channelEndTime,
      Long filterId) {

    var filterDefinition =
        bridgedFilterDefinitionRepository
            .loadFilterDefinitionsForFilterIds(Set.of(filterId))
            .get(filterId);

    if (filterDefinition == null) {
      LOGGER.debug(
          "Failed to bridge FilterDefinition from FILTERID {},"
              + " will attempt to bridge unfiltered channel instead.",
          filterId);
      return beamedChannelFromWfdisc(
          wfids, associatedRecordType, associatedRecordId, channelEffectiveTime, channelEndTime);
    } else {
      var wfid = wfids.get(0);

      var id =
          DerivedChannelIdComponents.builder()
              .setWfid(wfid)
              .setFilterId(filterId)
              .setAssociatedRecordInfo(
                  DerivedChannelIdComponents.AssociatedRecordInfo.create(
                      associatedRecordType, associatedRecordId))
              .build();

      var cachedChannel = retrieveChannelFromCache(id);
      if (cachedChannel != null) {
        return cachedChannel;
      }

      // Bridge unfiltered channel
      var channel =
          beamedChannelFromWfdisc(
              wfids,
              associatedRecordType,
              associatedRecordId,
              channelEffectiveTime,
              channelEndTime);

      // If we got a unfiltered channel, filter it
      if (channel != null) {
        channel.getStation();
        channel = ChannelFactory.createFiltered(channel, filterDefinition);

        id =
            DerivedChannelIdComponents.builder()
                .setWfid(wfid)
                .setFilterId(filterId)
                .setAssociatedRecordInfo(
                    DerivedChannelIdComponents.AssociatedRecordInfo.create(
                        associatedRecordType, associatedRecordId))
                .build();
        stationDefinitionIdUtility.storeDerivedChannelMapping(id, channel);
        cacheVersion(channel);
      }

      return channel;
    }
  }

  /**
   * Create event beam derived channel
   *
   * @param wfdiscDao wfdiscDao input
   * @param associatedRecordType record type for input beam type
   * @param associatedRecordId record id for derived channel
   * @param eventHypothesis eventHypothesis for beam
   * @param channelEffectiveTime channel query effective time
   * @param channelEndTime channel query end time
   * @return derived {@link Channel}
   */
  public Optional<Channel> createEventBeamDerivedChannel(
      WfdiscDao wfdiscDao,
      TagName associatedRecordType,
      Long associatedRecordId,
      EventHypothesis eventHypothesis,
      Instant channelEffectiveTime,
      Instant channelEndTime) {

    Optional<Channel> optionalBeamDerivedChannel = Optional.empty();

    Optional<Station> optionalStaCode = getStationCode(wfdiscDao, channelEffectiveTime);

    if (optionalStaCode.isPresent()) {
      var station = optionalStaCode.get();
      Optional<BeamDao> optionalBeamDao = beamDatabaseConnector.findBeamForWfid(wfdiscDao.getId());

      if (optionalBeamDao.isPresent()) {
        var beamDao = optionalBeamDao.get();
        var beamType = BeamType.EVENT;
        var descriptionString = beamDao.getDescription();
        String beamDescriptionRecipe = getBeamDescriptionRecipe(descriptionString);
        var phaseMap =
            stationDefinitionBridgeConfiguration.getBeamPhase().getPhaseTypesByBeamDescriptions();
        var phase = phaseMap.get(beamDescriptionRecipe);

        Optional<BeamformingTemplate> optionalBeamformingTemplate =
            stationDefinitionBridgeConfiguration.getBeamformingTemplate(station, phase, beamType);
        if (optionalBeamformingTemplate.isPresent()) {

          var beamformingTemplate = optionalBeamformingTemplate.get();
          Pair<TagName, Long> assocRecordPair = Pair.of(associatedRecordType, associatedRecordId);
          optionalBeamDerivedChannel =
              createOptionalBeamDerivedChannel(
                  beamDao,
                  station,
                  channelEffectiveTime,
                  wfdiscDao,
                  beamformingTemplate,
                  eventHypothesis,
                  assocRecordPair);
        }

      } else {
        LOGGER.error("No BeamDao found in DB for wfid: {}", wfdiscDao.getId());
      }
    }

    return optionalBeamDerivedChannel;
  }

  private Optional<Channel> createOptionalBeamDerivedChannel(
      BeamDao beamDao,
      Station station,
      Instant channelEffectiveTime,
      WfdiscDao wfdiscDao,
      BeamformingTemplate beamformingTemplate,
      EventHypothesis eventHypothesis,
      Pair<TagName, Long> assocRecordPair) {
    Optional<Channel> optionalBeamDerivedChannel = Optional.empty();

    var inputChannelNames =
        beamformingTemplate.getInputChannels().stream().map(Channel::getName).toList();
    var inputChannels = findChannelsByNameAndTime(inputChannelNames, channelEffectiveTime);

    if (!inputChannels.isEmpty()) {
      Optional<SiteChanDao> optionalSiteChanDao = getOptionalSiteChanDao(wfdiscDao);

      if (optionalSiteChanDao.isPresent()) {
        var siteChanDao = optionalSiteChanDao.get();
        var beamDescription = beamformingTemplate.getBeamDescription();

        setBeamSummation(siteChanDao, beamDescription);

        var beamParameters =
            BeamParameters.builder()
                .setEventHypothesis(eventHypothesis)
                .setSampleRateToleranceHz(beamformingTemplate.getSampleRateToleranceHz())
                .setSampleRateHz(50.0)
                .setReceiverToSourceAzimuthDeg(beamDao.getAzimuth())
                .setOrientationAngles(Orientation.from(Optional.empty(), Optional.empty()))
                .setLocation(station.getLocation())
                .setOrientationAngleToleranceDeg(
                    beamformingTemplate.getOrientationAngleToleranceDeg())
                .setMinWaveformsToBeam(beamformingTemplate.getMinWaveformsToBeam())
                .setSlownessSecPerDeg(beamDao.getSlowness())
                .build();

        var beamDefinition =
            BeamDefinition.builder()
                .setBeamDescription(beamDescription)
                .setBeamParameters(beamParameters)
                .build();

        optionalBeamDerivedChannel =
            ChannelFactory.createBeamed(inputChannels, beamDefinition, assocRecordPair);

        if (optionalBeamDerivedChannel.isPresent()) {
          var beamDerivedChannel = optionalBeamDerivedChannel.get();
          cacheVersion(beamDerivedChannel);

        } else {
          LOGGER.error(
              "Derived Beam Channel could not be created due to an error in ChannelFactory");
        }
      }
    } else {
      LOGGER.error(
          "Input channels are missing, therefore; the derived beam channel can't be"
              + " properly created");
    }

    return optionalBeamDerivedChannel;
  }

  private Optional<SiteChanDao> getOptionalSiteChanDao(WfdiscDao wfdiscDao) {
    Optional<SiteChanDao> optionalSiteChanDao = Optional.empty();

    var siteChanKey =
        new SiteChanKey(
            wfdiscDao.getStationCode(), wfdiscDao.getChannelCode(), wfdiscDao.getTime());

    List<SiteChanDao> siteChanDaoList =
        siteChanDatabaseConnector.findSiteChansByKeyAndTime(
            List.of(siteChanKey), wfdiscDao.getTime());
    if (!siteChanDaoList.isEmpty()) {
      Optional<SiteChanDao> findFirst = siteChanDaoList.stream().findFirst();
      if (findFirst.isPresent()) {
        optionalSiteChanDao = findFirst;

      } else {
        LOGGER.error("No siteChanDao from which to load channel type");
      }

    } else {
      LOGGER.error("No siteChanDao from which to load channel type");
    }

    return optionalSiteChanDao;
  }

  private Optional<Station> getStationCode(WfdiscDao wfdiscDao, Instant channelEffectiveTime) {
    var station = StationDefinitionIdUtility.getStationEntityForSta(wfdiscDao.getStationCode());
    Optional<Station> optionalStaCode = Optional.empty();
    if (!station.isPresent()) {
      var stationList =
          stationRepository.findStationsByNameAndTime(
              List.of(station.getName()), channelEffectiveTime);
      if (!stationList.isEmpty()) {
        optionalStaCode = Optional.ofNullable(stationList.stream().findFirst().orElseThrow());
      } else {
        LOGGER.error("Station {} could not be found", station.getName());
      }

    } else {
      optionalStaCode = Optional.of(station);
    }
    return optionalStaCode;
  }

  private static void setBeamSummation(SiteChanDao siteChanDao, BeamDescription beamDescription) {
    var channelType = siteChanDao.getChannelType();
    var beamDescriptionBuilder = beamDescription.toBuilder();

    if (channelType == ChannelType.B) {
      beamDescriptionBuilder.setBeamSummation(BeamSummation.COHERENT);
    } else {
      beamDescriptionBuilder.setBeamSummation(BeamSummation.INCOHERENT);
    }
  }

  /**
   * Create a derived channel that is not a filtered derived channel.
   *
   * @param wfids List of wfdisc record identifiers
   * @param associatedRecordType record type, e.g. arrival or origin
   * @param associatedRecordId associated record id, arid or orid
   * @param channelEffectiveTime the time at which the channel is effective
   * @param channelEndTime the time at which the channel is no longer effective
   * @return a {@link Channel} meeting or derived from the provided criteria
   */
  private Optional<Channel> createBeamDerivedChannel(
      Long wfid,
      TagName associatedRecordType,
      Long associatedRecordId,
      Instant channelEffectiveTime,
      Instant channelEndTime) {

    return switch (associatedRecordType) {
      case ARID -> createFkBeamDerivedChannel(
          wfid, associatedRecordType, associatedRecordId, channelEffectiveTime, channelEndTime);
      default -> throw new IllegalArgumentException(
          "Illegal arguments for loading channel from wfdisc, "
              + associatedRecordType.getName()
              + " record type not supported");
    };
  }

  private void cacheResponseIds(List<Channel> channels) {
    channels.parallelStream()
        .forEach(
            channel ->
                channel
                    .getResponse()
                    .map(Response::getId)
                    .ifPresent(
                        id ->
                            stationDefinitionIdUtility.storeResponseIdChannelNameMapping(
                                id, channel.getName())));
  }

  /**
   * Create fk beam derived channel
   *
   * @param wfid wfid to query derived channel
   * @param associatedRecordType record type for input beam type
   * @param associatedRecordId record id for derived channel
   * @param channelEffectiveTime channel query effective time
   * @param channelEndTime channel query end time
   * @return derived {@link Channel}
   */
  private Optional<Channel> createFkBeamDerivedChannel(
      Long wfid,
      TagName associatedRecordType,
      Long associatedRecordId,
      Instant channelEffectiveTime,
      Instant channelEndTime) {

    // processing metadata type for fk beam type
    EnumMap<ChannelProcessingMetadataType, Object> processingMetadataMap =
        new EnumMap<>(ChannelProcessingMetadataType.class);
    processingMetadataMap.put(
        BRIDGED, "/bridged," + associatedRecordType + ":" + associatedRecordId);
    processingMetadataMap.put(BEAM_TYPE, BeamType.FK);

    return createDerivedChannel(wfid, channelEffectiveTime, channelEndTime, processingMetadataMap);
  }

  /**
   * Create and cache the derived channel
   *
   * @param wfid wfid to query derived channel
   * @param associatedRecordType record type for input beam type
   * @param associatedRecordId record id for derived channel
   * @param channelEffectiveTime channel query effective time
   * @param channelEndTime channel query end time
   * @param processingMetadataMap processing meta map for derived channel type
   * @return derived {@link Channel}
   */
  private Optional<Channel> createDerivedChannel(
      Long wfid,
      Instant channelEffectiveTime,
      Instant channelEndTime,
      EnumMap<ChannelProcessingMetadataType, Object> processingMetadataMap) {

    // query list of wfdisc daos using the given wfid
    var wfdiscDaoList = wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(wfid));

    // wfid is a pk, guaranteed exactly 1 wfdisc
    var optionalWfdiscDao = wfdiscDaoList.stream().findFirst();
    var wfdiscDao = optionalWfdiscDao.orElseThrow(() -> new IllegalStateException(WFDISC_ERR));

    // create StationChannelTimeKey for site dao query
    var stationChannelTimeKey =
        new StationChannelTimeKey(
            wfdiscDao.getStationCode(), wfdiscDao.getChannelCode(), channelEffectiveTime);

    // create SiteChanKey for site dao query
    var siteChanKey =
        new SiteChanKey(
            stationChannelTimeKey.getStationCode(),
            stationChannelTimeKey.getChannelCode(),
            channelEffectiveTime);
    var siteChanDaoList =
        siteChanDatabaseConnector.findSiteChansByKeyAndTime(
            List.of(siteChanKey), channelEffectiveTime);
    var optionalSiteChanDao = siteChanDaoList.stream().findFirst();
    var siteChanDao = optionalSiteChanDao.orElse(null);
    if (siteChanDao == null) {
      LOGGER.debug(SITECHAN_ERR);
      return Optional.empty();
    }

    // there should only be one site existing at a certain time
    var siteDaoList =
        siteDatabaseConnector.findSitesByStationCodesAndStartTime(
            List.of(stationChannelTimeKey.getStationCode()), stationChannelTimeKey.getTime());
    var optionalSiteDao = siteDaoList.stream().findFirst();
    var siteDao = optionalSiteDao.orElse(null);
    if (siteDao == null) {
      LOGGER.debug(SITE_ERR);
      return Optional.empty();
    }

    // build the derived channel using channel assembler and converter
    var optionalBeamDao = beamDatabaseConnector.findBeamForWfid(wfid);

    // query beam dao using the given wfid
    var sensorDao =
        sensorDatabaseConnector.findSensorByKeyInRange(
            siteChanKey.getStationCode(),
            siteChanKey.getChannelCode(),
            channelEffectiveTime,
            channelEndTime);

    // For arrays, we should be able to tell that a derived channel exists when a
    // reference station (e.g., reference station is ASAR in the site table,
    // sta is ASAR in site table) has a channel in the sitechan (e.g., sta is ASAR
    // and it has a channel SHZ ), whereas for channels in the sitechan that don't
    // match a reference station (e.g., sta in site table is AS01 and its reference
    // station is ASAR, sta in sitechan is AS01 and it has a channel SHZ,) those
    // would be raw channels.
    if (siteDao.getId().getStationCode().equals(siteDao.getReferenceStation())
        && siteChanDao.getId().getStationCode().equals(siteDao.getReferenceStation())
        && siteDao.getStaType() == StaType.ARRAY_STATION) {

      var derivedChan =
          channelAssembler.buildFromAssociatedRecord(
              processingMetadataMap,
              optionalBeamDao,
              siteDao,
              wfdiscDao,
              siteChanDao,
              sensorDao,
              channelEffectiveTime,
              channelEndTime);

      return Optional.of(derivedChan);
    } else {
      // 3 component channels tend to be raw channels as we don't
      // beam on 3 component channels (3 component channels = STA=REFSTA && STATYPE=ss)
      // Statype is ss (single station) == raw
      return createRawChannel(List.of(wfid), channelEffectiveTime);
    }
  }

  /**
   * Create raw channel using list of wfids, channel effective time and end time
   *
   * @param wfids list of wfids
   * @param channelEffectiveTime channel query effective time
   * @return raw {@link Channel}
   */
  private Optional<Channel> createRawChannel(List<Long> wfids, Instant channelEffectiveTime) {

    LOGGER.debug("Creating raw channel from WFIDs {}", wfids);

    // create wfdiscs and compare against site dao refsta
    if (wfids.size() > 1) {
      LOGGER.warn("Found more than one wfdisc ID; using the first.");
    }

    // ensure wfids dont have assctd beamdaos
    if (!beamDatabaseConnector.findBeamsByWfid(wfids).isEmpty()) {
      LOGGER.warn(
          """
          Failed attempting to load raw channel from wfdisc.
          Wfids mustn't have associated beam records.
          No channel will be bridged.""");
      return Optional.empty();
    }

    var wfid =
        wfids.stream()
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Need at least one wfdisc id"));

    var firstWfdiscDao =
        wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(wfid)).stream()
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("Could not find wfdisc"));

    var siteChanKey =
        new SiteChanKey(
            firstWfdiscDao.getStationCode(), firstWfdiscDao.getChannelCode(), channelEffectiveTime);

    // now that we know sta chan and we have a channelEffectiveTime
    // we can use the same logic as findChannelsByNameAndTime to get the raw channel
    var channels = findChannelsBySiteChanKeysAndTime(List.of(siteChanKey), channelEffectiveTime);

    return channels.stream().findFirst();
  }

  private void cacheVersion(Channel channel) {
    var key = Channel.class.getSimpleName().concat(channel.getName());
    var versionTimes = versionCache.retrieveVersionEffectiveTimesByEntityId(key);
    if (versionTimes == null) {
      versionTimes = new TreeSet<>();
    }

    // cache versions times using built dervied channel
    versionTimes.add(channel.getEffectiveAt().orElseThrow());
    versionCache.cacheVersionEffectiveTimesByEntityId(key, versionTimes);

    var versions = versionCache.retrieveVersionsByEntityIdAndTimeRangeMap(key);

    if (versions == null) {
      versions = TreeRangeMap.create();
    }

    // cache derived channel versions
    var range =
        channel.getEffectiveUntil().isPresent()
            ? Range.closedOpen(
                channel.getEffectiveAt().orElseThrow(), channel.getEffectiveUntil().orElseThrow())
            : Range.atLeast(channel.getEffectiveAt().orElseThrow());
    versions.put(range, channel);
    versionCache.cacheVersionsByEntityIdAndTime(key, versions);
  }

  private Channel retrieveChannelFromCache(DerivedChannelIdComponents id) {

    // check if derived channel exists in cache
    var channel = stationDefinitionIdUtility.getDerivedChannelById(id);
    // populate channel if it exists
    if (channel != null) {
      return (Channel)
          versionCache.retrieveVersionsByEntityIdAndTime(
              Channel.class.getSimpleName().concat(channel.getName()),
              channel.getEffectiveAt().orElseThrow());
    }
    return null;
  }

  private List<Channel> findDerivedCachedChannelsByTime(
      List<String> channelNames, Instant effectiveTime) {

    return channelNames.stream()
        .parallel()
        .map(id -> Channel.class.getSimpleName().concat(id))
        .filter(versionCache::versionsByEntityIdAndTimeHasKey)
        .map(id -> versionCache.retrieveVersionsByEntityIdAndTime(id, effectiveTime))
        .filter(
            (Object object) -> {
              if (object != null) {
                return true;
              }
              LOGGER.debug(
                  "Attempting to retrieve entities of type {} from the cache, but "
                      + "retrieved a null value, ignoring",
                  Channel.class.toString());
              return false;
            })
        .map(Channel.class::cast)
        .filter(Objects::nonNull)
        .collect(Collectors.toCollection(ArrayList::new));
  }

  private List<Channel> findDerivedCachedChannelByIdAndTimeRange(
      List<String> channelNames, Instant startTime, Instant endTime) {

    Range<Instant> timeRange = Range.closed(startTime, endTime);
    return channelNames.parallelStream()
        .map(
            (String name) -> {
              String key = Channel.class.getSimpleName().concat(name);
              return versionCache.retrieveVersionsByEntityIdAndTimeRangeMap(key);
            })
        // check if the cache range map contains the station group key and pull the associated
        // RangeMap of Range->StationGroupVersion
        .filter(cacheRangeMap -> cacheRangeMap != null && !cacheRangeMap.asMapOfRanges().isEmpty())
        .flatMap(
            cacheRangeMap ->
                cacheRangeMap.asDescendingMapOfRanges().entrySet().stream()
                    .filter(entry -> timeRange.isConnected(entry.getKey()))
                    .map(Map.Entry::getValue)
                    .map(Channel.class::cast))
        .filter(Objects::nonNull)
        .sorted()
        .distinct()
        .toList();
  }

  /**
   * Parse out the last value of the beam description string which is the beam description used in
   * the phase type map
   */
  String getBeamDescriptionRecipe(String beamDescription) {
    var recipe = beamDescription.substring(beamDescription.lastIndexOf(" ") + 1);
    if (BEAM_LITERAL.equals(recipe) || NONE_LITERAL.equals(recipe)) {
      recipe = SZB_RECIPE;
    }
    return recipe;
  }
}
