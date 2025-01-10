package gms.shared.frameworks.osd.repository.utils;

import gms.shared.frameworks.osd.coi.channel.Channel;
import gms.shared.frameworks.osd.coi.channel.ChannelGroup;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.frameworks.osd.coi.signaldetection.Location;
import gms.shared.frameworks.osd.coi.signaldetection.Station;
import gms.shared.frameworks.osd.coi.stationreference.RelativePosition;
import gms.shared.frameworks.osd.dao.channel.ChannelConfiguredInputsDao;
import gms.shared.frameworks.osd.dao.channel.ChannelDao;
import gms.shared.frameworks.osd.dao.channel.ChannelGroupDao;
import gms.shared.frameworks.osd.dao.channel.LocationDao;
import gms.shared.frameworks.osd.dao.channel.StationChannelInfoDao;
import gms.shared.frameworks.osd.dao.channel.StationChannelInfoKey;
import gms.shared.frameworks.osd.dao.channel.StationDao;
import gms.shared.frameworks.utilities.jpa.JpaConstants.EntityGraphType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility class for common querying operations for storing/retrieving stations. All operations in
 * this class are low-level, as they assume implicit transactions, but were written in a way so that
 * one can use them as part of an explicit transaction instantiated by the entityManager.
 */
public class StationUtils {

  private static final Logger LOGGER = LoggerFactory.getLogger(StationUtils.class);
  private static final String STATION = "station";

  private EntityManager entityManager;
  private ChannelUtils channelUtils;

  public StationUtils(EntityManager entityManager) {
    this.entityManager = entityManager;
    this.channelUtils = new ChannelUtils(entityManager);
  }

  /**
   * Store a station represented by the provided {@link StationDao} to the database. If already
   * persisted, will update the persistent entity.
   *
   * @param station Station to store
   * @return Managed {@link StationDao} representing the stored station
   */
  public StationDao storeStation(Station station) {
    StationDao stationDao = entityManager.find(StationDao.class, station.getName());
    if (stationDao == null) {
      stationDao = StationDao.from(station);
      entityManager.persist(stationDao);
    } else {
      stationDao.setType(station.getType());
      stationDao.setDescription(station.getDescription());
      stationDao.setLocation(LocationDao.from(station.getLocation()));

      removeOrphanedChannelGroups(
          stationDao, station.getChannelGroups().stream().map(ChannelGroup::getName).toList());

      removeOrphanedStationChannelInfo(
          stationDao, station.getRelativePositionsByChannel().keySet());
    }

    stationDao.setChannelGroups(
        storeChannelGroups(
            station.getChannelGroups(), stationDao, station.getRelativePositionsByChannel()));

    return stationDao;
  }

  /**
   * Remove channel groups from the database no longer associated with incoming station updates
   *
   * @param stationDao Station persisted in the database used to query for associated channel groups
   * @param channelGroupNames names of channel groups still associated with incoming station updates
   */
  private void removeOrphanedChannelGroups(StationDao stationDao, List<String> channelGroupNames) {
    var cb = entityManager.getCriteriaBuilder();
    var channelGroupDelete = cb.createCriteriaDelete(ChannelGroupDao.class);
    Root<ChannelGroupDao> fromChannelGroup = channelGroupDelete.from(ChannelGroupDao.class);

    var associatedWithStation = cb.equal(fromChannelGroup.get(STATION), stationDao);
    var isOrphaned = fromChannelGroup.get("name").in(channelGroupNames).not();

    channelGroupDelete.where(cb.and(associatedWithStation, isOrphaned));

    entityManager.createQuery(channelGroupDelete).executeUpdate();
  }

