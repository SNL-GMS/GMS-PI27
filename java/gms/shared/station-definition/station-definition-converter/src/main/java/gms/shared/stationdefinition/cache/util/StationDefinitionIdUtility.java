package gms.shared.stationdefinition.cache.util;

import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.CHANNEL_RECORD_ID_WFID_CACHE;
import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.CHANNEL_RESPONSE_CACHE;
import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.FREQUENCY_AMPLITUDE_PHASE_CACHE;
import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.RECORD_ID_WFID_CHANNEL_CACHE;
import static gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory.WFID_RESPONSE_CACHE;

import com.google.common.base.Preconditions;
import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelGroup;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.stationdefinition.coi.station.StationGroup;
import gms.shared.stationdefinition.coi.utils.StationDefinitionObject;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.NetworkDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.css.enums.TagName;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.UnaryOperator;
import org.apache.commons.lang3.Validate;
import org.apache.ignite.IgniteCache;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class StationDefinitionIdUtility {

  public static final String CACHE_INITIALIZED = "Cache already initialized: ";
  private static final String COI_ID_STRING_DELIMITER = ".";
  private static final String NULL_OBJECT_ERROR = "Cannot create CSS Key from a null object";

  private static final UnaryOperator<String> parseStationCode =
      (String channelName) -> {
        String channelDef = channelName.split("/")[0];
        String[] parsedNames = channelName.split("\\.");
        Preconditions.checkState(
            parsedNames.length > 2, "Cannot parse channel code from %s", channelName);
        return channelDef.contains("beam") ? parsedNames[0] : parsedNames[1];
      };

  private static final UnaryOperator<String> parseChannelCode =
      (String channelName) -> {
        String[] parsedNames = channelName.split("/")[0].split("\\.");
        Preconditions.checkState(
            parsedNames.length > 2, "Cannot parse channel code from %s", channelName);
        return parsedNames[2];
      };

  private IgniteCache<UUID, String> channelNamesByResponseId;

  private IgniteCache<DerivedChannelIdComponents, Channel> derivedChannelIdToChannelMap;
  private IgniteCache<Channel, DerivedChannelIdComponents> channelToDerivedChannelIdMap;
  private IgniteCache<UUID, ChannelInstrumentPair> frequencyAmplitudePhaseMap;
  private IgniteCache<Long, Response> wfidResponseMap;
  private final SystemConfig systemConfig;

  @Autowired
  public StationDefinitionIdUtility(SystemConfig systemConfig) {
    this.systemConfig = systemConfig;
    init();
  }

  public StationDefinitionIdUtility(
      SystemConfig systemConfig,
      IgniteCache<DerivedChannelIdComponents, Channel> wfidRecordIdChannelMap,
      IgniteCache<Channel, DerivedChannelIdComponents> channelWfidRecordIdMap,
      IgniteCache<Long, Response> wfidResponseMap,
      IgniteCache<UUID, String> channelNamesByResponseId,
      IgniteCache<UUID, ChannelInstrumentPair> frequencyAmplitudePhaseMapping) {
    this.systemConfig = systemConfig;
    init(
        wfidRecordIdChannelMap,
        channelWfidRecordIdMap,
        wfidResponseMap,
        channelNamesByResponseId,
        frequencyAmplitudePhaseMapping);
  }

  // for testing only
  public void init(
      IgniteCache<DerivedChannelIdComponents, Channel> wfidRecordIdChannelMap,
      IgniteCache<Channel, DerivedChannelIdComponents> channelWfidRecordIdMap,
      IgniteCache<Long, Response> wfidResponseMap,
      IgniteCache<UUID, String> channelNamesByResponseId,
      IgniteCache<UUID, ChannelInstrumentPair> frequencyAmplitudePhaseMapping) {

    this.derivedChannelIdToChannelMap = wfidRecordIdChannelMap;
    this.channelToDerivedChannelIdMap = channelWfidRecordIdMap;
    this.wfidResponseMap = wfidResponseMap;
    this.channelNamesByResponseId = channelNamesByResponseId;
    this.frequencyAmplitudePhaseMap = frequencyAmplitudePhaseMapping;
  }

  // @PostConstruct
  public void init() {
    StationDefinitionCacheFactory.setUpCache(systemConfig);

    this.derivedChannelIdToChannelMap =
        IgniteConnectionManager.getOrCreateCache(RECORD_ID_WFID_CHANNEL_CACHE);

    this.channelToDerivedChannelIdMap =
        IgniteConnectionManager.getOrCreateCache(CHANNEL_RECORD_ID_WFID_CACHE);

    this.wfidResponseMap = IgniteConnectionManager.getOrCreateCache(WFID_RESPONSE_CACHE);

    this.channelNamesByResponseId =
        IgniteConnectionManager.getOrCreateCache(CHANNEL_RESPONSE_CACHE);

    this.frequencyAmplitudePhaseMap =
        IgniteConnectionManager.getOrCreateCache(FREQUENCY_AMPLITUDE_PHASE_CACHE);
  }

  /**
   * This utility will use the station group name from the COI {@link StationGroup} name to
   * reference a CSS {@link NetworkDao}
   *
   * @param stationGroup
   * @return the name field of the {@link StationGroup}
   */
  public static String getCssKey(StationGroup stationGroup) {
    Validate.notNull(stationGroup, NULL_OBJECT_ERROR);

    return stationGroup.getName();
  }

  /**
   * Gets the station entity for the provided station
   *
   * @param sta The Sta for the station
   * @return a {@link Station} entity reference
   */
  public static Station getStationEntityForSta(String sta) {
    Objects.requireNonNull(sta, "Cannot map station from null sta");
    Preconditions.checkState(!sta.isBlank() && !sta.isEmpty(), "Cannot map station from empty sta");

    return Station.createEntityReference(sta);
  }

  /**
   * Gets the channel entity given the reference station, station code, and channel code
   *
   * @param refSta reference station (the first part of the channel name)
   * @param sta station code (the second part of the channel name)
   * @param chan channel code (the third part of the channel name)
   * @return a {@link Channel} entity reference
   */
  public static Channel getChannelEntityForRefStaChan(String refSta, String sta, String chan) {
    Objects.requireNonNull(refSta, "Cannot map channel from null refSta");
    Objects.requireNonNull(sta, "Cannot map channel from null sta");
    Objects.requireNonNull(chan, "Cannot map channel from null chan");
    Preconditions.checkState(
        !refSta.isBlank() && !refSta.isEmpty(), "Cannot map channel from empty refSta");
    Preconditions.checkState(!sta.isBlank() && !sta.isEmpty(), "Cannot map channel from empty sta");
    Preconditions.checkState(
        !chan.isBlank() && !chan.isEmpty(), "Cannot map channel from empty chan");

    var channelName = refSta + COI_ID_STRING_DELIMITER + sta + COI_ID_STRING_DELIMITER + chan;
    return Channel.createEntityReference(channelName);
  }

  /**
   * This utility will use the station code from the COI {@link Station} name to build a CSS {@link
   * SiteKey}
   *
   * @param station
   * @return a {@link SiteKey} built from the COI {@link Station} instance
   */
  public static SiteKey getCssKey(Station station) {
    Validate.notNull(station, NULL_OBJECT_ERROR);

    return new SiteKey(
        station.getName(),
        station
            .getEffectiveAt()
            .orElseThrow(
                () -> new IllegalStateException("Cannot create SiteKey from entity reference")));
  }

  /**
   * COI {@link ChannelGroup} names are in the form of "{STATION}.{CHANNEL_GROUP}". This utility
   * will parse out the station code from the COI {@link ChannelGroup} name to build a CSS {@link
   * SiteKey}
   *
   * @param channelGroup
   * @return a {@link SiteKey} CSS entity key filled out from the COI instance
   */
  public static SiteKey getCssKey(ChannelGroup channelGroup) {
    Validate.notNull(channelGroup, NULL_OBJECT_ERROR);

    final String[] channelGroupParts = splitCoiIdString(channelGroup.getName(), 2);
    final String stationCode = channelGroupParts[0];
    return new SiteKey(
        stationCode,
        channelGroup
            .getEffectiveAt()
            .orElseThrow(
                () -> new IllegalStateException("Cannot create SiteKey from entity reference")));
  }

  /**
   * COI Channel names are in the form of "{STATION}.{CHANNEL_GROUP}.{CHANNEL}". This utility will
   * parse out the station and channel codes from the COI {@link Channel} name to build a CSS {@link
   * SiteChanKey}
   *
   * @param channel
   * @return a {@link SiteChanKey} CSS entity key filled out from the COI instance
   */
  public static SiteChanKey getCssKey(StationDefinitionObject channel) {
    Validate.notNull(channel, NULL_OBJECT_ERROR);

    final String name = channel.getName();
    final String stationCode = parseStationCode.apply(name);
    final String channelCode = parseChannelCode.apply(name);

    return new SiteChanKey(
        stationCode,
        channelCode,
        channel
            .getEffectiveAt()
            .orElseThrow(
                () ->
                    new IllegalStateException("Cannot create SiteChanKey from entity reference")));
  }

  public static SiteChanKey getCssKeyFromName(String channelName) {
    final String stationCode = parseStationCode.apply(channelName);
    final String channelCode = parseChannelCode.apply(channelName);

    return new SiteChanKey(stationCode, channelCode, Instant.now());
  }

  /**
   * This utility will parse out the station and channel codes from the COI {@link Channel} name to
   * build a CSS {@link SiteChanKey} NOTE: the time of the channel is not
   *
   * @param channel
   * @return a {@link SiteChanKey} CSS entity key filled out from the COI instance
   */
  public static SiteChanKey getCssKeyFromChannelName(StationDefinitionObject channel) {

    final String name = channel.getName();
    final String stationCode = parseStationCode.apply(name);
    final String channelCode = parseChannelCode.apply(name);
    return new SiteChanKey(stationCode, channelCode, Instant.now());
  }

  public static String[] splitCoiIdString(String coiIdString, int expectedParts) {
    Validate.isTrue(
        coiIdString.contains(COI_ID_STRING_DELIMITER),
        String.format(
            "COI ID string, '%s', does not contain expected delimiter '%s'",
            coiIdString, COI_ID_STRING_DELIMITER));
    final String[] idStringParts = coiIdString.split("\\" + COI_ID_STRING_DELIMITER);
    Validate.isTrue(
        idStringParts.length >= expectedParts,
        String.format(
            "COI ID string, '%s', should contain %s instances of delimiter '%s'",
            coiIdString, expectedParts - 1, COI_ID_STRING_DELIMITER));
    return idStringParts;
  }

  /**
   * splits channel name into component parts. Does not use getCssKey since this could be an entity
   * reference
   *
   * @param channel channel to get component parts from
   * @return stationCode.channelCode string
   */
  public static String getStationChannelCodeFromChannel(Channel channel) {
    String stationCode = parseStationCode.apply(channel.getName());
    String channelCode = parseChannelCode.apply(channel.getName());
    return createStationChannelCode(stationCode, channelCode);
  }

  /**
   * splits channel name into component parts and gets the reference station name Does not use
   * getCssKey since this could be an entity reference
   *
   * @param channel channel to get component parts from
   * @return referenceStation string
   */
  public static String getReferenceStationNameFromChannel(Channel channel) {
    final String[] channelParts = splitCoiIdString(channel.getName(), 3);

    // referenceStationName
    return channelParts[0];
  }

  // create a string to use as a key to find SiteChans
  public static String createStationChannelCode(String stationCode, String channelCode) {
    return stationCode + COI_ID_STRING_DELIMITER + channelCode;
  }

  public void storeResponseIdChannelNameMapping(UUID responseId, String channelName) {
    channelNamesByResponseId.put(responseId, channelName);
  }

  /**
   * Gets the station and channel codes corresponding to the provided response ID
   *
   * @param responseId the response ID to convert to CSS
   * @return the channel name (e.g. "STA.CHAN.CHAN01") corresponding to the ResponseId
   */
  public Optional<String> getChannelForResponseId(UUID responseId) {
    return Optional.ofNullable(channelNamesByResponseId.get(responseId));
  }

  /**
   * Find channel version for given associated record info and Wfdisc Id, returns null if no value
   * is found
   *
   * @param tagName TagName type of record: arid, orid, erid, etc.
   * @param recordId Long Record Id
   * @param wfid Long Wfdisc Id
   * @return Channel
   */
  public Channel getDerivedChannelForWfidRecordId(TagName tagName, long recordId, long wfid) {
    return getDerivedChannelById(
        DerivedChannelIdComponents.builder()
            .setWfid(wfid)
            .setAssociatedRecordInfo(tagName, recordId)
            .build());
  }

  /**
   * Find the derived {@link Channel} for the given derived channel ID
   *
   * @param derivedChannelId
   * @return the derived {@link Channel}; null if not found
   */
  public Channel getDerivedChannelById(DerivedChannelIdComponents derivedChannelId) {
    return derivedChannelIdToChannelMap.get(derivedChannelId);
  }

  /**
   * Find the derived {@link Channel} for the associated {@link Channel}
   *
   * @param channel
   * @return the derived {@link Channel}; null if not found
   */
  public DerivedChannelIdComponents getDerivedChannelIdForChannel(Channel channel) {
    return channelToDerivedChannelIdMap.get(channel);
  }

  /**
   * Store mapping from a unique derived channel identifier to a channel version reference
   *
   * @param derivedChannelId
   * @param channel Channel with channel version
   */
  public void storeDerivedChannelMapping(
      DerivedChannelIdComponents derivedChannelId, Channel channel) {
    var channelVersionRef =
        Channel.createVersionReference(channel.getName(), channel.getEffectiveAt().orElseThrow());
    derivedChannelIdToChannelMap.put(derivedChannelId, channelVersionRef);
    channelToDerivedChannelIdMap.put(channelVersionRef, derivedChannelId);
  }

  /**
   * Retrieve an {@link Optional}&lt;{@link Response}&gt; if it can be found given a wfdisc ID
   * otherwise return an empty {@link Optional}
   *
   * @param wfid provided {@link gms.shared.stationdefinition.dao.css.WfdiscDao} ID
   * @return {@link Optional}&lt;{@link Response}&gt;
   */
  public Optional<Response> getResponseForWfid(long wfid) {
    return Optional.ofNullable(wfidResponseMap.get(wfid));
  }

  /**
   * Store a {@link gms.shared.stationdefinition.dao.css.WfdiscDao} ID and {@link Response} mapping
   *
   * @param wfid provided {@link gms.shared.stationdefinition.dao.css.WfdiscDao} ID
   * @param response provided {@link Response}
   */
  public void storeWfidResponseMapping(long wfid, Response response) {
    wfidResponseMap.put(wfid, response);
  }

  /**
   * Stores the FrequencyAmplitudePhase information into the local cache
   *
   * @param channelName Name of the channel to associate with a FrequencyAmplitudePhase
   * @param instrumentId the id of an {@link InstrumentDao} to associate with a
   *     FrequencyAmplitudePhase
   * @return UUID of the generated and cache entry
   */
  public UUID storeInstrumentIdFrequencyAmplitudePhaseMapping(
      String channelName, Long instrumentId) {

    Objects.requireNonNull(channelName, "channelName must not be null");
    var uuidStr = channelName + Long.toString(instrumentId);
    var itemUUID = UUID.nameUUIDFromBytes(uuidStr.getBytes(StandardCharsets.UTF_8));
    frequencyAmplitudePhaseMap.put(itemUUID, new ChannelInstrumentPair(channelName, instrumentId));
    return itemUUID;
  }

  /**
   * Retrieves the {@link InstrumentDao} id of the associated FrequencyAmplitudePhase if stored in
   * the cache
   *
   * @param fapUUID UUID of the associated {@link FrequencyAmplitudePhase} object
   * @return the associated {@link InstrumentDao} id if one exists in the cache, otherwise an empty
   *     optional
   */
  public Optional<Long> retrieveInstrumentIdFromFrequencyAmplitudePhaseUUID(UUID fapUUID) {
    return Optional.ofNullable(frequencyAmplitudePhaseMap.get(fapUUID).getInstrumentId());
  }

  /**
   * Retrieves the channel name of the associated FrequencyAmplitudePhase if stored in the cache
   *
   * @param fapUUID UUID of the associated {@link FrequencyAmplitudePhase} object
   * @return the associated channelName string if one exists in the cache, otherwise an empty
   *     optional
   */
  public Optional<String> retrieveChannelNameFromFrequencyAmplitudePhaseUUID(UUID fapUUID) {
    return Optional.ofNullable(frequencyAmplitudePhaseMap.get(fapUUID).getChannelName());
  }
}
