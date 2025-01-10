package gms.shared.stationdefinition.repository;

import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.api.channel.ResponseRepository;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Calibration;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.converter.util.StationDefinitionDataHolder;
import gms.shared.stationdefinition.converter.util.assemblers.ResponseAssembler;
import gms.shared.stationdefinition.converter.util.assemblers.StationDefinitionVersionUtility;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SensorKey;
import gms.shared.stationdefinition.dao.css.SiteChanKey;
import gms.shared.stationdefinition.dao.css.SiteDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.database.connector.InstrumentDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SensorDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteChanDatabaseConnector;
import gms.shared.stationdefinition.database.connector.SiteDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component("bridgedResponseRepository")
public class BridgedResponseRepository implements ResponseRepository {

  private static final Logger logger = LoggerFactory.getLogger(BridgedResponseRepository.class);

  private final WfdiscDatabaseConnector wfdiscDatabaseConnector;
  private final SensorDatabaseConnector sensorDatabaseConnector;
  private final InstrumentDatabaseConnector instrumentDatabaseConnector;
  private final SiteDatabaseConnector siteDatabaseConnector;
  private final SiteChanDatabaseConnector siteChanDatabaseConnector;
  private final StationDefinitionIdUtility stationDefinitionIdUtility;
  private final ResponseAssembler responseAssembler;

  public BridgedResponseRepository(
      WfdiscDatabaseConnector wfdiscDatabaseConnector,
      SensorDatabaseConnector sensorDatabaseConnector,
      InstrumentDatabaseConnector instrumentDatabaseConnector,
      SiteDatabaseConnector siteDatabaseConnector,
      SiteChanDatabaseConnector siteChanDatabaseConnector,
      StationDefinitionIdUtility stationDefinitionIdUtility,
      ResponseAssembler responseAssembler) {
    this.wfdiscDatabaseConnector = wfdiscDatabaseConnector;
    this.sensorDatabaseConnector = sensorDatabaseConnector;
    this.instrumentDatabaseConnector = instrumentDatabaseConnector;
    this.siteDatabaseConnector = siteDatabaseConnector;
    this.siteChanDatabaseConnector = siteChanDatabaseConnector;
    this.stationDefinitionIdUtility = stationDefinitionIdUtility;
    this.responseAssembler = responseAssembler;
  }

  /**
   * Returns a list of {@link Response}s based on response {@link UUID}s and an effective time. This
   * list is filtered based on the effective time, so responses with effectiveUntil times before the
   * effectiveTime argument and responses without effectiveUntil times are not included in the list.
   *
   * @param responseIds the response IDs of interest
   * @param effectiveTime the effectiveTime of interest
   * @return a filtered list of {@link Response}s for the response IDs at the effective time
   */
  @Override
  public List<Response> findResponsesById(Collection<UUID> responseIds, Instant effectiveTime) {
    Objects.requireNonNull(responseIds);
    Objects.requireNonNull(effectiveTime);

    List<SiteChanKey> siteChanKeys =
        responseIds.stream()
            .map(stationDefinitionIdUtility::getChannelForResponseId)
            .flatMap(Optional::stream)
            .map(StationDefinitionIdUtility::getCssKeyFromName)
            .toList();

    return findResponsesBySiteChanKeys(siteChanKeys, effectiveTime).stream()
        .filter(
            response ->
                !response.getEffectiveUntil().isPresent()
                    || !effectiveTime.isAfter(response.getEffectiveUntil().get()))
        .toList();
  }

  /**
   * Returns a list of {@link Response}s based on {@link SiteChanKey}s and an effective time. This
   * list is not filtered based on the effective time, so responses with effectiveUntil times before
   * the effectiveTime argument and responses without effectiveUntil times are included in the list.
   *
   * @param siteChanKeys the {@link SiteChanKey}s of interest
   * @param effectiveTime the effectiveTime of interest
   * @return an unfiltered list of {@link Response}s for the site channel keys and effective time
   */
  public List<Response> findResponsesBySiteChanKeys(
      List<SiteChanKey> siteChanKeys, Instant effectiveTime) {
    Objects.requireNonNull(siteChanKeys);
    Objects.requireNonNull(effectiveTime);

    StationDefinitionDataHolder data =
        getResponseRepositoryDataForTime(siteChanKeys, effectiveTime);

    return responseAssembler.buildAllForTime(
        effectiveTime,
        data.getWfdiscVersions(),
        data.getSensorDaos(),
        data.getInstrumentDaos(),
        mapStationNameToReferenceStation(data.getSiteDaos()));
  }

