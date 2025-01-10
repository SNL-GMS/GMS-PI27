package gms.shared.stationdefinition.repository;

import static gms.shared.stationdefinition.converter.util.assemblers.AssemblerUtils.MAX_GAP_ALLOWED;

import com.google.common.base.Functions;
import gms.shared.stationdefinition.converter.util.TemporalMap;
import gms.shared.stationdefinition.converter.util.assemblers.AssemblerUtils;
import gms.shared.stationdefinition.dao.css.SensorDao;
import gms.shared.stationdefinition.dao.css.SensorKey;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.NavigableMap;
import java.util.NavigableSet;
import java.util.Optional;
import java.util.TreeSet;
import java.util.function.BiPredicate;

public final class WfdiscPreprocessingUtility {

  private static final double EPSILON = 0.000_000_0001;

  static BiPredicate<SensorDao, SensorDao> changeInWfdiscDueToSensors =
      WfdiscPreprocessingUtility::changeInWfdiscDueToSensors;

  private WfdiscPreprocessingUtility() {
    // hide implicit constructor
  }

  private static boolean changeInWfdiscDueToSensors(SensorDao prev, SensorDao next) {
    // change due to sensor appearing/disappearing
    if (prev == null || next == null) {
      return prev != null || next != null;
    }

    // gap between sensors indicates wfdisc change
    if (Duration.between(prev.getSensorKey().getEndTime(), next.getSensorKey().getTime())
            .compareTo(MAX_GAP_ALLOWED)
        > 0) {
      return true;
    }

    var calperEqual = doubleEqualityCheck(prev.getCalibrationPeriod(), next.getCalibrationPeriod());
    var sampRateEqual = true;
    var calibEqual = true;
    if (prev.getInstrument() != null && next.getInstrument() != null) {
      var prevInstrument = prev.getInstrument();
      var nextInstrument = next.getInstrument();

      sampRateEqual =
          doubleEqualityCheck(prevInstrument.getSampleRate(), nextInstrument.getSampleRate());
      calibEqual =
          doubleEqualityCheck(
              prevInstrument.getNominalCalibrationFactor(),
              nextInstrument.getNominalCalibrationFactor());
    }

    // sample rate, calper, or calib change indicates wfdisc change
    return !calperEqual || !sampRateEqual || !calibEqual;
  }

  private static boolean doubleEqualityCheck(double d1, double d2) {

    return Math.abs(d1 - d2) < EPSILON;
  }

  /**
   * When WfdiscDaos are returned from the database, these daos might have gaps in between them
   * that, from the station definition coi model viewpoint, do not actually exist. This method uses
   * sensors to determine the actual end times of the wfdisc daos and merges wfdisc daos that
   * overlap and have the same information
   *
   * @param wfdiscs
   * @param sensors
   * @return
   */
  public static List<WfdiscDao> mergeWfdiscsAndUpdateTime(
      Collection<WfdiscDao> wfdiscs, Collection<SensorDao> sensors) {

    List<WfdiscDao> wfdiscDaoList = new ArrayList<>();
    // both wfdisc and sensor's key need to match: sta+chan used
    TemporalMap<String, WfdiscDao> wfdiscsByStaChanMap =
        wfdiscs.stream()
            .collect(
                TemporalMap.collector(
                    wfdiscDao -> wfdiscDao.getStationCode() + wfdiscDao.getChannelCode(),
                    WfdiscDao::getTime));

    TemporalMap<String, SensorDao> sensorsByStaChanMap =
        sensors.stream()
            .collect(
                TemporalMap.collector(
                    sensorDao ->
                        sensorDao.getSensorKey().getStation()
                            + sensorDao.getSensorKey().getChannel(),
                    Functions.compose(SensorKey::getTime, SensorDao::getSensorKey)));

    for (String key : wfdiscsByStaChanMap.keySet()) {

      wfdiscDaoList.addAll(
          mergeWfdiscForGivenStaChan(
              wfdiscsByStaChanMap.getVersionMap(key), sensorsByStaChanMap.getVersionMap(key)));
    }

    return wfdiscDaoList;
  }

  // adjust wfdisc start and end times and merge wfdiscs for a single wfdisc sta chan pair
  private static List<WfdiscDao> mergeWfdiscForGivenStaChan(
      NavigableMap<Instant, WfdiscDao> wfdiscs, NavigableMap<Instant, SensorDao> sensors) {

    List<WfdiscDao> wfdiscDaoList = new ArrayList<>();

    WfdiscDao prev = null;

    var changeTimes = findChangeTimesDueToSensors(sensors, changeInWfdiscDueToSensors);

    for (var next : wfdiscs.values()) {

      if (prev != null && next != null) {

        var optionalEndTime =
            findPossibleChangeTimeFromSensor(changeTimes, prev.getEndTime(), next.getTime());
        if (optionalEndTime.isPresent()) {
          // if sensor change means prev ends, set prev end time to time given by sensor change, do
          // not merge prev & next
          prev.setEndTime(optionalEndTime.get());
          wfdiscDaoList.add(prev);
        } else if (prev.getVersionAttributeHash() != next.getVersionAttributeHash()) {
          // wfdiscs change so don't merge together, prev will end right before next starts
          prev.setEndTime(AssemblerUtils.getImmediatelyBeforeInstant(next.getTime()));
          wfdiscDaoList.add(prev);
        } else {
          // no changes so wfdiscs merge together
          next.setTime(prev.getTime());
        }
      }
      // skip over null values in map
      if (next != null) {
        prev = next;
      }
    }

    if (prev != null) {
      // deal with last wfdisc, if no sensor changes, we assume it goes on indefinitely
      var optionalEndTime =
          findPossibleChangeTimeFromSensor(changeTimes, prev.getEndTime(), Instant.MAX);
      if (optionalEndTime.isPresent()) {
        prev.setEndTime(optionalEndTime.get());
      } else {
        prev.setEndTime(Instant.MAX);
      }
      wfdiscDaoList.add(prev);
    }

    return wfdiscDaoList;
  }

  private static Optional<Instant> findPossibleChangeTimeFromSensor(
      NavigableSet<Instant> sensors, Instant prev, Instant next) {

    var possInstant = sensors.ceiling(prev);
    if (possInstant != null && possInstant.isBefore(next)) {
      return Optional.of(possInstant);
    }

    return Optional.empty();
  }

  // finds all times where sensors cause the wfdisc to change
  private static NavigableSet<Instant> findChangeTimesDueToSensors(
      NavigableMap<Instant, SensorDao> sensors, BiPredicate<SensorDao, SensorDao> changeOccured) {

    NavigableSet<Instant> changeTimes = new TreeSet<>();

    SensorDao prev = null;

    for (SensorDao next : sensors.values()) {
      if (changeOccured.test(prev, next)) {

        if (prev != null) {
          changeTimes.add(prev.getSensorKey().getEndTime());
        }

        if (next != null) {
          changeTimes.add(next.getSensorKey().getTime());
        }
      }

      prev = next;
    }

    if (prev != null) {
      changeTimes.add(prev.getSensorKey().getEndTime());
    }

    return changeTimes;
  }
}
