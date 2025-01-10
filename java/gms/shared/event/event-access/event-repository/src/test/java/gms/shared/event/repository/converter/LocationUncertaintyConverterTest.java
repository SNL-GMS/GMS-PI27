package gms.shared.event.repository.converter;

import static org.assertj.core.api.Assertions.assertThatNullPointerException;
import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.event.coi.Ellipse;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.ScalingFactorType;
import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.OrigerrDao;
import gms.shared.event.repository.BridgeTestFixtures;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class LocationUncertaintyConverterTest {

  private static final OrigerrDao INPUT_ORIGERR_DAO =
      new OrigerrDao.Builder()
          .withOriginId(EventTestFixtures.ORIGIN_ID)
          .withCovarianceMatrixSxx(1)
          .withCovarianceMatrixSxy(2)
          .withCovarianceMatrixSxz(3)
          .withCovarianceMatrixStx(4)
          .withCovarianceMatrixSyy(5)
          .withCovarianceMatrixSyz(6)
          .withCovarianceMatrixSty(7)
          .withCovarianceMatrixSzz(8)
          .withCovarianceMatrixStz(9)
          .withCovarianceMatrixStt(10)
          .withStandardErrorOfObservations(EventTestFixtures.LU_OED_STDERR_OBS)
          .withSemiMajorAxisOfError(EventTestFixtures.LU_OED_MAJOR_AXIS_ERR)
          .withSemiMinorAxisOfError(EventTestFixtures.LU_OED_MINOR_AXIS_ERR)
          .withStrikeOfSemiMajorAxis(EventTestFixtures.LU_OED_STRIKE_MAJOR_AXIS)
          .withDepthError(EventTestFixtures.LU_OED_DEPTH_ERR)
          .withOriginTimeError(EventTestFixtures.LU_OED_ORIGIN_TIME_ERR)
          .withConfidence(EventTestFixtures.LU_CONFIDENCE)
          .withCommentId(1)
          .withLoadDate(Instant.now())
          .build();

  private static final EventControlDao INPUT_EVENTCONTROL_DAO =
      EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
          .withEllipseSemiaxisConversionFactor(EventTestFixtures.LU_ELPSE_AXIS_CONV_FACTOR)
          .withEllipseDepthTimeConversionFactor(EventTestFixtures.LU_ELPSE_DEPTH_TIME_CONV_FACTOR)
          .build();

  @Test
  void testFromLegacyToLocationUncertaintyIllegalArguments() {
    assertThatNullPointerException()
        .isThrownBy(
            () -> LocationUncertaintyConverterUtility.fromLegacyToLocationUncertainty(null));
  }

  @Test
  void testFromLegacytoDefaultFacetedLocationUncertainty() {
    var inputEhInfo =
        BridgeTestFixtures.DEFAULT_BRIDGED_EH_INFORMATION.toBuilder()
            .setOrigerrDao(INPUT_ORIGERR_DAO)
            .setEventControlDao(INPUT_EVENTCONTROL_DAO)
            .build();
    var locationUncertainty =
        LocationUncertaintyConverterUtility.fromLegacyToLocationUncertainty(inputEhInfo);

    assertEquals(1.0, locationUncertainty.getXx().get(), "Testing LocationUncertainty xx");
    assertEquals(2.0, locationUncertainty.getXy().get(), "Testing LocationUncertainty xy");
    assertEquals(3.0, locationUncertainty.getXz().get(), "Testing LocationUncertainty xz");
    assertEquals(4.0, locationUncertainty.getXt().get(), "Testing LocationUncertainty xt");
    assertEquals(5.0, locationUncertainty.getYy().get(), "Testing LocationUncertainty yy");
    assertEquals(6.0, locationUncertainty.getYz().get(), "Testing LocationUncertainty yz");
    assertEquals(7.0, locationUncertainty.getYt().get(), "Testing LocationUncertainty yt");
    assertEquals(8.0, locationUncertainty.getZz().get(), "Testing LocationUncertainty zz");
    assertEquals(9.0, locationUncertainty.getZt().get(), "Testing LocationUncertainty zt");
    assertEquals(10.0, locationUncertainty.getTt().get(), "Testing LocationUncertainty tt");

    assertEquals(
        List.of(
            List.of(Optional.of(1.0), Optional.of(2.0), Optional.of(3.0), Optional.of(4.0)),
            List.of(Optional.of(2.0), Optional.of(5.0), Optional.of(6.0), Optional.of(7.0)),
            List.of(Optional.of(3.0), Optional.of(6.0), Optional.of(8.0), Optional.of(9.0)),
            List.of(Optional.of(4.0), Optional.of(7.0), Optional.of(9.0), Optional.of(10.0))),
        locationUncertainty.getCovarianceMatrix(),
        "Testing getCovarianceMatrix");

    assertEquals(
        Optional.of(3.14),
        locationUncertainty.getStdDevOneObservation(),
        "Testing standard deviation calculation");
    assertEquals(Set.of(), locationUncertainty.getEllipsoids(), "Testing no ellipsoids exists");

    var originErrEllipseTest =
        Ellipse.builder()
            .setScalingFactorType(ScalingFactorType.CONFIDENCE)
            .setkWeight(0.0)
            .setConfidenceLevel(EventTestFixtures.LU_CONFIDENCE)
            .setSemiMajorAxisLengthKm(EventTestFixtures.LU_OED_MAJOR_AXIS_ERR)
            .setSemiMajorAxisTrendDeg(EventTestFixtures.LU_OED_STRIKE_MAJOR_AXIS)
            .setSemiMinorAxisLengthKm(EventTestFixtures.LU_OED_MINOR_AXIS_ERR)
            .setDepthUncertaintyKm(EventTestFixtures.LU_OED_DEPTH_ERR)
            .setTimeUncertainty(Duration.ofSeconds((long) EventTestFixtures.LU_OED_ORIGIN_TIME_ERR))
            .build();

    var eventControlEllipseTest =
        Ellipse.builder()
            .setScalingFactorType(ScalingFactorType.COVERAGE)
            .setkWeight(Double.POSITIVE_INFINITY)
            .setConfidenceLevel(EventTestFixtures.LU_CONFIDENCE)
            .setSemiMajorAxisLengthKm(
                EventTestFixtures.LU_OED_MAJOR_AXIS_ERR
                    * EventTestFixtures.LU_ELPSE_AXIS_CONV_FACTOR)
            .setSemiMajorAxisTrendDeg(EventTestFixtures.LU_OED_STRIKE_MAJOR_AXIS)
            .setSemiMinorAxisLengthKm(
                EventTestFixtures.LU_OED_MINOR_AXIS_ERR
                    * EventTestFixtures.LU_ELPSE_AXIS_CONV_FACTOR)
            .setDepthUncertaintyKm(
                EventTestFixtures.LU_OED_DEPTH_ERR
                    * EventTestFixtures.LU_ELPSE_DEPTH_TIME_CONV_FACTOR)
            .setTimeUncertainty(
                Duration.ofSeconds(
                    (long)
                        (EventTestFixtures.LU_OED_ORIGIN_TIME_ERR
                            * EventTestFixtures.LU_ELPSE_DEPTH_TIME_CONV_FACTOR)))
            .build();

    assertEquals(
        Set.of(originErrEllipseTest, eventControlEllipseTest), locationUncertainty.getEllipses());
  }

  @Test
  void testNullDepthUncertainty() {
    final var daoNullDepth =
        new OrigerrDao.Builder()
            .withOriginId(EventTestFixtures.ORIGIN_ID)
            .withCovarianceMatrixSxx(1)
            .withCovarianceMatrixSxy(2)
            .withCovarianceMatrixSxz(3)
            .withCovarianceMatrixStx(4)
            .withCovarianceMatrixSyy(5)
            .withCovarianceMatrixSyz(6)
            .withCovarianceMatrixSty(7)
            .withCovarianceMatrixSzz(8)
            .withCovarianceMatrixStz(9)
            .withCovarianceMatrixStt(10)
            .withStandardErrorOfObservations(EventTestFixtures.LU_OED_STDERR_OBS)
            .withSemiMajorAxisOfError(EventTestFixtures.LU_OED_MAJOR_AXIS_ERR)
            .withSemiMinorAxisOfError(EventTestFixtures.LU_OED_MINOR_AXIS_ERR)
            .withStrikeOfSemiMajorAxis(EventTestFixtures.LU_OED_STRIKE_MAJOR_AXIS)
            .withDepthError(-1.0)
            .withOriginTimeError(EventTestFixtures.LU_OED_ORIGIN_TIME_ERR)
            .withConfidence(EventTestFixtures.LU_CONFIDENCE)
            .withCommentId(1)
            .withLoadDate(Instant.now())
            .build();

    var inputEhInfo =
        BridgeTestFixtures.DEFAULT_BRIDGED_EH_INFORMATION.toBuilder()
            .setOrigerrDao(daoNullDepth)
            .setEventControlDao(INPUT_EVENTCONTROL_DAO)
            .build();
    var locationUncertainty =
        LocationUncertaintyConverterUtility.fromLegacyToLocationUncertainty(inputEhInfo);

    var depthErrors =
        locationUncertainty.getEllipses().stream()
            .flatMap(ellipse -> ellipse.getDepthUncertaintyKm().stream())
            .toArray(Double[]::new);

    Assertions.assertArrayEquals(
        new Double[0], depthErrors, "No depthUncertainties should be present");
  }

  @Test
  void testOrigerrDaoNAValues() {
    final var DAO_ALL_NA =
        new OrigerrDao.Builder()
            .withOriginId(EventTestFixtures.ORIGIN_ID)
            .withCovarianceMatrixSxx(-1.0)
            .withCovarianceMatrixSxy(-1.0)
            .withCovarianceMatrixSxz(-1.0)
            .withCovarianceMatrixStx(-1.0)
            .withCovarianceMatrixSyy(-1.0)
            .withCovarianceMatrixSyz(-1.0)
            .withCovarianceMatrixSty(-1.0)
            .withCovarianceMatrixSzz(-1.0)
            .withCovarianceMatrixStz(-1.0)
            .withCovarianceMatrixStt(-1.0)
            .withStandardErrorOfObservations(-1.0)
            .withSemiMajorAxisOfError(-1.0)
            .withSemiMinorAxisOfError(-1.0)
            .withStrikeOfSemiMajorAxis(-1.0)
            .withDepthError(-1.0)
            .withOriginTimeError(-1.0)
            .withConfidence(EventTestFixtures.LU_CONFIDENCE)
            .withCommentId(1)
            .withLoadDate(Instant.now())
            .build();

    var inputEhInfo =
        BridgeTestFixtures.DEFAULT_BRIDGED_EH_INFORMATION.toBuilder()
            .setOrigerrDao(DAO_ALL_NA)
            .setEventControlDao(INPUT_EVENTCONTROL_DAO)
            .build();

    var locationUncertainty =
        LocationUncertaintyConverterUtility.fromLegacyToLocationUncertainty(inputEhInfo);

    locationUncertainty.getCovarianceMatrix().stream()
        .forEach(
            list -> list.stream().forEach(element -> Assertions.assertFalse(element.isPresent())));

    Assertions.assertFalse(locationUncertainty.getStdDevOneObservation().isPresent());

    locationUncertainty.getEllipses().stream()
        .forEach(
            ellipse -> {
              Assertions.assertFalse(ellipse.getDepthUncertaintyKm().isPresent());
              Assertions.assertFalse(ellipse.getSemiMajorAxisLengthKm().isPresent());
              Assertions.assertFalse(ellipse.getSemiMajorAxisTrendDeg().isPresent());
              Assertions.assertFalse(ellipse.getSemiMinorAxisLengthKm().isPresent());
              Assertions.assertFalse(ellipse.getTimeUncertainty().isPresent());
            });
  }

  @Test
  void testControlDaoNAValues() {
    final var CONTROL_DAO_ALL_NA =
        EventControlDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_EVENT_CONTROL_DAO)
            .withEllipseSemiaxisConversionFactor(-999.0)
            .withEllipseDepthTimeConversionFactor(-999.0)
            .build();

    var inputEhInfo =
        BridgeTestFixtures.DEFAULT_BRIDGED_EH_INFORMATION.toBuilder()
            .setOrigerrDao(INPUT_ORIGERR_DAO)
            .setEventControlDao(CONTROL_DAO_ALL_NA)
            .build();

    var locationUncertainty =
        LocationUncertaintyConverterUtility.fromLegacyToLocationUncertainty(inputEhInfo);

    var confidenceEllipse = (Ellipse) locationUncertainty.getEllipses().toArray()[0];
    Assertions.assertTrue(confidenceEllipse.getDepthUncertaintyKm().isPresent());
    Assertions.assertTrue(confidenceEllipse.getSemiMajorAxisLengthKm().isPresent());
    Assertions.assertTrue(confidenceEllipse.getSemiMajorAxisTrendDeg().isPresent());
    Assertions.assertTrue(confidenceEllipse.getSemiMinorAxisLengthKm().isPresent());
    Assertions.assertTrue(confidenceEllipse.getTimeUncertainty().isPresent());

    var coverageEllipse = (Ellipse) locationUncertainty.getEllipses().toArray()[1];
    Assertions.assertFalse(coverageEllipse.getDepthUncertaintyKm().isPresent());
    Assertions.assertFalse(coverageEllipse.getSemiMajorAxisLengthKm().isPresent());
    Assertions.assertTrue(coverageEllipse.getSemiMajorAxisTrendDeg().isPresent());
    Assertions.assertFalse(coverageEllipse.getSemiMinorAxisLengthKm().isPresent());
    Assertions.assertFalse(coverageEllipse.getTimeUncertainty().isPresent());
  }
}