  @Override
  public List<Response> findResponsesByIdAndTimeRange(
      Collection<UUID> responseIds, Instant startTime, Instant endTime) {
    Objects.requireNonNull(responseIds);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Preconditions.checkState(
        !endTime.isBefore(startTime), "End time must not be before start time");

    List<SiteChanKey> siteChanKeys =
        responseIds.stream()
            .map(stationDefinitionIdUtility::getChannelForResponseId)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .map(StationDefinitionIdUtility::getCssKeyFromName)
            .toList();

    return findResponsesBySiteChanKeysAndTimeRange(siteChanKeys, startTime, endTime);
  }

  public List<Response> findResponsesBySiteChanKeysAndTimeRange(
      List<SiteChanKey> siteChanKeys, Instant startTime, Instant endTime) {
    Objects.requireNonNull(siteChanKeys);
    Objects.requireNonNull(startTime);
    Objects.requireNonNull(endTime);
    Preconditions.checkState(
        !endTime.isBefore(startTime), "End time must not be before start time");

    StationDefinitionDataHolder data =
        getResponseRepositoryDataForTimeRange(siteChanKeys, startTime, endTime);
    return responseAssembler.buildAllForTimeRange(
        startTime,
        endTime,
        data.getWfdiscVersions(),
        data.getSensorDaos(),
        data.getInstrumentDaos(),
        mapStationNameToReferenceStation(data.getSiteDaos()));
  }

  public List<Response> findResponsesGivenSensorAndWfdisc(
      StationDefinitionDataHolder stationDefinitionDataHolder, Instant startTime, Instant endTime) {

    Objects.requireNonNull(stationDefinitionDataHolder.getSensorDaos());
    Objects.requireNonNull(stationDefinitionDataHolder.getWfdiscVersions());

    var instrumentDaos =
        BridgedRepositoryUtils.getInstrumentData(
            stationDefinitionDataHolder, instrumentDatabaseConnector);

    return responseAssembler.buildAllForTimeRange(
        startTime,
        endTime,
        stationDefinitionDataHolder.getWfdiscVersions(),
        stationDefinitionDataHolder.getSensorDaos(),
        instrumentDaos,
        mapStationNameToReferenceStation(stationDefinitionDataHolder.getSiteDaos()));
  }

  private StationDefinitionDataHolder getResponseRepositoryDataForTimeRange(
      List<SiteChanKey> siteChanKeys, Instant startTime, Instant endTime) {

    List<SensorDao> sensors =
        sensorDatabaseConnector.findSensorsByKeyAndTimeRange(siteChanKeys, startTime, endTime);

    Map<Integer, List<SensorDao>> sensorDaoByVersionMap =
        StationDefinitionVersionUtility.getVersionMapAsInt(
            sensors, SensorDao::getVersionAttributeHash, SensorDao::getVersionTimeHash);

    List<SensorDao> sensorVersions =
        sensorDaoByVersionMap.values().stream()
            .map(StationDefinitionVersionUtility::getSensorsWithVersionEndTime)
            .flatMap(List::stream)
            .toList();

    return getResponseRepositoryData(siteChanKeys, sensorVersions, startTime, endTime);
  }

  private StationDefinitionDataHolder getResponseRepositoryDataForTime(
      List<SiteChanKey> siteChanKeys, Instant effectiveTime) {
    logger.info("Entering getResponseRepositoryDataForTime: {}@{}", siteChanKeys, effectiveTime);

    List<SensorDao> sensors =
        StationDefinitionVersionUtility.getSensorsWithVersionEndTime(
            sensorDatabaseConnector.findSensorVersionsByNameAndTime(siteChanKeys, effectiveTime));
    logger.info("Sensors found:{}", sensors);

    var data = getResponseRepositoryData(siteChanKeys, sensors, effectiveTime, effectiveTime);
    logger.info("ResponseRepositoryData: {}", data);
    return data;
  }

