package gms.shared.event.repository.converter;

import static java.util.Collections.singleton;
import static java.util.stream.Collectors.toSet;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;

import gms.shared.event.coi.DepthRestraintReason;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.type.DepthMethod;
import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.LatLonDepthTimeKey;
import gms.shared.event.dao.OriginDao;
import gms.shared.event.repository.BridgeTestFixtures;
import gms.shared.event.repository.BridgedEhInformation;
import gms.shared.event.repository.BridgedSdhInformation;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.signaldetection.dao.css.enums.DefiningFlag;
import gms.shared.utilities.bridge.database.converter.NegativeNaInstantToDoubleConverter;
import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class LocationRestraintConverterUtilityTest {

  private static final NegativeNaInstantToDoubleConverter instantToDoubleConverter =
      new NegativeNaInstantToDoubleConverter();
  private static final double ORIGIN_DEPTH = 314.159;
  private static final double LATITUDE_VALUE = 1;
  private static final double LONGITUDE_VALUE = 5;
  private static final double LATLONG_TIMEVALUE = 1629600001.0000;

  static final BridgedEhInformation defaultEhInfo =
      BridgeTestFixtures.DEFAULT_BRIDGED_EH_INFORMATION;
  static final BridgedSdhInformation defaultSdhInfo =
      BridgeTestFixtures.DEFAULT_BRIDGED_SDH_INFORMATION;

  @ParameterizedTest
  @MethodSource("buildLocationRestraintPreconditions")
  void testBuildLocationRestraintErrors(
      BridgedEhInformation ehInfo,
      Collection<BridgedSdhInformation> sdhInfo,
      Class<Throwable> expectedExceptionClass) {
    assertThrows(
        expectedExceptionClass,
        () -> LocationRestraintConverterUtility.fromLegacyToLocationRestraint(ehInfo, sdhInfo));
  }

  private static Stream<Arguments> buildLocationRestraintPreconditions() {
    var invalidEventControlWrongLocDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withPreferredLocation("-")
            .build();

    return Stream.of(
        arguments(null, singleton(defaultSdhInfo), NullPointerException.class),
        arguments(defaultEhInfo, null, NullPointerException.class),
        arguments(
            defaultEhInfo.toBuilder().setEventControlDao(invalidEventControlWrongLocDao).build(),
            singleton(defaultSdhInfo),
            IllegalArgumentException.class));
  }

  @Test
  void testLocationRestraintFreeSolution() {
    var localEventControlDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withPreferredLocation("F")
            .build();

    var actualLocationRestraint =
        LocationRestraintConverterUtility.fromLegacyToLocationRestraint(
            defaultEhInfo.toBuilder().setEventControlDao(localEventControlDao).build(),
            singleton(defaultSdhInfo));
    assertEquals(
        EventTestFixtures.LOCATION_RESTRAINT_FREE_SOLUTION,
        actualLocationRestraint,
        "Invalid Location Restraint returned");
  }

  /** Tests the LocationRestraint use case when EventControlDao PreferredLocation is set to "S" */
  @Test
  void testLocationRestraintSurfaceSolution() {
    var localEventControlDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withPreferredLocation("S")
            .build();

    var actualLocationRestraint =
        LocationRestraintConverterUtility.fromLegacyToLocationRestraint(
            defaultEhInfo.toBuilder().setEventControlDao(localEventControlDao).build(),
            singleton(defaultSdhInfo));
    assertEquals(
        EventTestFixtures.LOCATION_RESTRAINT_SURFACE_SOLUTION,
        actualLocationRestraint,
        "Invalid Location Restraint returned");
  }

  @Test
  void testLocationRestraintRestraintSolutionAllConstraints() {
    var origDepth = 0.0;
    var localOriginDao =
        OriginDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .withLatLonDepthTimeKey(
                new LatLonDepthTimeKey.Builder()
                    .withLatitude(LATITUDE_VALUE)
                    .withLongitude(LONGITUDE_VALUE)
                    .withDepth(origDepth) // under test
                    .withTime(LATLONG_TIMEVALUE)
                    .build())
            //      .withDepthMethod()//under test
            .build();

    var localEventControlDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withPreferredLocation("R")
            .withConstrainDepth(true) // under test
            .withConstrainLatLon(true) // under test
            .withConstrainOriginTime(true) // under test
            .build();

    var inputEhInfo =
        defaultEhInfo.toBuilder()
            .setOriginDao(localOriginDao)
            .setEventControlDao(localEventControlDao)
            .build();

    var expectedLocationRestraint =
        LocationRestraint.builder()
            .setDepthRestraintType(RestraintType.FIXED)
            .setDepthRestraintReason(DepthRestraintReason.FIXED_AT_SURFACE)
            .setDepthRestraintKm(origDepth)
            .setPositionRestraintType(RestraintType.FIXED)
            .setLatitudeRestraintDegrees(LATITUDE_VALUE)
            .setLongitudeRestraintDegrees(LONGITUDE_VALUE)
            .setTimeRestraintType(RestraintType.FIXED)
            .setTimeRestraint(instantToDoubleConverter.convertToEntityAttribute(LATLONG_TIMEVALUE))
            .build();

    var actualLocationRestraint =
        LocationRestraintConverterUtility.fromLegacyToLocationRestraint(
            inputEhInfo, singleton(defaultSdhInfo));
    assertEquals(
        expectedLocationRestraint, actualLocationRestraint, "Invalid Location Restraint returned");
  }

  @Test
  void testLocationRestraintRestraintSolutionUnrestrainedDepth() {
    var localOriginDao =
        OriginDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .withLatLonDepthTimeKey(
                new LatLonDepthTimeKey.Builder()
                    .withLatitude(LATITUDE_VALUE)
                    .withLongitude(LONGITUDE_VALUE)
                    .withDepth(0.0) // under test
                    .withTime(LATLONG_TIMEVALUE)
                    .build())
            .build();

    var localEventControlDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withPreferredLocation("R")
            .withConstrainDepth(false) // under test
            .withConstrainLatLon(false) // under test
            .withConstrainOriginTime(false) // under test
            .build();

    var inputEhInfo =
        defaultEhInfo.toBuilder()
            .setOriginDao(localOriginDao)
            .setEventControlDao(localEventControlDao)
            .build();

    var actualLocationRestraint =
        LocationRestraintConverterUtility.fromLegacyToLocationRestraint(
            inputEhInfo, singleton(defaultSdhInfo));
    assertEquals(
        LocationRestraint.free(), actualLocationRestraint, "Invalid Location Restraint returned");
  }

  @Test
  void testLocationRestraintRestraintSolutionZeroDepth() {

    var localOriginDao =
        OriginDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .withLatLonDepthTimeKey(
                new LatLonDepthTimeKey.Builder()
                    .withLatitude(LATITUDE_VALUE)
                    .withLongitude(LONGITUDE_VALUE)
                    .withDepth(0.0) // under test
                    .withTime(LATLONG_TIMEVALUE)
                    .build())
            .build();

    var localEventControlDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withPreferredLocation("R")
            .withConstrainDepth(true)
            .withConstrainLatLon(false)
            .withConstrainOriginTime(false)
            .build();

    var expectedLocationRestraint =
        LocationRestraint.builder()
            .setDepthRestraintType(RestraintType.FIXED)
            .setDepthRestraintReason(DepthRestraintReason.FIXED_AT_SURFACE)
            .setDepthRestraintKm(0.0)
            .setPositionRestraintType(RestraintType.UNRESTRAINED)
            .noLatitudeRestraintDegrees()
            .noLongitudeRestraintDegrees()
            .setTimeRestraintType(RestraintType.UNRESTRAINED)
            .noTimeRestraint()
            .build();

    var inputEhInfo =
        defaultEhInfo.toBuilder()
            .setOriginDao(localOriginDao)
            .setEventControlDao(localEventControlDao)
            .build();

    var actualLocationRestraint =
        LocationRestraintConverterUtility.fromLegacyToLocationRestraint(
            inputEhInfo, singleton(defaultSdhInfo));
    assertEquals(
        expectedLocationRestraint, actualLocationRestraint, "Invalid Location Restraint returned");
  }

  @Test
  void testLocationRestraintRestraintSolutionStdDepth() {
    var localOriginDao =
        OriginDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .withLatLonDepthTimeKey(
                new LatLonDepthTimeKey.Builder()
                    .withLatitude(LATITUDE_VALUE)
                    .withLongitude(LONGITUDE_VALUE)
                    .withDepth(ORIGIN_DEPTH) // under test
                    .withTime(LATLONG_TIMEVALUE)
                    .build())
            .withDepthMethod(DepthMethod.A) // under test
            .build();

    var localEventControlDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withPreferredLocation("R")
            .withConstrainDepth(true) // under test
            .withConstrainLatLon(false) // under test
            .withConstrainOriginTime(false) // under test
            .build();

    var expectedLocationRestraint =
        LocationRestraint.free().toBuilder()
            .setDepthRestraintType(RestraintType.FIXED)
            .setDepthRestraintReason(DepthRestraintReason.FIXED_AT_STANDARD_DEPTH)
            .setDepthRestraintKm(ORIGIN_DEPTH)
            .build();

    var inputEhInfo =
        defaultEhInfo.toBuilder()
            .setOriginDao(localOriginDao)
            .setEventControlDao(localEventControlDao)
            .build();

    var actualLocationRestraint =
        LocationRestraintConverterUtility.fromLegacyToLocationRestraint(
            inputEhInfo, singleton(defaultSdhInfo));
    assertEquals(
        expectedLocationRestraint, actualLocationRestraint, "Invalid Location Restraint returned");
  }

  private static Stream<Arguments> testLocationRestraintRestraintSolutionAnalystArguments() {
    return Stream.of(
        arguments(
            "pP",
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DepthRestraintReason.FIXED_AT_DEPTH_FOUND_USING_DEPTH_PHASE_MEASUREMENTS),
        arguments(
            "pP",
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "pP",
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "pP",
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "pP",
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "sP",
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DepthRestraintReason.FIXED_AT_DEPTH_FOUND_USING_DEPTH_PHASE_MEASUREMENTS),
        arguments(
            "sP",
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "sP",
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "sP",
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "sP",
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "P",
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "P",
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "P",
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "P",
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_NON_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST),
        arguments(
            "P",
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DefiningFlag.DEFAULT_DEFINING,
            DepthRestraintReason.FIXED_BY_ANALYST));
  }

  @ParameterizedTest
  @MethodSource("testLocationRestraintRestraintSolutionAnalystArguments")
  void testLocationRestraintRestraintSolutionAnalystCoverages(
      String phase,
      DefiningFlag timeDefining,
      DefiningFlag azimuthDefining,
      DefiningFlag slownessDefining,
      DepthRestraintReason depthRestraintReason) {
    var localOriginDao =
        OriginDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .withLatLonDepthTimeKey(
                new LatLonDepthTimeKey.Builder()
                    .withLatitude(LATITUDE_VALUE)
                    .withLongitude(LONGITUDE_VALUE)
                    .withDepth(ORIGIN_DEPTH)
                    .withTime(LATLONG_TIMEVALUE)
                    .build())
            .withDepthMethod(DepthMethod.G) // under test
            .build();

    var localEventControlDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withPreferredLocation("R")
            .withConstrainDepth(true) // under test
            .withConstrainLatLon(false) // under test
            .withConstrainOriginTime(false) // under test
            .build();

    var assocDao1 =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO)
            .withPhase(phase)
            .withTimeDefining(timeDefining)
            .withAzimuthDefining(azimuthDefining)
            .withSlownessDefining(slownessDefining)
            .build();
    var assocDao2 =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO).build();

    var expectedLocationRestraint =
        LocationRestraint.free().toBuilder()
            .setDepthRestraintType(RestraintType.FIXED)
            .setDepthRestraintReason(depthRestraintReason)
            .setDepthRestraintKm(ORIGIN_DEPTH)
            .build();

    var inputEhInfo =
        defaultEhInfo.toBuilder()
            .setOriginDao(localOriginDao)
            .setEventControlDao(localEventControlDao)
            .build();

    var inputSdhInfo =
        Stream.of(assocDao1, assocDao2)
            .map(assocDao -> defaultSdhInfo.toBuilder().setAssocDao(assocDao).build())
            .collect(toSet());

    var actualLocationRestraint =
        LocationRestraintConverterUtility.fromLegacyToLocationRestraint(inputEhInfo, inputSdhInfo);
    assertEquals(
        expectedLocationRestraint, actualLocationRestraint, "Invalid Location Restraint returned");
  }

  @Test
  void testLocationRestraintRestraintSolutionAnalystDiffOriginId() {
    var sdhInfo = BridgeTestFixtures.DEFAULT_BRIDGED_SDH_INFORMATION;
    var diffSdhInfo =
        BridgeTestFixtures.withIds(
            sdhInfo, EventTestFixtures.ARRIVAL_ID + 1, EventTestFixtures.ORIGIN_ID + 1);

    var localOriginDao =
        OriginDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .withLatLonDepthTimeKey(
                new LatLonDepthTimeKey.Builder()
                    .withLatitude(LATITUDE_VALUE)
                    .withLongitude(LONGITUDE_VALUE)
                    .withDepth(ORIGIN_DEPTH)
                    .withTime(LATLONG_TIMEVALUE)
                    .build())
            .withDepthMethod(DepthMethod.G) // under test
            .build();

    var localEventControlDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withPreferredLocation("R")
            .withConstrainDepth(true) // under test
            .withConstrainLatLon(false) // under test
            .withConstrainOriginTime(false) // under test
            .build();

    var inputEhInfo =
        defaultEhInfo.toBuilder()
            .setOriginDao(localOriginDao)
            .setEventControlDao(localEventControlDao)
            .build();

    var localAssocDao =
        AssocDao.Builder.initializeFromInstance(diffSdhInfo.getAssocDao())
            .withPhase("pP")
            .withTimeDefining(DefiningFlag.NON_OVERRIDABLE_NON_DEFINING)
            .withAzimuthDefining(DefiningFlag.NON_OVERRIDABLE_NON_DEFINING)
            .withSlownessDefining(DefiningFlag.NON_OVERRIDABLE_NON_DEFINING)
            .build();

    var inputSdhInfo = Set.of(sdhInfo, diffSdhInfo.toBuilder().setAssocDao(localAssocDao).build());

    var expectedLocationRestraint =
        LocationRestraint.free().toBuilder()
            .setDepthRestraintType(RestraintType.FIXED)
            .setDepthRestraintReason(DepthRestraintReason.FIXED_BY_ANALYST)
            .setDepthRestraintKm(ORIGIN_DEPTH)
            .build();

    var actualLocationRestraint =
        LocationRestraintConverterUtility.fromLegacyToLocationRestraint(inputEhInfo, inputSdhInfo);
    assertEquals(
        expectedLocationRestraint, actualLocationRestraint, "Invalid Location Restraint returned");
  }

  @Test
  void testLocationRestraintRestraintSolutionOther() {

    var localOriginDao =
        OriginDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .withLatLonDepthTimeKey(
                new LatLonDepthTimeKey.Builder()
                    .withLatitude(LATITUDE_VALUE)
                    .withLongitude(LONGITUDE_VALUE)
                    .withDepth(ORIGIN_DEPTH) // under test
                    .withTime(LATLONG_TIMEVALUE)
                    .build())
            .withDepthMethod(DepthMethod.UNKNOWN) // under test
            .build();

    var localEventControlDao =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withPreferredLocation("R")
            //      .withConstrainDepth(false)//under test
            .withConstrainLatLon(false) // under test
            .withConstrainOriginTime(false) // under test
            .build();

    var assocDao1 =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO).build();
    var assocDao2 =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO).build();

    var expectedLocationRestraint =
        LocationRestraint.free().toBuilder()
            .setDepthRestraintType(RestraintType.FIXED)
            .setDepthRestraintReason(DepthRestraintReason.OTHER)
            .setDepthRestraintKm(ORIGIN_DEPTH)
            .build();

    var inputEhInfo =
        defaultEhInfo.toBuilder()
            .setOriginDao(localOriginDao)
            .setEventControlDao(localEventControlDao)
            .build();

    var inputSdhInfo =
        Stream.of(assocDao1, assocDao2)
            .map(assocDao -> defaultSdhInfo.toBuilder().setAssocDao(assocDao).build())
            .collect(toSet());

    var actualLocationRestraint =
        LocationRestraintConverterUtility.fromLegacyToLocationRestraint(inputEhInfo, inputSdhInfo);
    assertEquals(
        expectedLocationRestraint, actualLocationRestraint, "Invalid Location Restraint returned");
  }

  private static Stream<Arguments> testBuildLocationRestraintFromOrigin() {
    final double nonzeroDepth = 314.159;
    final double zeroDepth = 0.0;

    var assocDao1 =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO).build();
    var assocDao2 =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO).build();
    var assocDao3 =
        AssocDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ASSOC_DAO)
            .withPhase("pP")
            .withTimeDefining(DefiningFlag.DEFAULT_NON_DEFINING)
            .withAzimuthDefining(DefiningFlag.DEFAULT_NON_DEFINING)
            .withSlownessDefining(DefiningFlag.DEFAULT_NON_DEFINING)
            .build();

    final var inputSdhInfoFixedAnalyst =
        Stream.of(assocDao1, assocDao2)
            .map(assocDao -> defaultSdhInfo.toBuilder().setAssocDao(assocDao).build())
            .collect(toSet());

    final var inputSdhInfoFixedDepth =
        Stream.of(assocDao1, assocDao3)
            .map(assocDao -> defaultSdhInfo.toBuilder().setAssocDao(assocDao).build())
            .collect(toSet());

    return Stream.of(
        arguments(
            DepthMethod.A,
            RestraintType.FIXED,
            nonzeroDepth,
            inputSdhInfoFixedAnalyst,
            DepthRestraintReason.FIXED_AT_STANDARD_DEPTH),
        arguments(
            DepthMethod.R,
            RestraintType.FIXED,
            nonzeroDepth,
            inputSdhInfoFixedAnalyst,
            DepthRestraintReason.OTHER),
        arguments(
            DepthMethod.R,
            RestraintType.FIXED,
            zeroDepth,
            inputSdhInfoFixedAnalyst,
            DepthRestraintReason.FIXED_AT_SURFACE),
        arguments(
            DepthMethod.G,
            RestraintType.FIXED,
            nonzeroDepth,
            inputSdhInfoFixedDepth,
            DepthRestraintReason.FIXED_AT_DEPTH_FOUND_USING_DEPTH_PHASE_MEASUREMENTS),
        arguments(
            DepthMethod.G,
            RestraintType.FIXED,
            nonzeroDepth,
            inputSdhInfoFixedAnalyst,
            DepthRestraintReason.FIXED_BY_ANALYST));
  }

  @ParameterizedTest
  @MethodSource("testBuildLocationRestraintFromOrigin")
  void testBuildLocationRestraintFromOriginCoverages(
      DepthMethod depthMethod,
      RestraintType restraintType,
      double depth,
      Set<BridgedSdhInformation> inputSdhInfo,
      DepthRestraintReason depthRestraintReason) {

    var originDao =
        OriginDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_ORIGIN_DAO)
            .withLatLonDepthTimeKey(
                new LatLonDepthTimeKey.Builder()
                    .withLatitude(LATITUDE_VALUE)
                    .withLongitude(LONGITUDE_VALUE)
                    .withDepth(depth)
                    .withTime(LATLONG_TIMEVALUE)
                    .build())
            .withDepthMethod(depthMethod)
            .build();

    var inputEhInfo =
        BridgedEhInformation.builder()
            .setOriginDao(originDao)
            .setOrigerrDao(EventTestFixtures.DEFAULT_ORIGERR_DAO)
            .setNetMagDaosByType(Map.of(MagnitudeType.MB, EventTestFixtures.DEFAULT_NET_MAG_DAO))
            .setParentEventHypotheses(Set.of())
            .build();

    var actualLocationRestraint =
        LocationRestraintConverterUtility.fromLegacyToLocationRestraint(inputEhInfo, inputSdhInfo);

    var expectedLocationRestraint =
        LocationRestraint.builder()
            .setDepthRestraintType(restraintType)
            .setDepthRestraintKm(depth)
            .setDepthRestraintReason(depthRestraintReason)
            .setPositionRestraintType(RestraintType.UNRESTRAINED)
            .noLatitudeRestraintDegrees()
            .noLongitudeRestraintDegrees()
            .setTimeRestraintType(RestraintType.UNRESTRAINED)
            .noTimeRestraint()
            .build();

    assertEquals(
        expectedLocationRestraint, actualLocationRestraint, "Invalid LocationRestraint returned");
  }
}
