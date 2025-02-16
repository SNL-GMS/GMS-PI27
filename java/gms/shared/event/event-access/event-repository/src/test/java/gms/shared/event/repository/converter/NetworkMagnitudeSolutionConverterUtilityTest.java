package gms.shared.event.repository.converter;

import static java.util.Collections.singleton;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.google.common.collect.ImmutableSet;
import gms.shared.event.coi.EventTestFixtures;
import gms.shared.event.coi.MagnitudeModel;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.coi.NetworkMagnitudeSolution;
import gms.shared.event.dao.NetMagDao;
import gms.shared.event.dao.StaMagDao;
import gms.shared.event.repository.BridgeTestFixtures;
import gms.shared.event.repository.BridgedEhInformation;
import gms.shared.event.repository.BridgedSdhInformation;
import gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class NetworkMagnitudeSolutionConverterUtilityTest {

  static final BridgedEhInformation defaultEhInfo =
      BridgeTestFixtures.DEFAULT_BRIDGED_EH_INFORMATION;
  static final BridgedSdhInformation defaultSdhInfo =
      BridgeTestFixtures.DEFAULT_BRIDGED_SDH_INFORMATION;

  @ParameterizedTest
  @MethodSource("fromLegacyToNetworkMagnitudeSolutionErrors")
  void testFromLegacyToNetworkMagnitudeSolutionErrors(
      BridgedEhInformation ehInfo,
      Collection<BridgedSdhInformation> sdhInfo,
      Class<Throwable> expectedExceptionClass) {

    assertThrows(
        expectedExceptionClass,
        () ->
            NetworkMagnitudeSolutionConverterUtility.fromLegacyToNetworkMagnitudeSolutions(
                ehInfo, sdhInfo));
  }

  private static Stream<Arguments> fromLegacyToNetworkMagnitudeSolutionErrors() {
    return Stream.of(
        Arguments.arguments(null, singleton(defaultSdhInfo), NullPointerException.class),
        Arguments.arguments(defaultEhInfo, null, NullPointerException.class));
  }

  @Test
  void testAssertMissingFeatureMeasurement() {
    var sdhData =
        defaultSdhInfo
            .getSignalDetectionHypothesis()
            .orElseThrow()
            .getData()
            .orElseThrow()
            .toBuilder()
            .setFeatureMeasurements(
                ImmutableSet.of(
                    SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT,
                    SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT))
            .build();
    var localSignalDetectionHypothesis =
        defaultSdhInfo.getSignalDetectionHypothesis().orElseThrow().toBuilder()
            .setData(sdhData)
            .build();

    Set<BridgedSdhInformation> sdhInfo =
        singleton(
            defaultSdhInfo.toBuilder()
                .setSignalDetectionHypothesis(localSignalDetectionHypothesis)
                .build());
    var netSet =
        NetworkMagnitudeSolutionConverterUtility.fromLegacyToNetworkMagnitudeSolutions(
            defaultEhInfo, sdhInfo);
    assertEquals(1, netSet.size());
    var netMag = new ArrayList<NetworkMagnitudeSolution>(netSet).get(0);
    var behavior = netMag.getMagnitudeBehaviors().get(0);
    assertTrue(behavior.getStationMagnitudeSolution().getMeasurement().isEmpty());
  }

  @Test
  void testEmptySdhNoNetMags() {
    var sdhInfoWithEmptySdh =
        BridgedSdhInformation.builder()
            .setArInfoDao(defaultSdhInfo.getArInfoDao().orElseThrow())
            .setAssocDao(defaultSdhInfo.getAssocDao())
            .setStaMagDaos(defaultSdhInfo.getStaMagDaos())
            .build();

    var netmagSolutions =
        NetworkMagnitudeSolutionConverterUtility.fromLegacyToNetworkMagnitudeSolutions(
            defaultEhInfo, Set.of(sdhInfoWithEmptySdh));

    netmagSolutions.forEach(
        netmagSolution -> assertTrue(netmagSolution.getMagnitudeBehaviors().isEmpty()));
  }

  @Test
  void testCreateNetworkMagnitudeSolution() {
    var sdhData =
        SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS.getData().orElseThrow().toBuilder()
            .setFeatureMeasurements(
                ImmutableSet.of(
                    SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT,
                    SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT,
                    SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT))
            .build();

    var localSignalDetectionHypothesis =
        SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS.toBuilder()
            .setData(sdhData)
            .build();

    var expectedStatMagSolution =
        EventTestFixtures.STATION_MAGNITUDE_SOLUTION.toBuilder()
            .noModelCorrection()
            .noStationCorrection()
            .setMagnitude(
                DoubleValue.from(
                    EventTestFixtures.DEFAULT_STA_MAG_DAO.getMagnitude(),
                    Optional.of(EventTestFixtures.DEFAULT_STA_MAG_DAO.getMagnitudeUncertainty()),
                    Units.UNITLESS))
            .build();

    var expectedNetMagBehavior =
        EventTestFixtures.NETWORK_MAGNITUDE_BEHAVIOR.toBuilder()
            .setWeight(1.0)
            .setStationMagnitudeSolution(expectedStatMagSolution)
            .build();

    var expectedNetMagSolution =
        EventTestFixtures.NETWORK_MAGNITUDE_SOLUTION.toBuilder()
            .setType(
                MagnitudeType.fromString(EventTestFixtures.DEFAULT_NET_MAG_DAO.getMagnitudeType()))
            .setMagnitude(
                DoubleValue.from(
                    EventTestFixtures.DEFAULT_NET_MAG_DAO.getMagnitude(),
                    Optional.of(EventTestFixtures.DEFAULT_NET_MAG_DAO.getMagnitudeUncertainty()),
                    Units.UNITLESS))
            .setMagnitudeBehaviors(List.of(expectedNetMagBehavior))
            .build();

    var actualNetMagSolutions =
        NetworkMagnitudeSolutionConverterUtility.fromLegacyToNetworkMagnitudeSolutions(
            defaultEhInfo,
            singleton(
                defaultSdhInfo.toBuilder()
                    .setSignalDetectionHypothesis(localSignalDetectionHypothesis)
                    .build()));

    assertThat(actualNetMagSolutions).containsExactly(expectedNetMagSolution);
  }

  @Test
  void testCreateNetworkMagnitudeSolutionUnknownMagModel() {

    var staMagDao =
        StaMagDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_STA_MAG_DAO)
            .withMagnitudeModel("BadMagModel")
            .build();

    var actualNetMagSolutions =
        NetworkMagnitudeSolutionConverterUtility.fromLegacyToNetworkMagnitudeSolutions(
            defaultEhInfo,
            singleton(defaultSdhInfo.toBuilder().setStaMagDaos(singleton(staMagDao)).build()));

    assertEquals(1, actualNetMagSolutions.size());
    var actualNetMagSolution = actualNetMagSolutions.iterator().next();
    assertEquals(1, actualNetMagSolution.getMagnitudeBehaviors().size());
    var actualNetMagBehavior = actualNetMagSolution.getMagnitudeBehaviors().get(0);
    assertEquals(
        MagnitudeModel.UNKNOWN, actualNetMagBehavior.getStationMagnitudeSolution().getModel());
  }

  @Test
  void testCreateNetworkMagnitudeSolutionNoNetworkMagnitudeBehaviors() {
    var testNetMagDao =
        NetMagDao.Builder.initializeFromInstance(EventTestFixtures.DEFAULT_NET_MAG_DAO)
            .withMagnitudeId(EventTestFixtures.DEFAULT_NET_MAG_DAO.getMagnitudeId() + 1L)
            .build();
    var inputEhInfo =
        defaultEhInfo.toBuilder()
            .setNetMagDaosByType(Map.of(MagnitudeType.MB, testNetMagDao))
            .build();

    var sdhData =
        SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS.getData().orElseThrow().toBuilder()
            .setFeatureMeasurements(
                ImmutableSet.of(
                    SignalDetectionTestFixtures.ARRIVAL_TIME_FEATURE_MEASUREMENT,
                    SignalDetectionTestFixtures.PHASE_FEATURE_MEASUREMENT,
                    SignalDetectionTestFixtures.AMPLITUDE_FEATURE_MEASUREMENT))
            .build();
    var localSignalDetectionHypothesis =
        SignalDetectionTestFixtures.SIGNAL_DETECTION_HYPOTHESIS.toBuilder()
            .setData(sdhData)
            .build();
    var inputSdhInfo =
        defaultSdhInfo.toBuilder()
            .setSignalDetectionHypothesis(localSignalDetectionHypothesis)
            .build();

    var expectedNetMagSolution =
        EventTestFixtures.NETWORK_MAGNITUDE_SOLUTION.toBuilder()
            .setType(
                MagnitudeType.fromString(EventTestFixtures.DEFAULT_NET_MAG_DAO.getMagnitudeType()))
            .setMagnitude(
                DoubleValue.from(
                    EventTestFixtures.DEFAULT_NET_MAG_DAO.getMagnitude(),
                    Optional.of(EventTestFixtures.DEFAULT_NET_MAG_DAO.getMagnitudeUncertainty()),
                    Units.UNITLESS))
            .setMagnitudeBehaviors(List.of())
            .build();

    var actualNetMagSolutions =
        NetworkMagnitudeSolutionConverterUtility.fromLegacyToNetworkMagnitudeSolutions(
            inputEhInfo, singleton(inputSdhInfo));
    assertThat(actualNetMagSolutions).containsExactly(expectedNetMagSolution);
  }
}