  /**
   * Remove {@link StationChannelInfoDao}s from the database that no longer represent valid
   * associations from incoming station updates
   *
   * @param stationDao Station persisted in the database used to query for associated {@link
   *     StationChannelInfoDao}s
   * @param channelNames channelGroupNames names of channel groups still associated with incoming
   *     station updates
   */
  private void removeOrphanedStationChannelInfo(StationDao stationDao, Set<String> channelNames) {
    var cb = entityManager.getCriteriaBuilder();
    var stationChannelInfoDelete = cb.createCriteriaDelete(StationChannelInfoDao.class);
    Root<StationChannelInfoDao> fromStationChannelInfo =
        stationChannelInfoDelete.from(StationChannelInfoDao.class);

    var associatedWithStation = cb.equal(fromStationChannelInfo.get("id").get(STATION), stationDao);
    var isOrphaned =
        fromStationChannelInfo.get("id").get("channel").get("name").in(channelNames).not();
    stationChannelInfoDelete.where(cb.and(associatedWithStation, isOrphaned));

    entityManager.createQuery(stationChannelInfoDelete).executeUpdate();
  }

  /**
   * Generate a {@link Station} given the provided {@link StationDao}, optionally built with
   * information based on persisted derived channels.
   *
   * @param stationDao DAO to base the resulting {@link Station} on
   * @param retrieveDerivedChannels Whether or not derived channels should be retrieved/included to
   *     build the resulting {@link Station}
   * @return A {@link Station} built from the provided {@link StationDao} and related persistent
   *     information
   * @throws IOException If there is an issue retrieving station-related information from the
   *     database
   */
  public Station generateStation(StationDao stationDao, boolean retrieveDerivedChannels)
      throws IOException {
    final LocationDao location = stationDao.getLocation();
    // retrieve the channel group and channels from the given station. In some cases,
    // the channel groups will return all the channels of the given station. However, derived
    // channels may NOT need to be part of a channel group but still be associated with
    // a station. This is why we are performing two different queries to grab all channel
    // groups and all channels associated with a station.
    List<ChannelGroup> channelGroups = retrieveChannelGroups(stationDao);

    Map<String, RelativePosition> relativePositionsByChannel =
        retrieveRelativePositionsByChannel(stationDao, retrieveDerivedChannels);
    return Station.from(
        stationDao.getName(),
        stationDao.getType(),
        stationDao.getDescription(),
        relativePositionsByChannel,
        Location.from(
            location.getLatitude(),
            location.getLongitude(),
            location.getDepth(),
            location.getElevation()),
        channelGroups,
        channelGroups.stream()
            .map(ChannelGroup::getChannels)
            .flatMap(Collection::stream)
            .distinct()
            .toList());
  }

  private List<ChannelGroupDao> storeChannelGroups(
      Set<ChannelGroup> channelGroups,
      StationDao station,
      Map<String, RelativePosition> relativePositionByChannelMap) {
    List<ChannelGroupDao> channelGroupDaos = new ArrayList<>();
    for (ChannelGroup channelGroup : channelGroups) {
      List<ChannelDao> channels =
          storeChannels(channelGroup, station, relativePositionByChannelMap);
      ChannelGroupDao channelGroupDao =
          entityManager.find(ChannelGroupDao.class, channelGroup.getName());
      if (channelGroupDao == null) {
        channelGroupDao =
            new ChannelGroupDao(
                channelGroup.getName(),
                channelGroup.getDescription(),
                new LocationDao(channelGroup.getLocation().orElse(null)),
                channelGroup.getType(),
                channels,
                station);
        entityManager.persist(channelGroupDao);
        channelGroupDaos.add(channelGroupDao);
      } else {
        channelGroupDao.setDescription(channelGroup.getDescription());
        channelGroupDao.setLocation(channelGroup.getLocation().map(LocationDao::new).orElse(null));
        channelGroupDao.setType(channelGroup.getType());
        channelGroupDao.setChannels(channels);
        channelGroupDao.setStation(station);
      }
    }
    return channelGroupDaos;
  }

