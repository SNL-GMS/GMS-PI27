package gms.shared.stationdefinition.converter.util.assemblers;

import static gms.shared.stationdefinition.converter.ConverterWarnings.BEAM_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.CHANNEL_EFFECTIVE_TIME_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.CHANNEL_END_TIME_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.CHANNEL_START_END_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.EFFECTIVE_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SENSORS_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITES_MUST_NOT_BE_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITE_CHANS_MUST_NOT_BE_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITE_CHAN_MUST_NOT_BE_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SITE_MUST_NOT_BE_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.START_END_BOOLEANS_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.WFDISCS_NOT_NULL;
import static java.util.stream.Collectors.groupingBy;

import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import com.google.common.collect.Range;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.coi.channel.Calibration;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.ChannelProcessingMetadataType;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.utils.comparator.ChannelComparator;
import gms.shared.stationdefinition.converter.interfaces.ChannelConverter;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverter;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverterTransform;
import gms.shared.stationdefinition.converter.util.TemporalMap;
import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SensorKey;
import gms.shared.stationdefinition.dao.css.SiteChanDao;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.SiteKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.dao.util.StartAndEndForSiteAndSiteChan;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.NavigableSet;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.UUID;
import java.util.function.BiPredicate;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ChannelAssembler {

  private static final Logger LOGGER = LoggerFactory.getLogger(ChannelAssembler.class);

  private static final String TIME_RANGE_STR = " For %s - %s";

  private static Instant getEffectiveUntilFromResponse(Response response) {

    if (response.isPresent()) {
      return response.getEffectiveUntil().orElse(Instant.MAX);
    }

    return Instant.MAX;
  }

  private final ChannelConverter channelConverter;
  private final ResponseConverter responseConverter;

  public ChannelAssembler(ChannelConverter channelConverter, ResponseConverter responseConverter) {
    this.channelConverter = channelConverter;
    this.responseConverter = responseConverter;
  }

  BiPredicate<SiteDao, SiteDao> changeOccuredForSite =
      (SiteDao prev, SiteDao curr) -> {
        if (Objects.isNull(prev) || Objects.isNull(curr)) {
          return true;
        }

        boolean haveStationsChanged =
            !prev.getId().getStationCode().equals(curr.getId().getStationCode())
                || !prev.getReferenceStation().equals(curr.getReferenceStation());

        final var ALLOWABLE_DELTA = 0.0001;
        boolean hasLocationChanged =
            Math.abs(prev.getLatitude() - curr.getLatitude()) > ALLOWABLE_DELTA
                || Math.abs(prev.getLongitude() - curr.getLongitude()) > ALLOWABLE_DELTA
                || Math.abs(prev.getElevation() - curr.getElevation()) > ALLOWABLE_DELTA;

        return haveStationsChanged || hasLocationChanged;
      };

  // logic of what changes in site chan cause a change in station
  BiPredicate<SiteChanDao, SiteChanDao> changeOccuredForSiteChan =
      (SiteChanDao prev, SiteChanDao curr) -> {
        if (prev == null) {
          return curr != null;
        }
        return !prev.equals(curr);
      };

  /**
   * Build all {@link Channel}s for given query time
   *
   * @param effectiveTime channel query effective time
   * @param sites list of {@link SiteDao}
   * @param siteChans list of {@link SiteChanDao}
   * @param sensors list of {@link SensorDao}
   * @param wfdiscs list of {@link WfdiscDao}
   * @return list of {@link Channel}
   */
  public List<Channel> buildAllForTime(
      Instant effectiveTime,
      List<SiteDao> sites,
      List<SiteChanDao> siteChans,
      List<SensorDao> sensors,
      List<WfdiscDao> wfdiscs,
      List<Response> responses,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    Preconditions.checkNotNull(effectiveTime, EFFECTIVE_TIME_STR);
    Preconditions.checkNotNull(sites, SITES_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, effectiveTime);
    Preconditions.checkNotNull(
        siteChans, SITE_CHAN_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, effectiveTime);
    Preconditions.checkNotNull(sensors, SENSORS_NOT_NULL + EFFECTIVE_TIME_STR, effectiveTime);
    Preconditions.checkNotNull(wfdiscs, WFDISCS_NOT_NULL + EFFECTIVE_TIME_STR, effectiveTime);
    Preconditions.checkNotNull(
        startEndBooleans, START_END_BOOLEANS_NOT_NULL + EFFECTIVE_TIME_STR, effectiveTime);

    if (sites.isEmpty() || siteChans.isEmpty() || (sensors.isEmpty() && wfdiscs.isEmpty())) {
      return new ArrayList<>();
    }

    var channelMap =
        createChannelTablesAndMaps(
                Pair.of(effectiveTime, effectiveTime),
                sites,
                siteChans,
                sensors,
                wfdiscs,
                responses,
                (Response r) -> r,
                startEndBooleans)
            .stream()
            .collect(groupingBy(Channel::getName));

    var resultList = new ArrayList<Channel>();

    for (var entry : channelMap.entrySet()) {
      var channelNavigableMap = new TreeMap<Instant, Channel>();
      for (var channel : entry.getValue()) {
        channelNavigableMap.put(channel.getEffectiveAt().orElseThrow(), channel);
      }
      var floor = channelNavigableMap.floorEntry(effectiveTime);
      if (floor != null) {
        resultList.add(floor.getValue());
      }
    }

    return resultList.stream().sorted(new ChannelComparator()).toList();
  }

  /**
   * Build all channels for query time range
   *
   * @param startTime start time for query
   * @param endTime end time for query
   * @param sites list of {@link SiteDao}
   * @param siteChans list of {@link SiteChanDao}
   * @param sensors list of {@link SensorDao}
   * @param wfdiscs list of {@link WfdiscDao}
   * @return list of {@link Channel}
   */
  public List<Channel> buildAllForTimeRange(
      Instant startTime,
      Instant endTime,
      List<SiteDao> sites,
      List<SiteChanDao> siteChans,
      List<SensorDao> sensors,
      List<WfdiscDao> wfdiscs,
      List<Response> responses,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    Preconditions.checkNotNull(startTime, "Start time cannot be null.");
    Preconditions.checkNotNull(endTime, "End time cannot be null.");
    Preconditions.checkNotNull(
        sites, SITE_CHAN_MUST_NOT_BE_NULL + TIME_RANGE_STR, startTime, endTime);
    Preconditions.checkNotNull(
        siteChans, SITE_CHANS_MUST_NOT_BE_NULL + TIME_RANGE_STR, startTime, endTime);
    Preconditions.checkNotNull(sensors, SENSORS_NOT_NULL + TIME_RANGE_STR, startTime, endTime);
    Preconditions.checkNotNull(wfdiscs, WFDISCS_NOT_NULL + TIME_RANGE_STR, startTime, endTime);
    Preconditions.checkNotNull(
        startEndBooleans, START_END_BOOLEANS_NOT_NULL + TIME_RANGE_STR, startTime, endTime);

    if (sites.isEmpty() || siteChans.isEmpty() || (sensors.isEmpty() && wfdiscs.isEmpty())) {
      return new ArrayList<>();
    }

    return createChannelTablesAndMaps(
            Pair.of(startTime, endTime),
            sites,
            siteChans,
            sensors,
            wfdiscs,
            responses,
            Response::createEntityReference,
            startEndBooleans)
        .stream()
        .filter(channel -> channel.getEffectiveAt().isPresent())
        .filter(channel -> !channel.getEffectiveAt().get().isAfter(endTime))
        .filter(
            channel ->
                !channel.getEffectiveUntil().isPresent()
                    || !channel.getEffectiveUntil().get().isBefore(startTime))
        .distinct()
        .sorted(new ChannelComparator())
        .toList();
  }

  /**
   * Build channel from associated record
   *
   * @param processingMetadataMap processing metadata type map for channel
   * @param beamDao {@link BeamDao}
   * @param site {@link SiteDao}
   * @param wfdisc {@link WfdiscDao}
   * @param siteChan {@link SiteChanDao}
   * @param possibleSensor {@link SensorDao}
   * @param channelEffectiveTime channel effective time
   * @param channelEndTime channel end time
   * @return {@link Channel}
   */
  public Channel buildFromAssociatedRecord(
      Map<ChannelProcessingMetadataType, Object> processingMetadataMap,
      Optional<BeamDao> beamDao,
      SiteDao site,
      WfdiscDao wfdisc,
      SiteChanDao siteChan,
      Optional<SensorDao> possibleSensor,
      Instant channelEffectiveTime,
      Instant channelEndTime) {

    Preconditions.checkNotNull(channelEffectiveTime, CHANNEL_EFFECTIVE_TIME_NOT_NULL);
    Preconditions.checkNotNull(channelEndTime, CHANNEL_END_TIME_NOT_NULL);
    Preconditions.checkNotNull(processingMetadataMap);
    Preconditions.checkNotNull(beamDao, BEAM_NOT_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime);
    Preconditions.checkNotNull(
        site, SITES_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime);
    Preconditions.checkNotNull(wfdisc, WFDISCS_NOT_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime);
    Preconditions.checkNotNull(
        siteChan, SITE_CHAN_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime);
    Preconditions.checkNotNull(
        possibleSensor, SENSORS_NOT_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime);

    Preconditions.checkState(
        channelEffectiveTime.isBefore(channelEndTime),
        CHANNEL_START_END_TIME_STR,
        channelEffectiveTime,
        channelEndTime);

    return channelConverter.convertToBeamDerived(
        site,
        siteChan,
        wfdisc,
        channelEffectiveTime,
        channelEndTime,
        beamDao,
        processingMetadataMap);
  }

  /**
   * Build raw channel from usual legacy database tables
   *
   * @param site {@link SiteDao}
   * @param wfdisc {@link WfdiscDao}
   * @param siteChan {@link SiteChanDao}
   * @param possibleSensor {@link SensorDao}
   * @param channelEffectiveTime channel effective time
   * @param channelEndTime channel end time
   * @return raw {@link Channel}
   */
  public Channel buildRawChannel(
      SiteDao site,
      WfdiscDao wfdisc,
      SiteChanDao siteChan,
      Optional<SensorDao> possibleSensor,
      Instant channelEffectiveTime,
      Instant channelEndTime) {

    Preconditions.checkNotNull(channelEffectiveTime, CHANNEL_EFFECTIVE_TIME_NOT_NULL);
    Preconditions.checkNotNull(channelEndTime, CHANNEL_END_TIME_NOT_NULL);
    Preconditions.checkNotNull(
        site, SITE_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime);
    Preconditions.checkNotNull(wfdisc, WFDISCS_NOT_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime);
    Preconditions.checkNotNull(
        siteChan, SITE_CHANS_MUST_NOT_BE_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime);
    Preconditions.checkNotNull(
        possibleSensor, SENSORS_NOT_NULL + EFFECTIVE_TIME_STR, channelEffectiveTime);

    Preconditions.checkState(
        channelEffectiveTime.isBefore(channelEndTime),
        CHANNEL_START_END_TIME_STR,
        channelEffectiveTime,
        channelEndTime);

    // For arrays, we should be able to tell that a derived channel exists when a
    // reference station (e.g., reference station is ASAR in the site table,
    // sta is ASAR in site table) has a channel in the sitechan (e.g., sta is ASAR
    // and it has a channel SHZ ), whereas for channels in the sitechan that don't
    // match a reference station (e.g., sta in site table is AS01 and its reference
    // station is ASAR, sta in sitechan is AS01 and it has a channel SHZ,) those
    // would be raw channels. 3 component channels tend to be raw channels as we don't
    // beam on 3 component channels
    // Statype is ss (single station) == raw
    Preconditions.checkState(
        possibleSensor.isPresent(),
        "Cannot convert raw channel if sensor is not present for site chan %s.%s and effective time"
            + " %s",
        siteChan.getId().getStationCode(),
        siteChan.getId().getChannelCode(),
        channelEffectiveTime);
    SensorDao sensor = possibleSensor.get();
    ResponseConverterTransform responseConverterTransform =
        (WfdiscDao wfdiscDao,
            SensorDao sensorDao,
            Calibration calibration,
            FrequencyAmplitudePhase frequencyAmplitudePhase) ->
            responseConverter.convertToEntity(wfdiscDao);

    return channelConverter.convert(
        siteChan,
        site,
        sensor,
        sensor.getInstrument(),
        wfdisc,
        Range.open(siteChan.getId().getOnDate(), siteChan.getOffDate()),
        responseConverterTransform);
  }

  /**
   * Build list of {@link Channel}s using response converter transform
   *
   * @param startEndTime channel effective time
   * @param sites list of {@link SiteDao}
   * @param siteChans list of {@link SiteChanDao}
   * @param sensors list of {@link SensorDao}
   * @param wfdiscs list of {@link WfdiscDao}
   * @param responses list of {@link Response}
   * @return list of {@link Channel}
   */
  private List<Channel> createChannelTablesAndMaps(
      Pair<Instant, Instant> startEndTime,
      List<SiteDao> sites,
      List<SiteChanDao> siteChans,
      List<SensorDao> sensors,
      List<WfdiscDao> wfdiscs,
      List<Response> responses,
      UnaryOperator<Response> responseFacet,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    TemporalMap<String, SiteDao> siteVersionsBySta =
        sites.stream()
            .collect(
                TemporalMap.collector(
                    Functions.compose(SiteKey::getStationCode, SiteDao::getId),
                    Functions.compose(SiteKey::getOnDate, SiteDao::getId)));

    Table<String, String, NavigableMap<Instant, SiteChanDao>> siteChansByStationAndChannel =
        AssemblerUtils.buildVersionTable(
            Functions.compose(SiteChanKey::getStationCode, SiteChanDao::getId),
            Functions.compose(SiteChanKey::getChannelCode, SiteChanDao::getId),
            Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId),
            siteChans);

    Table<String, String, NavigableMap<Instant, SensorDao>> sensorVersionsByStaChan =
        AssemblerUtils.buildVersionTable(
            Functions.compose(SensorKey::getStation, SensorDao::getSensorKey),
            Functions.compose(SensorKey::getChannel, SensorDao::getSensorKey),
            Functions.compose(SensorKey::getTime, SensorDao::getSensorKey),
            sensors);

    Table<String, String, NavigableMap<Instant, WfdiscDao>> wfdiscVersionsByStaChan =
        AssemblerUtils.buildVersionTable(
            WfdiscDao::getStationCode, WfdiscDao::getChannelCode, WfdiscDao::getTime, wfdiscs);

    TemporalMap<UUID, Response> idToResponseMap =
        responses.stream()
            .collect(
                TemporalMap.collector(
                    Response::getId, Functions.compose(Optional::get, Response::getEffectiveAt)));

    return siteChansByStationAndChannel.rowKeySet().stream()
        .flatMap(
            (String staKey) -> {
              var chanNavmap = siteChansByStationAndChannel.row(staKey);
              return chanNavmap.entrySet().stream()
                  .flatMap(
                      entry ->
                          processChannels(
                              startEndTime,
                              siteVersionsBySta.getVersionMap(staKey),
                              entry.getValue(),
                              sensorVersionsByStaChan.row(staKey).get(entry.getKey()),
                              wfdiscVersionsByStaChan.row(staKey).get(entry.getKey()),
                              idToResponseMap,
                              responseFacet,
                              startEndBooleans)
                              .stream());
            })
        .filter(Objects::nonNull)
        .sorted()
        .toList();
  }

  private List<Channel> processChannels(
      Pair<Instant, Instant> startEndTime,
      NavigableMap<Instant, SiteDao> siteVersions,
      NavigableMap<Instant, SiteChanDao> siteChanVersions,
      NavigableMap<Instant, SensorDao> sensorVersions,
      NavigableMap<Instant, WfdiscDao> wfdiscVersions,
      TemporalMap<UUID, Response> idToResponseMap,
      UnaryOperator<Response> responseFacet,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    // determine if range or single point in time
    boolean isRange = startEndTime.getLeft().isBefore(startEndTime.getRight());

    NavigableSet<Instant> possibleVersionTimes =
        getChangeTimes(
            siteVersions,
            siteChanVersions,
            sensorVersions,
            wfdiscVersions,
            idToResponseMap,
            startEndBooleans);
    var validTimes = AssemblerUtils.getValidTimes(startEndTime, possibleVersionTimes, isRange);

    return processPossibleVersionTimes(
        startEndTime,
        validTimes,
        siteVersions,
        siteChanVersions,
        sensorVersions,
        wfdiscVersions,
        idToResponseMap,
        responseFacet);
  }

  private List<Channel> processPossibleVersionTimes(
      Pair<Instant, Instant> startEndTime,
      List<Instant> possibleVersionTimes,
      NavigableMap<Instant, SiteDao> sitesForVersion,
      NavigableMap<Instant, SiteChanDao> siteChansForVersion,
      NavigableMap<Instant, SensorDao> sensorsForVersion,
      NavigableMap<Instant, WfdiscDao> wfdiscsForVersion,
      TemporalMap<UUID, Response> responses,
      UnaryOperator<Response> responseFacet) {

    List<Channel> retChannels = new ArrayList<>();

    for (var i = 0; i < possibleVersionTimes.size() - 1; i++) {
      Range<Instant> versionRange =
          Range.open(possibleVersionTimes.get(i), possibleVersionTimes.get(i + 1));
      Instant currTime;

      Optional<SiteDao> possibleSite;
      Optional<SiteChanDao> possibleSiteChan;
      Optional<SensorDao> possibleSensorDao;
      Optional<WfdiscDao> possibleWfdiscDao;

      if (startEndTime.getLeft().equals(startEndTime.getRight())
          && versionRange.contains(startEndTime.getLeft())) {

        currTime = startEndTime.getLeft();

        possibleSite =
            AssemblerUtils.getObjectsForVersionTimeEnd(
                currTime, sitesForVersion, SiteDao::getOffDate);
        possibleSiteChan =
            AssemblerUtils.getObjectsForVersionTimeEnd(
                currTime, siteChansForVersion, SiteChanDao::getOffDate);
        possibleSensorDao =
            AssemblerUtils.getObjectsForVersionTimeEnd(
                currTime,
                sensorsForVersion,
                Functions.compose(SensorKey::getEndTime, SensorDao::getSensorKey));
        possibleWfdiscDao =
            AssemblerUtils.getObjectsForVersionTimeEnd(
                currTime, wfdiscsForVersion, WfdiscDao::getEndTime);
      } else {
        currTime = versionRange.lowerEndpoint();

        possibleSite =
            AssemblerUtils.getObjectsForVersionTime(currTime, sitesForVersion, SiteDao::getOffDate);
        possibleSiteChan =
            AssemblerUtils.getObjectsForVersionTime(
                currTime, siteChansForVersion, SiteChanDao::getOffDate);
        possibleSensorDao =
            AssemblerUtils.getObjectsForVersionTime(
                currTime,
                sensorsForVersion,
                Functions.compose(SensorKey::getEndTime, SensorDao::getSensorKey));
        possibleWfdiscDao =
            AssemblerUtils.getObjectsForVersionTime(
                currTime, wfdiscsForVersion, WfdiscDao::getEndTime);
      }

      Optional<Response> possibleResponse =
          getPossibleResponse(responses, possibleSensorDao, versionRange, startEndTime);

      if (possibleResponse.isPresent()
          && !getEffectiveUntilFromResponse(possibleResponse.get()).isAfter(currTime)) {
        possibleResponse = Optional.empty();
      }

      if (possibleResponse.isPresent()) {
        possibleResponse = Optional.of(responseFacet.apply(possibleResponse.get()));
      }

      var chanRange =
          Range.open(
              versionRange.lowerEndpoint(),
              AssemblerUtils.getImmediatelyBeforeInstant(versionRange.upperEndpoint()));

      Optional<Channel> curChannel =
          convertChannel(
              chanRange,
              possibleSiteChan.orElse(null),
              possibleSite.orElse(null),
              possibleSensorDao.orElse(null),
              possibleWfdiscDao.orElse(null),
              possibleResponse);

      if (curChannel.isPresent()) {
        retChannels.add(curChannel.get());
      }
    }

    return retChannels;
  }

  private static Optional<Response> getPossibleResponse(
      TemporalMap<UUID, Response> responses,
      Optional<SensorDao> possibleSensorDao,
      Range<Instant> currRange,
      Pair<Instant, Instant> startEndTime) {

    Instant correctTime;
    // for effective at time requests
    if (startEndTime.getLeft().equals(startEndTime.getRight())
        && currRange.contains(startEndTime.getLeft())) {

      correctTime = startEndTime.getLeft();
    } else {
      correctTime = currRange.lowerEndpoint();
    }

    return possibleSensorDao.isPresent()
        ? responses.getVersionFloor(
            UUID.nameUUIDFromBytes(
                (possibleSensorDao.get().getSensorKey().getStation()
                        + possibleSensorDao.get().getSensorKey().getChannel())
                    .getBytes()),
            correctTime)
        : Optional.empty();
  }

  private Optional<Channel> convertChannel(
      Range<Instant> versionRange,
      SiteChanDao siteChanDao,
      SiteDao siteDao,
      SensorDao sensor,
      WfdiscDao wfdiscDao,
      Optional<Response> response) {
    Optional<Channel> curChannel = Optional.empty();
    try {

      curChannel =
          Optional.of(
              channelConverter.convert(
                  siteChanDao,
                  siteDao,
                  sensor != null ? sensor.getInstrument() : null,
                  wfdiscDao,
                  versionRange,
                  response.orElse(null)));
    } catch (Exception ex) {
      var errMessage =
          String.format(
              "Could not convert channel with time range %s - %s",
              versionRange.lowerEndpoint(), versionRange.upperEndpoint());
      if (siteChanDao != null) {
        var statChanCode =
            siteChanDao.getId().getStationCode() + "." + siteChanDao.getId().getChannelCode();
        errMessage = errMessage.concat(String.format(" for station.channel %s", statChanCode));
      }
      if (siteDao != null) {
        var statCode = siteDao.getId().getStationCode();
        errMessage = errMessage.concat(String.format(" for station %s", statCode));
      }
      LOGGER.warn(errMessage);
    }
    return curChannel;
  }

  private NavigableSet<Instant> getChangeTimes(
      NavigableMap<Instant, SiteDao> sitesForRange,
      NavigableMap<Instant, SiteChanDao> siteChansForRange,
      NavigableMap<Instant, SensorDao> sensorsForRange,
      NavigableMap<Instant, WfdiscDao> wfdiscsForRange,
      TemporalMap<UUID, Response> idToResponseMap,
      StartAndEndForSiteAndSiteChan startEndBooleans) {

    NavigableSet<Instant> changeTimes =
        getChangeTimesForWfdiscSensorAndResponse(
            sensorsForRange, wfdiscsForRange, idToResponseMap, siteChansForRange);

    AssemblerUtils.addChangeTimesToListForDaosWithDayAccuracy(
        changeTimes,
        siteChansForRange,
        changeOccuredForSiteChan,
        Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId),
        SiteChanDao::getOffDate,
        startEndBooleans::isPrevTimeOverLapForSiteChan,
        startEndBooleans::isNextTimeOverLapForSiteChan);
    AssemblerUtils.addChangeTimesToListForDaosWithDayAccuracy(
        changeTimes,
        sitesForRange,
        changeOccuredForSite,
        Functions.compose(SiteKey::getOnDate, SiteDao::getId),
        SiteDao::getOffDate,
        startEndBooleans::isPrevTimeOverLapForSite,
        startEndBooleans::isNextTimeOverLapForSite);

    return changeTimes;
  }

  private static NavigableSet<Instant> getChangeTimesForWfdiscSensorAndResponse(
      NavigableMap<Instant, SensorDao> sensorsForRange,
      NavigableMap<Instant, WfdiscDao> wfdiscsForRange,
      TemporalMap<UUID, Response> idToResponseMap,
      NavigableMap<Instant, SiteChanDao> siteChansForRange) {

    var changeTimes = new TreeSet<Instant>();
    NavigableSet<Instant> siteChanTimes =
        getPossibleTimes(
            siteChansForRange,
            Functions.compose(SiteChanKey::getOnDate, SiteChanDao::getId),
            SiteChanDao::getOffDate);

    NavigableSet<Instant> possibleTimes =
        getPossibleTimes(wfdiscsForRange, WfdiscDao::getTime, WfdiscDao::getEndTime);
    possibleTimes.addAll(
        getPossibleTimes(
            sensorsForRange,
            Functions.compose(SensorKey::getTime, SensorDao::getSensorKey),
            Functions.compose(SensorKey::getEndTime, SensorDao::getSensorKey)));

    Iterator<Instant> versionTimeIterator = possibleTimes.iterator();

    Optional<WfdiscDao> currWfdisc;
    Optional<SensorDao> currSensor;
    Optional<WfdiscDao> prevWfdisc = Optional.empty();
    Optional<SensorDao> prevSensor = Optional.empty();
    Optional<UUID> prevResponse = Optional.empty();
    Optional<UUID> currResponse;
    Optional<Double> prevSampleRate = Optional.empty();
    Optional<Double> currSampleRate;

    while (versionTimeIterator.hasNext()) {

      var currInstant = versionTimeIterator.next();
      currWfdisc =
          AssemblerUtils.getObjectsForVersionTime(
              currInstant, wfdiscsForRange, WfdiscDao::getEndTime);
      currSensor =
          AssemblerUtils.getObjectsForVersionTime(
              currInstant,
              sensorsForRange,
              Functions.compose(SensorKey::getEndTime, SensorDao::getSensorKey));

      currSampleRate = getCurrSampleRate(currWfdisc, currSensor);
      currResponse = getCurrResponse(currWfdisc, idToResponseMap, currInstant);

      boolean hasChannelChanged =
          (!currSensor.equals(prevSensor) || !currWfdisc.equals(prevWfdisc))
              && AssemblerUtils.changeTimeExistsForDay(currInstant, siteChanTimes);

      // if sample rate changes
      if (!prevSampleRate.equals(currSampleRate)
          // or response changes add time
          || !prevResponse.equals(currResponse)
          // or sensor/wfdisc changes and the sitechans indicate this caused a channel change
          || hasChannelChanged) {
        changeTimes.add(currInstant);
      } else {
        // do nothing because no change is triggered
      }

      prevSampleRate = currSampleRate;
      prevResponse = currResponse;
      prevWfdisc = currWfdisc;
      prevSensor = currSensor;
    }
    return changeTimes;
  }

  private static Optional<Double> getCurrSampleRate(
      Optional<WfdiscDao> currWfdisc, Optional<SensorDao> currSensor) {

    Double currSampleRate = null;
    if (currSensor.isPresent()) {
      var ins = currSensor.get().getInstrument();
      currSampleRate = ins.getSampleRate();
    } else if (currWfdisc.isPresent()) {
      currSampleRate = currWfdisc.get().getSampRate();
    } else {
      // when neither the sensor or wfdisc is present, the sample rate is null; take no action
    }

    return Optional.ofNullable(currSampleRate);
  }

  private static Optional<UUID> getCurrResponse(
      Optional<WfdiscDao> currWfdisc,
      TemporalMap<UUID, Response> idToResponseMap,
      Instant currInstant) {

    Optional<Response> currResponse;
    if (currWfdisc.isPresent()) {
      currResponse =
          idToResponseMap.getVersionFloor(
              UUID.nameUUIDFromBytes(
                  (currWfdisc.get().getStationCode() + currWfdisc.get().getChannelCode())
                      .getBytes()),
              currInstant);
    } else {
      return Optional.empty();
    }

    if (currResponse.isPresent()
        && getEffectiveUntilFromResponse(currResponse.get()).isAfter(currInstant)) {
      return Optional.of(currResponse.get().getId());
    }

    return Optional.empty();
  }

  private static <V> NavigableSet<Instant> getPossibleTimes(
      NavigableMap<Instant, V> daosForRange,
      Function<V, Instant> startTimeExtractor,
      Function<V, Instant> endTimeExtractor) {

    if (daosForRange == null) {
      return new TreeSet<>();
    }

    var possibleVersionTimes = new TreeSet<Instant>();
    Instant prevTime = null;

    for (Map.Entry<Instant, V> dao : daosForRange.entrySet()) {
      Instant effectiveAt = startTimeExtractor.apply(dao.getValue());
      possibleVersionTimes.add(effectiveAt);

      if (prevTime != null
          && !AssemblerUtils.fullTimePrecisionObjectAdjacent(prevTime, effectiveAt)) {
        possibleVersionTimes.add(AssemblerUtils.getImmediatelyAfterInstant(prevTime));
      }
      prevTime = endTimeExtractor.apply(dao.getValue());
    }
    if (prevTime != null) {
      possibleVersionTimes.add(AssemblerUtils.getImmediatelyAfterInstant(prevTime));
    }
    return possibleVersionTimes;
  }
}