  private StationDefinitionDataHolder getResponseRepositoryData(
      List<SiteChanKey> siteChanKeys, List<SensorDao> sensors, Instant startTime, Instant endTime) {
    List<Long> instrumentIds =
        sensors.stream().map(SensorDao::getInstrument).map(InstrumentDao::getInstrumentId).toList();
    List<InstrumentDao> instruments = instrumentDatabaseConnector.findInstruments(instrumentIds);

    // we only care about wfdiscs if we have a response, which requires a sensor
    Instant wfdiscQueryMin =
        Stream.of(
                sensors.stream()
                    .map(Functions.compose(SensorKey::getTime, SensorDao::getSensorKey))
                    .min(Instant::compareTo)
                    .orElse(Instant.now()),
                startTime)
            .min(Instant::compareTo)
            .orElseThrow();

    Instant wfdiscQueryMax =
        Stream.of(
                sensors.stream()
                    .map(Functions.compose(SensorKey::getEndTime, SensorDao::getSensorKey))
                    .max(Instant::compareTo)
                    .orElse(Instant.now()),
                endTime)
            .max(Instant::compareTo)
            .orElseThrow();

    // the sensor may have large endTime, don't need to query past today
    wfdiscQueryMax =
        Stream.of(wfdiscQueryMax, Instant.now()).min(Instant::compareTo).orElse(Instant.now());

    List<WfdiscDao> wfdiscs =
        WfdiscPreprocessingUtility.mergeWfdiscsAndUpdateTime(
            wfdiscDatabaseConnector.findWfdiscsByNameAndTimeRange(
                siteChanKeys, wfdiscQueryMin, wfdiscQueryMax),
            sensors);

    var siteDaos =
        BridgedRepositoryUtils.findDataByTimeRangeForChannel(
                siteChanKeys,
                startTime,
                endTime,
                siteDatabaseConnector,
                siteChanDatabaseConnector,
                sensorDatabaseConnector,
                wfdiscDatabaseConnector)
            .getSiteDaos();

    return new StationDefinitionDataHolder(siteDaos, null, sensors, instruments, wfdiscs, null);
  }

  @Override
  public Response loadResponseFromWfdisc(long wfdiscRecord) {

    var wfdiscs = wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(wfdiscRecord));

    if (wfdiscs.isEmpty()) {
      throw new IllegalStateException(
          "Unable to retrieve wfdiscs for ID " + wfdiscRecord + " from which to load Response");
    }

    Optional<WfdiscDao> firstWfdisc = wfdiscs.stream().findFirst();
    var wfdisc =
        firstWfdisc.orElseThrow(
            () -> new IllegalStateException("No wfdisc from which to load Response"));
    var startTime = wfdisc.getTime();
    var endTime = wfdisc.getEndTime();
    var siteChanKey = new SiteChanKey(wfdisc.getStationCode(), wfdisc.getChannelCode(), startTime);

    var sensors =
        sensorDatabaseConnector.findSensorsByKeyAndTimeRange(
            List.of(siteChanKey), startTime, endTime);
    var instrumentIds =
        sensors.stream().map(SensorDao::getInstrument).map(InstrumentDao::getInstrumentId).toList();
    var instruments = instrumentDatabaseConnector.findInstruments(instrumentIds);

    StationDefinitionDataHolder data =
        getResponseRepositoryDataForTimeRange(List.of(siteChanKey), startTime, endTime);

    var responses =
        responseAssembler.buildAllForTimeRange(
            startTime,
            endTime,
            List.of(wfdisc),
            sensors,
            instruments,
            mapStationNameToReferenceStation(data.getSiteDaos()));

    var response = responseAssembler.buildResponseEntity(wfdisc);

    var responseBuilder = Response.builder();
    var responseDataBuilder = Response.Data.builder();

    if (!responses.isEmpty()) {

      var updatedCalibration =
          Calibration.from(
              wfdisc.getCalper(),
              Duration.ZERO,
              DoubleValue.from(wfdisc.getCalib(), Optional.empty(), Units.UNITLESS));
      response = responses.get(0);
      responseDataBuilder
          .setFapResponse(response.getFapResponse())
          .setCalibration(updatedCalibration)
          .setEffectiveUntil(response.getEffectiveUntil());
      responseBuilder.setEffectiveAt(response.getEffectiveAt());
    }

    responseBuilder.setId(response.getId());

    var updatedResponse = responseBuilder.setData(responseDataBuilder.build()).build();

    stationDefinitionIdUtility.storeWfidResponseMapping(wfdiscRecord, updatedResponse);

    return updatedResponse;
  }

  private static Map<String, String> mapStationNameToReferenceStation(List<SiteDao> siteDaos) {
    return siteDaos.stream()
        .collect(
            Collectors.toMap(
                siteDao -> siteDao.getId().getStationCode(),
                SiteDao::getReferenceStation,
                (stationCode1, stationCode2) -> stationCode1));
  }
}