  private List<ChannelDao> storeChannels(
      ChannelGroup channelGroup,
      StationDao stationDao,
      Map<String, RelativePosition> relativePositionByChannelMap) {
    List<ChannelDao> channels = new ArrayList<>();
    for (Channel channel : channelGroup.getChannels()) {
      ChannelDao channelDao = entityManager.find(ChannelDao.class, channel.getName());

      if (channelDao == null) {
        channelDao = ChannelDao.from(channel);
      } else {
        channelDao.setCanonicalName(channel.getCanonicalName());
        channelDao.setDescription(channel.getDescription());
        channelDao.setChannelBandType(channel.getChannelBandType());
        channelDao.setChannelInstrumentType(channel.getChannelInstrumentType());
        channelDao.setChannelOrientationType(channel.getChannelOrientationType());
        channelDao.setChannelOrientationCode(channel.getChannelOrientationCode());
        channelDao.setChannelDataType(channel.getChannelDataType());
        channelDao.setUnits(channel.getUnits());
        channelDao.setNominalSampleRateHz(channel.getNominalSampleRateHz());
        channelDao.setLocation(LocationDao.from(channel.getLocation()));

        var orientationDao = channelDao.getOrientationAngles();
        var orientation = channel.getOrientationAngles();
        orientationDao.setHorizontalAngleDeg(orientation.getHorizontalAngleDeg());
        orientationDao.setVerticalAngleDeg(orientation.getVerticalAngleDeg());

        var mapper = CoiObjectMapperFactory.getJsonObjectMapper();

        var processingDefinition = mapper.valueToTree(channel.getProcessingDefinition()).toString();
        channelDao.setProcessingDefinition(processingDefinition);

        var processingMetadata = mapper.valueToTree(channel.getProcessingMetadata()).toString();
        channelDao.setProcessingMetadata(processingMetadata);
      }

      var staChanInfoKey = new StationChannelInfoKey(stationDao, channelDao);

      // Stores the channel displacement info from the given StationDao.
      var stationChannelInfoDao =
          Optional.ofNullable(entityManager.find(StationChannelInfoDao.class, staChanInfoKey))
              .orElseGet(
                  () -> {
                    var staChanInfoDao = new StationChannelInfoDao();
                    staChanInfoDao.setId(staChanInfoKey);
                    return staChanInfoDao;
                  });

      if (!entityManager.contains(channelDao)) {
        // all related daos for the given channel are constructed so now we're ready to persist
        // everything.
        entityManager.persist(channelDao);
        channelUtils.storeChannelConfiguredInputs(channelDao, channel);
      }

      var channelRelativePosition =
          relativePositionByChannelMap.getOrDefault(channelDao.getName(), null);
      if (channelRelativePosition != null) {
        stationChannelInfoDao.setNorthDisplacementKm(
            channelRelativePosition.getNorthDisplacementKm());
        stationChannelInfoDao.setEastDisplacementKm(
            channelRelativePosition.getEastDisplacementKm());
        stationChannelInfoDao.setVerticalDisplacementKm(
            channelRelativePosition.getVerticalDisplacementKm());

        if (!entityManager.contains(stationChannelInfoDao)) {
          entityManager.persist(stationChannelInfoDao);
        }
      } else if (entityManager.contains(stationChannelInfoDao)) {
        LOGGER.warn(
            "StationChannelInfoDao exists in the database, but incoming relative positions map does"
                + " not have an entry for channel {} to station {}. Will not modify persistent"
                + " StationChannelInfoDao.",
            channel.getName(),
            stationDao.getName());
      } else {
        LOGGER.warn(
            "Incoming relative positions map does not have an entry for channel {} to station {}."
                + " Will not store station->channel info.",
            channel.getName(),
            stationDao.getName());
      }

      channels.add(channelDao);
    }

    return channels;
  }

