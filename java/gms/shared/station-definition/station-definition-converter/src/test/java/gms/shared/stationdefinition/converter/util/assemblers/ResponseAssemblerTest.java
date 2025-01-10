package gms.shared.stationdefinition.converter.util.assemblers;

import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.INSTRUMENT_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.INSTRUMENT_DAO_2;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SENSOR_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.SENSOR_DAO_2;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_4;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.END_TIME;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.ONDATE;
import static gms.shared.stationdefinition.testfixtures.CssDaoAndCoiParameters.START_TIME;
import static gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures.STA1;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import gms.shared.stationdefinition.cache.util.StationDefinitionIdUtility;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import gms.shared.stationdefinition.coi.channel.Response;
import gms.shared.stationdefinition.converter.DaoCalibrationConverter;
import gms.shared.stationdefinition.converter.DaoResponseConverter;
import gms.shared.stationdefinition.converter.interfaces.CalibrationConverter;
import gms.shared.stationdefinition.converter.interfaces.ResponseConverter;
import gms.shared.stationdefinition.dao.css.InstrumentDao;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ResponseAssemblerTest {

  private ResponseConverter responseConverter;
  private CalibrationConverter calibrationConverter;
  @Mock private StationDefinitionIdUtility stationDefinitionIdUtility;

  private ResponseAssembler responseAssembler;

  private static final UUID FAP_UUID = UUID.fromString("00000000-000-0000-0000-000000000001");

  @BeforeEach
  void setup() {
    responseConverter = new DaoResponseConverter();
    calibrationConverter = new DaoCalibrationConverter();

    responseAssembler =
        new ResponseAssembler(responseConverter, calibrationConverter, stationDefinitionIdUtility);
  }

  @ParameterizedTest
  @MethodSource("getBuildAllForTimeValidationArguments")
  void testBuildAllForTimeValidation(
      Instant effectiveAt,
      List<WfdiscDao> wfdiscs,
      List<SensorDao> sensors,
      List<InstrumentDao> instrumentDaos,
      Map<String, String> stationMap) {

    assertThrows(
        NullPointerException.class,
        () ->
            responseAssembler.buildAllForTime(
                effectiveAt, wfdiscs, sensors, instrumentDaos, stationMap));
  }

  static Stream<Arguments> getBuildAllForTimeValidationArguments() {
    var stationMap = new HashMap<String, String>();
    return Stream.of(
        arguments(
            null,
            List.of(WFDISC_TEST_DAO_1),
            List.of(SENSOR_DAO_1),
            List.of(INSTRUMENT_DAO_1),
            stationMap),
        arguments(
            Instant.EPOCH, null, List.of(SENSOR_DAO_1), List.of(INSTRUMENT_DAO_1), stationMap),
        arguments(
            Instant.EPOCH, List.of(WFDISC_TEST_DAO_1), null, List.of(INSTRUMENT_DAO_1), stationMap),
        arguments(
            Instant.EPOCH, List.of(WFDISC_TEST_DAO_1), List.of(SENSOR_DAO_1), null, stationMap));
  }

  @ParameterizedTest
  @MethodSource("getBuildAllForTimeArguments")
  void testBuildAllForTime(
      List<Response> expected,
      Instant effectiveAt,
      List<WfdiscDao> wfdiscs,
      List<SensorDao> sensors,
      List<InstrumentDao> instruments,
      Map<String, String> stationMap) {

    if (!expected.isEmpty()) {
      var station = wfdiscs.get(0).getStationCode();
      var channel = wfdiscs.get(0).getChannelCode();
      var refStation = stationMap.get(station);
      var channelName =
          refStation + Channel.NAME_SEPARATOR + station + Channel.NAME_SEPARATOR + channel;
      var instrumentId = instruments.get(0).getInstrumentId();
      var uuidStr = channelName + Long.toString(instrumentId);
      when(stationDefinitionIdUtility.storeInstrumentIdFrequencyAmplitudePhaseMapping(
              any(), eq(instrumentId)))
          .thenReturn(UUID.nameUUIDFromBytes(uuidStr.getBytes(StandardCharsets.UTF_8)));
    }

    List<Response> actual =
        responseAssembler.buildAllForTime(effectiveAt, wfdiscs, sensors, instruments, stationMap);

    assertEquals(expected, actual);
  }

  static Stream<Arguments> getBuildAllForTimeArguments() {
    var stationMap = new HashMap<String, String>();
    stationMap.put(STA1, "STATION");

    var uuidStr =
        "STATION"
            + Channel.NAME_SEPARATOR
            + WFDISC_TEST_DAO_1.getStationCode()
            + Channel.NAME_SEPARATOR
            + WFDISC_TEST_DAO_1.getChannelCode()
            + Long.toString(INSTRUMENT_DAO_1.getInstrumentId());
    var expectedUuid = UUID.nameUUIDFromBytes(uuidStr.getBytes(StandardCharsets.UTF_8));

    return Stream.of(
        arguments(List.of(), Instant.EPOCH, List.of(), List.of(), List.of(), stationMap),
        arguments(
            List.of(),
            Instant.EPOCH,
            List.of(WFDISC_TEST_DAO_1),
            List.of(SENSOR_DAO_1),
            List.of(INSTRUMENT_DAO_1),
            stationMap),
        arguments(
            List.of(),
            ONDATE,
            List.of(WFDISC_TEST_DAO_1),
            List.of(SENSOR_DAO_2),
            List.of(INSTRUMENT_DAO_1),
            stationMap),
        arguments(
            List.of(),
            ONDATE,
            List.of(WFDISC_TEST_DAO_1),
            List.of(SENSOR_DAO_1),
            List.of(INSTRUMENT_DAO_2),
            stationMap),
        arguments(
            List.of(
                new DaoResponseConverter()
                    .convert(
                        WFDISC_TEST_DAO_1,
                        SENSOR_DAO_1,
                        new DaoCalibrationConverter().convert(WFDISC_TEST_DAO_1, SENSOR_DAO_1),
                        FrequencyAmplitudePhase.createEntityReference(expectedUuid))),
            ONDATE,
            List.of(WFDISC_TEST_DAO_1),
            List.of(SENSOR_DAO_1),
            List.of(INSTRUMENT_DAO_1),
            stationMap));
  }

  @ParameterizedTest
  @MethodSource("getBuildAllForTimeRangeValidationArguments")
  void testBuildAllForTimeRangeValidation(
      Class<? extends Exception> expectedException,
      Instant startTime,
      Instant endTime,
      List<WfdiscDao> wfdiscs,
      List<SensorDao> sensors,
      List<InstrumentDao> instruments,
      Map<String, String> stationMap) {

    assertThrows(
        expectedException,
        () ->
            responseAssembler.buildAllForTimeRange(
                startTime, endTime, wfdiscs, sensors, instruments, stationMap));
  }

  static Stream<Arguments> getBuildAllForTimeRangeValidationArguments() {
    var stationMap = new HashMap<String, String>();
    Instant startTime = Instant.EPOCH;
    Instant endTime = startTime.plusSeconds(300);
    return Stream.of(
        arguments(
            NullPointerException.class,
            null,
            endTime,
            List.of(WFDISC_TEST_DAO_1),
            List.of(SENSOR_DAO_1),
            List.of(INSTRUMENT_DAO_1),
            stationMap),
        arguments(
            NullPointerException.class,
            startTime,
            null,
            List.of(WFDISC_TEST_DAO_1),
            List.of(SENSOR_DAO_1),
            List.of(INSTRUMENT_DAO_1),
            stationMap),
        arguments(
            NullPointerException.class,
            startTime,
            endTime,
            null,
            List.of(SENSOR_DAO_1),
            List.of(INSTRUMENT_DAO_1),
            stationMap),
        arguments(
            NullPointerException.class,
            startTime,
            endTime,
            List.of(WFDISC_TEST_DAO_1),
            null,
            List.of(INSTRUMENT_DAO_1),
            stationMap),
        arguments(
            NullPointerException.class,
            startTime,
            endTime,
            List.of(WFDISC_TEST_DAO_1),
            List.of(SENSOR_DAO_1),
            null,
            stationMap),
        arguments(
            IllegalStateException.class,
            endTime,
            startTime,
            List.of(WFDISC_TEST_DAO_1),
            List.of(SENSOR_DAO_1),
            List.of(INSTRUMENT_DAO_1),
            stationMap));
  }

  @Test
  void testBuildAllForTimeRange() {
    when(stationDefinitionIdUtility.storeInstrumentIdFrequencyAmplitudePhaseMapping(any(), any()))
        .thenReturn(FAP_UUID);

    List<Response> responses =
        responseAssembler.buildAllForTimeRange(
            START_TIME,
            END_TIME,
            List.of(WFDISC_TEST_DAO_1, WFDISC_TEST_DAO_4),
            List.of(SENSOR_DAO_1),
            List.of(INSTRUMENT_DAO_1),
            Map.of(STA1, "STATION"));

    assertNotNull(responses);
    assertEquals(2, responses.size());
  }

  @Test
  void testBuildResponseEntity() {
    var id = WFDISC_DAO_1.getStationCode() + WFDISC_DAO_1.getChannelCode();
    var expected = Response.createEntityReference(UUID.nameUUIDFromBytes(id.getBytes()));

    assertEquals(responseAssembler.buildResponseEntity(WFDISC_DAO_1), expected);
  }
}
