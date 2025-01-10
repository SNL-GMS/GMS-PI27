package gms.shared.stationdefinition.converter.util.assemblers;

import static gms.shared.stationdefinition.converter.ConverterWarnings.EFFECTIVE_TIME_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.EFFECTIVE_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.END_TIME_BEFORE_START_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.END_TIME_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.INSTRUMENTS_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.SENSORS_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.START_END_TIME_STR;
import static gms.shared.stationdefinition.converter.ConverterWarnings.START_TIME_NOT_NULL;
import static gms.shared.stationdefinition.converter.ConverterWarnings.WFDISCS_NOT_NULL;

import com.google.common.base.Functions;
import com.google.common.base.Preconditions;
import com.google.common.collect.Table;
import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.coi.utils.comparator.ResponseComparator;
import gms.shared.stationdefinition.converter.interfaces.CalibrationConverter;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverter;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SensorKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import net.logstash.logback.argument.StructuredArguments;
import net.logstash.logback.marker.Markers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ResponseAssembler {

  private static final Logger LOGGER = LoggerFactory.getLogger(ResponseAssembler.class);
  private static final String STATION = "Station";
  private static final String CHANNEL = "Channel";
  private static final String EFFECTIVE_TIME = "Effective Time";

  private final ResponseConverter responseConverter;
  private final CalibrationConverter calibrationConverter;
  private final StationDefinitionIdUtility stationDefinitionIdUtility;

  public ResponseAssembler(
      ResponseConverter responseConverter,
      CalibrationConverter calibrationConverter,
      StationDefinitionIdUtility stationDefinitionIdUtility) {
    this.responseConverter = responseConverter;
    this.calibrationConverter = calibrationConverter;
    this.stationDefinitionIdUtility = stationDefinitionIdUtility;
  }

  public List<Response> buildAllForTime(
      Instant effectiveAt,
      List<WfdiscDao> wfdiscs,
      List<SensorDao> sensors,
      List<InstrumentDao> instruments,
      Map<String, String> referenceStationsByStationCode) {

    Preconditions.checkNotNull(effectiveAt, EFFECTIVE_TIME_NOT_NULL);
    Preconditions.checkNotNull(wfdiscs, WFDISCS_NOT_NULL + EFFECTIVE_TIME_STR, effectiveAt);
    Preconditions.checkNotNull(sensors, SENSORS_NOT_NULL + EFFECTIVE_TIME_STR, effectiveAt);
    Preconditions.checkNotNull(instruments, INSTRUMENTS_NOT_NULL + EFFECTIVE_TIME_STR, effectiveAt);

    Table<String, String, NavigableMap<Instant, SensorDao>> sensorVersionsByStaChan =
        AssemblerUtils.buildVersionTable(
            Functions.compose(SensorKey::getStation, SensorDao::getSensorKey),
            Functions.compose(SensorKey::getChannel, SensorDao::getSensorKey),
            Functions.compose(SensorKey::getTime, SensorDao::getSensorKey),
            sensors);

    Map<Long, InstrumentDao> instrumentsById =
        instruments.stream()
            .collect(Collectors.toMap(InstrumentDao::getInstrumentId, Function.identity()));

    // group responses by Id
    Map<UUID, List<Response>> responsesGrouped =
        buildAllForTime(
                effectiveAt,
                wfdiscs,
                sensorVersionsByStaChan,
                instrumentsById,
                referenceStationsByStationCode)
            .stream()
            .sorted(new ResponseComparator())
            .collect(Collectors.groupingBy(Response::getId, Collectors.toList()));

    // get latest response from group since the response could be before the effectiveTime,
    // we want the closest response to effectiveTime, even if it's not valid for that time
    return responsesGrouped.values().stream()
        .map(value -> value.stream().reduce((first, second) -> second).orElse(null))
        .filter(Objects::nonNull)
        .toList();
  }

  public List<Response> buildAllForTimeRange(
      Instant startTime,
      Instant endTime,
      List<WfdiscDao> wfdiscs,
      List<SensorDao> sensors,
      List<InstrumentDao> instruments,
      Map<String, String> referenceStationsByStationCode) {

    Preconditions.checkNotNull(startTime, START_TIME_NOT_NULL);
    Preconditions.checkNotNull(endTime, END_TIME_NOT_NULL);
    Preconditions.checkNotNull(wfdiscs, WFDISCS_NOT_NULL + START_END_TIME_STR, startTime, endTime);
    Preconditions.checkNotNull(sensors, SENSORS_NOT_NULL + START_END_TIME_STR, startTime, endTime);
    Preconditions.checkNotNull(
        instruments, INSTRUMENTS_NOT_NULL + START_END_TIME_STR, startTime, endTime);
    Preconditions.checkState(
        !endTime.isBefore(startTime), END_TIME_BEFORE_START_TIME_STR, endTime, startTime);

    Table<String, String, NavigableMap<Instant, SensorDao>> sensorVersionsByStaChan =
        AssemblerUtils.buildVersionTable(
            Functions.compose(SensorKey::getStation, SensorDao::getSensorKey),
            Functions.compose(SensorKey::getChannel, SensorDao::getSensorKey),
            Functions.compose(SensorKey::getTime, SensorDao::getSensorKey),
            sensors);

    Map<Long, InstrumentDao> instrumentsById =
        instruments.stream()
            .collect(
                Collectors.toMap(
                    InstrumentDao::getInstrumentId, Function.identity(), (id1, id2) -> id1));

    return wfdiscs.stream()
        .sorted(Comparator.comparing(WfdiscDao::getTime))
        .map(
            wfdisc ->
                buildAllForTime(
                    wfdisc.getTime(),
                    List.of(wfdisc),
                    sensorVersionsByStaChan,
                    instrumentsById,
                    referenceStationsByStationCode))
        .flatMap(List::stream)
        .sorted(new ResponseComparator())
        .toList();
  }

  private List<Response> buildAllForTime(
      Instant effectiveTime,
      Collection<WfdiscDao> wfdiscs,
      Table<String, String, NavigableMap<Instant, SensorDao>> sensorVersionsByStaChan,
      Map<Long, InstrumentDao> instrumentsById,
      Map<String, String> referenceStationsByStationCode) {

    return wfdiscs.stream()
        .filter(wfdisc -> !wfdisc.getTime().isAfter(effectiveTime))
        .map(
            wfdisc ->
                Optional.ofNullable(
                    buildResponse(
                        effectiveTime,
                        wfdisc,
                        sensorVersionsByStaChan,
                        instrumentsById,
                        referenceStationsByStationCode)))
        .flatMap(Optional::stream)
        .distinct()
        .sorted(new ResponseComparator())
        .toList();
  }

  private Response buildResponse(
      Instant effectiveTime,
      WfdiscDao wfdisc,
      Table<String, String, NavigableMap<Instant, SensorDao>> sensorVersionsByStaChan,
      Map<Long, InstrumentDao> instrumentsById,
      Map<String, String> referenceStationsByStationCode) {
    var station = wfdisc.getStationCode();
    var channel = wfdisc.getChannelCode();

    var sensorDaoVersionMap = sensorVersionsByStaChan.get(station, channel);
    if (sensorDaoVersionMap == null || sensorDaoVersionMap.floorEntry(effectiveTime) == null) {
      LOGGER.warn(
          Markers.append(EFFECTIVE_TIME, effectiveTime),
          "Cannot build response for channel {}.{} without sensor",
          StructuredArguments.v(STATION, station),
          StructuredArguments.v(CHANNEL, channel));
      return null;
    }

    var sensor = sensorDaoVersionMap.floorEntry(effectiveTime).getValue();

    var hasMissingData = false;

    if (!instrumentsById.containsKey(sensor.getInstrument().getInstrumentId())) {
      LOGGER.warn(
          Markers.append(EFFECTIVE_TIME, effectiveTime),
          "Cannot build response for channel {}.{} without instrument",
          StructuredArguments.v(STATION, station),
          StructuredArguments.v(CHANNEL, channel));
      hasMissingData = true;
    } else if (!referenceStationsByStationCode.containsKey(station)) {
      LOGGER.warn("ReferenceStation not available for channel {}.{}", station, channel);
      hasMissingData = true;
    } else {
      // all potentially missing data has been checked
    }

    if (hasMissingData) {
      return null;
    }

    var refStation = referenceStationsByStationCode.get(station);
    var instrumentId = sensor.getInstrument().getInstrumentId();
    var calibration = calibrationConverter.convert(wfdisc, sensor);
    var fapUuid =
        stationDefinitionIdUtility.storeInstrumentIdFrequencyAmplitudePhaseMapping(
            refStation + Channel.NAME_SEPARATOR + station + Channel.NAME_SEPARATOR + channel,
            instrumentId);
    var fap = FrequencyAmplitudePhase.createEntityReference(fapUuid);

    return responseConverter.convert(wfdisc, sensor, calibration, fap);
  }

  public Response buildResponseEntity(WfdiscDao wfdiscDao) {
    return responseConverter.convertToEntity(wfdiscDao);
  }
}