  /*
   * retrieve channels for the given StationDao along with their relative positions (which are stored in the database).
   *
   * @param stationDao StationDao we are retrieving ChannelDaos for
   */
  private Map<String, RelativePosition> retrieveRelativePositionsByChannel(
      StationDao stationDao, boolean retrieveDerivedChannels) throws IOException {
    Map<String, RelativePosition> relativePositionsByChannel = new HashMap<>();
    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<StationChannelInfoDao> stationChannelInfoCriteria =
        cb.createQuery(StationChannelInfoDao.class);
    Root<StationChannelInfoDao> fromStationChannelInfo =
        stationChannelInfoCriteria.from(StationChannelInfoDao.class);
    List<Predicate> predicates = new ArrayList<>();
    predicates.add(cb.equal(fromStationChannelInfo.get("id").get(STATION), stationDao));
    if (!retrieveDerivedChannels) {
      Subquery<ChannelConfiguredInputsDao> sub =
          stationChannelInfoCriteria.subquery(ChannelConfiguredInputsDao.class);
      Root<ChannelConfiguredInputsDao> subFrom = sub.from(ChannelConfiguredInputsDao.class);
      sub.select(subFrom.get("channelName"));
      predicates.add(cb.not(fromStationChannelInfo.get("id").get("channel").in(sub)));
    }
    stationChannelInfoCriteria
        .select(fromStationChannelInfo)
        .where(cb.and(predicates.stream().toArray(Predicate[]::new)));
    List<StationChannelInfoDao> queryResultList =
        entityManager.createQuery(stationChannelInfoCriteria).getResultList();

    queryResultList.stream()
        .forEach(
            stationChannelInfoDao ->
                relativePositionsByChannel.put(
                    stationChannelInfoDao.getId().getChannel().getName(),
                    RelativePosition.from(
                        stationChannelInfoDao.getNorthDisplacementKm(),
                        stationChannelInfoDao.getEastDisplacementKm(),
                        stationChannelInfoDao.getVerticalDisplacementKm())));

    return relativePositionsByChannel;
  }

  private List<ChannelGroupDao> retrieveChannelGroupDaos(StationDao stationDao) {
    // TODO - tpf - 9/17/2020 - this query/channelGroupEntityGraph isn't needed
    // StationGroupDao entity graph should load the entire data model, not just stations...
    // the entity graph then defined on ChannelGroupDao can be removed
    // Also, ManyToMany needs to be a Set, not a list...a list can cause a lot of extra queries,
    // duplicate values on joins,
    // and results in "cannot simultaneously fetch multiple bags" Exception, although may not be
    // most performanct solution
    // the possible best solution is here:
    // https://vladmihalcea.com/hibernate-multiplebagfetchexception/
    var cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<ChannelGroupDao> channelGroupQuery = cb.createQuery(ChannelGroupDao.class);
    Root<ChannelGroupDao> fromChannelGroup = channelGroupQuery.from(ChannelGroupDao.class);
    channelGroupQuery
        .select(fromChannelGroup)
        .where(cb.equal(fromChannelGroup.get(STATION), stationDao))
        .distinct(true);

    return entityManager
        .createQuery(channelGroupQuery)
        .setHint(
            EntityGraphType.LOAD.getValue(), entityManager.getEntityGraph("channel-group-graph"))
        .getResultList();
  }

  private List<ChannelGroup> retrieveChannelGroups(StationDao stationDao) throws IOException {
    var groupDaos = retrieveChannelGroupDaos(stationDao);

    List<ChannelGroup> result = new ArrayList<>();
    for (ChannelGroupDao groupDao : groupDaos) {
      List<Channel> channels =
          channelUtils.constructChannels(groupDao.getChannels(), stationDao.getName());
      if (groupDao.getLocation().isPresent()) {
        final LocationDao locationDao =
            groupDao
                .getLocation()
                .orElseThrow(
                    () -> new IllegalArgumentException("Location information not present"));
        result.add(
            ChannelGroup.from(
                groupDao.getName(),
                groupDao.getDescription(),
                Location.from(
                    locationDao.getLatitude(),
                    locationDao.getLongitude(),
                    locationDao.getDepth(),
                    locationDao.getElevation()),
                groupDao.getType(),
                channels));
      } else {
        result.add(
            ChannelGroup.from(
                groupDao.getName(), groupDao.getDescription(), null, groupDao.getType(), channels));
      }
    }
    return result;
  }
}
