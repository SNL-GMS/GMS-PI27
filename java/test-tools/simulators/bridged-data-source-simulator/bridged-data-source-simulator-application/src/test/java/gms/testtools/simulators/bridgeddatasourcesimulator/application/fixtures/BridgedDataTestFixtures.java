package gms.testtools.simulators.bridgeddatasourcesimulator.application.fixtures;

import gms.shared.stationdefinition.dao.css.enums.ChannelType;
import gms.shared.stationdefinition.dao.css.enums.StaType;
import gms.testtools.simulators.bridgeddatasourceintervalsimulator.SourceInterval;
import gms.testtools.simulators.bridgeddatasourcesimulator.api.util.DataSimulatorSpec;
import gms.testtools.simulators.bridgeddatasourcestationsimulator.Site;
import gms.testtools.simulators.bridgeddatasourcestationsimulator.SiteChan;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/** Test Fixtures class for known bridged simulator data */
public final class BridgedDataTestFixtures {

  public static List<SiteChan> siteChans() {
    return List.of(
        SiteChan.builder()
            .setStationCode("STA1")
            .setChannelCode("CHAN1")
            .setOnDate(Instant.now())
            .setOffDate(Instant.now())
            .setChannelType(ChannelType.N)
            .setChannelDescription("STRING")
            .setEmplacementDepth(1)
            .setHorizontalAngle(2)
            .setVerticalAngle(3)
            .setLoadDate(Instant.now())
            .build());
  }

  public static List<Site> sites() {
    return List.of(
        Site.builder()
            .setStationCode("WAH")
            .setOnDate(Instant.now())
            .setOffDate(Instant.now())
            .setLatitude(1)
            .setLongitude(2)
            .setElevation(3)
            .setStationName("WOH")
            .setStationType(StaType.SINGLE_STATION)
            .setDegreesNorth(4)
            .setDegreesEast(5)
            .setReferenceStation("REF")
            .setLoadDate(Instant.now())
            .build());
  }

  // This spec uses the archi guidance defaults = 45 days of operational time period and 4 days
  // calib update.
  public static DataSimulatorSpec simulatorSpec() {
    return DataSimulatorSpec.builder()
        .setSeedDataStartTime(Instant.parse("2010-05-20T16:00:00.00Z"))
        .setSeedDataEndTime(Instant.parse("2010-05-20T18:00:00.00Z"))
        .setSimulationStartTime(Instant.now())
        .setOperationalTimePeriod(Duration.ofHours(1080))
        .setCalibUpdateFrequency(Duration.ofHours(96))
        .build();
  }

  public static List<SourceInterval> sourceIntervals() {
    return List.of(
        SourceInterval.getBuilder()
            .setIntervalIdentifier(1234)
            .setAuthor("Author C. Clarke")
            .setEndTime(99.0)
            .setLastModificationDate(Instant.now())
            .setLoadDate(Instant.now())
            .setName("Name Nameson")
            .setPercentAvailable(50.0)
            .setProcessEndDate(Instant.now())
            .setProcessStartDate(Instant.now())
            .setState("My State")
            .setTime(99.0)
            .setType("Type")
            .build());
  }
}
