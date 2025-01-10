package gms.shared.stationdefinition.repository.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.repository.WfdiscPreprocessingUtility;
import gms.shared.stationdefinition.testfixtures.DefaultCoiTestFixtures;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class WfdiscPreprocessingTest {

  private static final Instant t1 = Instant.parse("2000-11-10T17:26:44Z");
  private static final Instant t2 = Instant.parse("2002-06-10T17:26:44Z");
  private static final Instant t3 = Instant.parse("2003-07-10T17:26:44Z");
  private static final Instant t4 = Instant.parse("2008-11-10T17:26:44Z");
  private static final Instant t5 = Instant.parse("2010-07-10T17:26:44Z");
  private static final Instant t6 = Instant.parse("2015-09-10T17:26:44Z");
  private static final Instant t7 = Instant.parse("2020-09-10T17:26:44Z");
  private static final Instant t8 = Instant.parse("2021-09-10T17:26:44Z");

  @Test
  void testMergeWfdiscsAndUpdateTime() {
    var sta1 = "STA1";
    var chan1 = "CHAN1";
    var sta2 = "STA2";
    var chan2 = "CHAN2";
    var sta3 = "STA3";
    var chan3 = "CHAN3";

    // GIVEN WFDISCS
    var wfdisc1 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc1.setStationCode(sta1);
    wfdisc1.setChannelCode(chan1);
    wfdisc1.setTime(t1);
    wfdisc1.setEndTime(t2);

    var wfdisc2 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc2.setStationCode(sta2);
    wfdisc2.setChannelCode(chan2);
    wfdisc2.setTime(t1);
    wfdisc2.setEndTime(t2);

    var wfdisc3 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc3.setStationCode(sta2);
    wfdisc3.setChannelCode(chan2);
    wfdisc3.setTime(t3);
    wfdisc3.setEndTime(t4);

    var wfdisc4 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc4.setStationCode(sta2);
    wfdisc4.setChannelCode(chan2);
    wfdisc4.setTime(t5);
    wfdisc4.setEndTime(t6);
    wfdisc4.setCalib(206);

    var wfdisc5 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc5.setStationCode(sta3);
    wfdisc5.setChannelCode(chan3);
    wfdisc5.setTime(t1);
    wfdisc5.setEndTime(t2);

    var wfdisc6 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc6.setStationCode(sta3);
    wfdisc6.setChannelCode(chan3);
    wfdisc6.setTime(t5);
    wfdisc6.setEndTime(t6);
    wfdisc6.setSampRate(88);

    var wfdiscList = List.of(wfdisc1, wfdisc2, wfdisc3, wfdisc4, wfdisc5, wfdisc6);

    var sensor1 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor1.getSensorKey().setStation(sta1);
    sensor1.getSensorKey().setChannel(chan1);
    sensor1.getSensorKey().setTime(t1);
    sensor1.getSensorKey().setEndTime(Instant.MAX);

    var sensor2 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor2.getSensorKey().setStation(sta2);
    sensor2.getSensorKey().setChannel(chan2);
    sensor2.getSensorKey().setTime(t1);
    sensor2.getSensorKey().setEndTime(t6);

    var sensor3 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor3.getSensorKey().setStation(sta3);
    sensor3.getSensorKey().setChannel(chan3);
    sensor3.getSensorKey().setTime(t1);
    sensor3.getSensorKey().setEndTime(t3.minusMillis(1));

    var sensor4 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor4.getSensorKey().setStation(sta3);
    sensor4.getSensorKey().setChannel(chan3);
    sensor4.getSensorKey().setTime(t3.plusSeconds(5000));
    sensor4.getSensorKey().setEndTime(t7);

    var sensorList = List.of(sensor1, sensor2, sensor3, sensor4);

    var actual = WfdiscPreprocessingUtility.mergeWfdiscsAndUpdateTime(wfdiscList, sensorList);

    assertEquals(5, actual.size());

    HashSet<String> actualValues = new HashSet<>();
    for (WfdiscDao wfdisc : actual) {

      actualValues.add(
          wfdisc.getStationCode()
              + wfdisc.getChannelCode()
              + wfdisc.getTime().toString()
              + wfdisc.getEndTime().toString());
    }

    HashSet<String> expectedValues = new HashSet<>();
    expectedValues.add(sta1 + chan1 + t1 + Instant.MAX.toString());
    expectedValues.add(sta2 + chan2 + t1 + t5.minusMillis(1).toString());
    expectedValues.add(sta2 + chan2 + t5 + t6);
    expectedValues.add(sta3 + chan3 + t1 + t3.minusMillis(1).toString());
    expectedValues.add(sta3 + chan3 + t5 + t7);

    for (String val : expectedValues) {
      Assertions.assertTrue(actualValues.contains(val));
    }
  }

  @Test
  void testSensorAppearingWfdiscTime() {

    var sta1 = "STA1";
    var chan1 = "CHAN1";

    // GIVEN WFDISCS
    var wfdisc1 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc1.setStationCode(sta1);
    wfdisc1.setChannelCode(chan1);
    wfdisc1.setTime(t1);
    wfdisc1.setEndTime(t2);

    var wfdisc2 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc2.setStationCode(sta1);
    wfdisc2.setChannelCode(chan1);
    wfdisc2.setTime(t4);
    wfdisc2.setEndTime(t5);

    var wfdiscList = List.of(wfdisc1, wfdisc2);

    // sensor appears
    var sensor1 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor1.getSensorKey().setStation(sta1);
    sensor1.getSensorKey().setChannel(chan1);
    sensor1.getSensorKey().setTime(t3);
    sensor1.getSensorKey().setEndTime(t4);

    var sensorList = List.of(sensor1);
    var actual = WfdiscPreprocessingUtility.mergeWfdiscsAndUpdateTime(wfdiscList, sensorList);

    assertEquals(2, actual.size());

    HashSet<String> actualValues = new HashSet<>();
    for (WfdiscDao wfdisc : actual) {

      actualValues.add(
          wfdisc.getStationCode()
              + wfdisc.getChannelCode()
              + wfdisc.getTime().toString()
              + wfdisc.getEndTime().toString());
    }

    HashSet<String> expectedValues = new HashSet<>();
    expectedValues.add(sta1 + chan1 + t1 + t3);
    expectedValues.add(sta1 + chan1 + t4 + Instant.MAX.toString());

    for (String val : expectedValues) {
      Assertions.assertTrue(actualValues.contains(val));
    }
  }

  @Test
  void testSensorGap() {

    var sta1 = "STA1";
    var chan1 = "CHAN1";

    // GIVEN WFDISCS
    var wfdisc1 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc1.setStationCode(sta1);
    wfdisc1.setChannelCode(chan1);
    wfdisc1.setTime(t1);
    wfdisc1.setEndTime(t2);

    var wfdisc2 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc2.setStationCode(sta1);
    wfdisc2.setChannelCode(chan1);
    wfdisc2.setTime(t4);
    wfdisc2.setEndTime(t5);

    var wfdiscList = List.of(wfdisc1, wfdisc2);

    // sensor gap
    var sensor1 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor1.getSensorKey().setStation(sta1);
    sensor1.getSensorKey().setChannel(chan1);
    sensor1.getSensorKey().setTime(t1);
    sensor1.getSensorKey().setEndTime(t3);

    // sensor disappears
    var sensor2 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor2.getSensorKey().setStation(sta1);
    sensor2.getSensorKey().setChannel(chan1);
    sensor2.getSensorKey().setTime(t3.plusSeconds(8000));
    sensor2.getSensorKey().setEndTime(t6);

    var sensorList = List.of(sensor1, sensor2);
    var actual = WfdiscPreprocessingUtility.mergeWfdiscsAndUpdateTime(wfdiscList, sensorList);

    assertEquals(2, actual.size());

    HashSet<String> actualValues = new HashSet<>();
    for (WfdiscDao wfdisc : actual) {

      actualValues.add(
          wfdisc.getStationCode()
              + wfdisc.getChannelCode()
              + wfdisc.getTime().toString()
              + wfdisc.getEndTime().toString());
    }

    HashSet<String> expectedValues = new HashSet<>();
    expectedValues.add(sta1 + chan1 + t1 + t3);
    expectedValues.add(sta1 + chan1 + t4 + t6);

    for (String val : expectedValues) {
      Assertions.assertTrue(actualValues.contains(val));
    }
  }

  @ParameterizedTest
  @MethodSource("getSensors")
  void testSensorAttrributeChange(
      List<WfdiscDao> wfdiscList, List<SensorDao> sensorList, HashSet<String> expectedValues) {

    var actual = WfdiscPreprocessingUtility.mergeWfdiscsAndUpdateTime(wfdiscList, sensorList);

    assertEquals(2, actual.size());

    HashSet<String> actualValues = new HashSet<>();
    for (WfdiscDao wfdisc : actual) {

      actualValues.add(
          wfdisc.getStationCode()
              + wfdisc.getChannelCode()
              + wfdisc.getTime().toString()
              + wfdisc.getEndTime().toString());
    }

    for (String val : expectedValues) {
      Assertions.assertTrue(actualValues.contains(val));
    }
  }

  static Stream<Arguments> getSensors() {

    var sta1 = "STA1";
    var chan1 = "CHAN1";
    // GIVEN WFDISCS
    var wfdisc1 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc1.setStationCode(sta1);
    wfdisc1.setChannelCode(chan1);
    wfdisc1.setTime(t1);
    wfdisc1.setEndTime(t2);

    var wfdisc2 = DefaultCoiTestFixtures.getDefaultWfdisc();
    wfdisc2.setStationCode(sta1);
    wfdisc2.setChannelCode(chan1);
    wfdisc2.setTime(t4);
    wfdisc2.setEndTime(t5);

    var wfdiscList = List.of(wfdisc1, wfdisc2);

    // sample rate
    var sensor1 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor1.getSensorKey().setStation(sta1);
    sensor1.getSensorKey().setChannel(chan1);
    sensor1.getSensorKey().setTime(t1);
    sensor1.getSensorKey().setEndTime(t3);
    sensor1.getInstrument().setSampleRate(20);

    var sensor2 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor2.getSensorKey().setStation(sta1);
    sensor2.getSensorKey().setChannel(chan1);
    sensor2.getSensorKey().setTime(t3);
    sensor2.getSensorKey().setEndTime(t6);
    sensor2.getInstrument().setSampleRate(40);

    var sensor3 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor3.getSensorKey().setStation(sta1);
    sensor3.getSensorKey().setChannel(chan1);
    sensor3.getSensorKey().setTime(t1);
    sensor3.getSensorKey().setEndTime(t3);
    sensor3.getInstrument().setNominalCalibrationFactor(20);

    var sensor4 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor4.getSensorKey().setStation(sta1);
    sensor4.getSensorKey().setChannel(chan1);
    sensor4.getSensorKey().setTime(t3);
    sensor4.getSensorKey().setEndTime(t6);
    sensor4.getInstrument().setNominalCalibrationFactor(40);

    var sensor5 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor5.getSensorKey().setStation(sta1);
    sensor5.getSensorKey().setChannel(chan1);
    sensor5.getSensorKey().setTime(t1);
    sensor5.getSensorKey().setEndTime(t3);
    sensor5.setCalibrationPeriod(20);

    var sensor6 = DefaultCoiTestFixtures.getDefaultSensorDao();
    sensor6.getSensorKey().setStation(sta1);
    sensor6.getSensorKey().setChannel(chan1);
    sensor6.getSensorKey().setTime(t3);
    sensor6.getSensorKey().setEndTime(t6);
    sensor6.setCalibrationPeriod(40);

    HashSet<String> expectedValues = new HashSet<>();
    expectedValues.add(sta1 + chan1 + t1 + t3);
    expectedValues.add(sta1 + chan1 + t4 + t6);

    return Stream.of(
        arguments(wfdiscList, List.of(sensor1, sensor2), expectedValues),
        arguments(wfdiscList, List.of(sensor1, sensor2), expectedValues),
        arguments(wfdiscList, List.of(sensor1, sensor2), expectedValues));
  }
}
