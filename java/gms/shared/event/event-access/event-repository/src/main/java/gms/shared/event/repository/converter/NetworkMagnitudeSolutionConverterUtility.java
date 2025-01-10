package gms.shared.event.repository.converter;

import static com.google.common.base.Preconditions.checkNotNull;
import static java.util.stream.Collectors.toSet;

import gms.shared.common.coi.types.PhaseType;
import gms.shared.event.coi.MagnitudeModel;
import gms.shared.event.coi.MagnitudeType;
import gms.shared.event.coi.NetworkMagnitudeBehavior;
import gms.shared.event.coi.NetworkMagnitudeSolution;
import gms.shared.event.coi.StationMagnitudeSolution;
import gms.shared.event.dao.NetMagDao;
import gms.shared.event.dao.StaMagDao;
import gms.shared.event.repository.BridgedEhInformation;
import gms.shared.event.repository.BridgedSdhInformation;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.types.FeatureMeasurementTypes;
import gms.shared.signaldetection.dao.css.enums.DefiningFlag;
import gms.shared.stationdefinition.coi.utils.DoubleValue;
import gms.shared.stationdefinition.coi.utils.Units;
import java.util.Collection;
import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Utility class the help create {@link NetworkMagnitudeSolution} objects */
public final class NetworkMagnitudeSolutionConverterUtility {

  private static final Logger LOGGER =
      LoggerFactory.getLogger(NetworkMagnitudeSolutionConverterUtility.class);

  private NetworkMagnitudeSolutionConverterUtility() {
    // Hide implicit public constructor
  }

  /**
   * NetworkMagnitudeSolution is a measure of the size of an {@link gms.shared.event.coi.Event}
   * associated via a {@link gms.shared.event.coi.LocationSolution}. Returns {@link
   * NetworkMagnitudeSolution} for an {@link gms.shared.event.coi.EventHypothesis}
   *
   * @param ehInfo Bundled and correlated Event Hypothesis DAO and COI information used to generate
   *     multiple NetworkMagnitudeSolutions
   * @param sdhInfo A collection of bundled and correlated Signal Detection Hypothesis information
   *     used to generate multiple StationMagnitudeSolutions
   * @return {@link NetworkMagnitudeSolution} for an {@link gms.shared.event.coi.EventHypothesis}
   */
  public static Set<NetworkMagnitudeSolution> fromLegacyToNetworkMagnitudeSolutions(
      BridgedEhInformation ehInfo, Collection<BridgedSdhInformation> sdhInfo) {
    checkNotNull(ehInfo, "BridgedEhInformation cannot be null");
    checkNotNull(sdhInfo, "BridgedSdhInformation cannot be null");

    LOGGER.debug(
        "fromLegacyToNetworkMagnitudeSolutions input ehInfo [{}], " + "sdhInfo [{}]",
        ehInfo,
        sdhInfo);

    return ehInfo
        .netMagDaosByType()
        .map(
            netMagDaoByType ->
                fromLegacyToNetworkMagnitudeSolution(
                    netMagDaoByType.getKey(), netMagDaoByType.getValue(), sdhInfo))
        .collect(toSet());
  }

  private static NetworkMagnitudeSolution fromLegacyToNetworkMagnitudeSolution(
      MagnitudeType netMagType, NetMagDao netMagDao, Collection<BridgedSdhInformation> sdhInfo) {

    LOGGER.debug(
        "fromLegacyToNetworkMagnitudeSolution input NetMagType [{}], NetMagDao [{}], "
            + "sdhInfo [{}]",
        netMagType,
        netMagDao,
        sdhInfo);

    Set<NetworkMagnitudeBehavior> netMagBehaviors =
        sdhInfo.stream()
            .flatMap(
                info -> fromLegacyToNetworkMagnitudeBehaviors(netMagDao, info, netMagType).stream())
            .collect(toSet());

    LOGGER.debug(
        "fromLegacyToNetworkMagnitudeSolution input NetMagDao.getMagnitudeType [{}], "
            + "As String [{}]",
        netMagDao.getMagnitudeType(),
        MagnitudeType.fromString(netMagDao.getMagnitudeType()));

    return NetworkMagnitudeSolution.builder()
        .setType(netMagType)
        .setMagnitude(
            DoubleValue.from(
                netMagDao.getMagnitude(),
                Optional.of(netMagDao.getMagnitudeUncertainty()),
                Units.UNITLESS))
        .setMagnitudeBehaviors(netMagBehaviors)
        .build();
  }

  private static Set<NetworkMagnitudeBehavior> fromLegacyToNetworkMagnitudeBehaviors(
      NetMagDao netMagDao, BridgedSdhInformation sdhInfo, MagnitudeType netMagType) {

    LOGGER.debug(
        "fromLegacyToNetworkMagnitudeBehaviors input NetMagDao [{}], "
            + "signalDetectionHypothesis [{}]",
        netMagDao,
        sdhInfo);

    LOGGER.debug(
        "fromLegacyToNetworkMagnitudeBehaviors input NetMagDao [{}], "
            + "signalDetectionHypothesis [{}]",
        netMagDao,
        sdhInfo);

    if (sdhInfo.getSignalDetectionHypothesis().isEmpty()) {
      LOGGER.info(
          "Cannot create NetworkMagnitudeBehaviors for SignalDetectionHypothesis with arid [{}],"
              + " SignalDetectionHypothesis is missing",
          sdhInfo.getAssocDao().getId().getArrivalId());
      return new HashSet<>();
    }

    Predicate<StaMagDao> idsMatchNetMag =
        staMagDao ->
            (staMagDao.getMagnitudeId() == netMagDao.getMagnitudeId())
                && (staMagDao.getOriginId() == netMagDao.getOriginId());

    var matchingStaMagDaos =
        sdhInfo.staMagDaos().filter(idsMatchNetMag).collect(Collectors.toSet());

    if (matchingStaMagDaos.isEmpty()) {
      LOGGER.warn(
          "No StaMagDao records matched NetMagDao OriginId {} "
              + "for creation of NetworkMagnitudeBehaviors",
          netMagDao.getOriginId());
    }

    return matchingStaMagDaos.stream()
        .map(
            staMagDao ->
                NetworkMagnitudeBehavior.builder()
                    .setDefining(DefiningFlag.isDefining(staMagDao.getMagnitudeDefining()))
                    .setResidual(staMagDao.getMagnitudeResidual())
                    .setWeight(1.0)
                    .setStationMagnitudeSolution(
                        getStationMagnitudeSolution(
                            staMagDao, sdhInfo.getSignalDetectionHypothesis().get(), netMagType))
                    .build())
        .collect(toSet());
  }

  private static StationMagnitudeSolution getStationMagnitudeSolution(
      StaMagDao staMagDao,
      SignalDetectionHypothesis signalDetectionHypothesis,
      MagnitudeType netMagType) {

    LOGGER.debug(
        "getStationMagnitudeSolution input StaMagDao [{}], "
            + "SignalDetectionHypothesis signalDetectionHypothesis [{}]",
        staMagDao,
        signalDetectionHypothesis);

    LOGGER.debug(
        "getStationMagnitudeSolution input StaMagDao [{}], "
            + "SignalDetectionHypothesis signalDetectionHypothesis [{}]",
        staMagDao,
        signalDetectionHypothesis);

    var sdhData =
        signalDetectionHypothesis
            .getData()
            .orElseThrow(
                () -> new IllegalStateException("SignalDetectionHypothesis must contain data!"));
    var featureMeasure = sdhData.getFeatureMeasurement(FeatureMeasurementTypes.AMPLITUDE_A5_OVER_2);

    MagnitudeModel magModel;
    try {
      magModel = MagnitudeModel.fromString(staMagDao.getMagnitudeModel());
      if (Objects.isNull(magModel)) {
        magModel = MagnitudeModel.UNKNOWN;
      }
    } catch (IllegalArgumentException e) {
      LOGGER.warn("Caught {}, setting MagnitudeModel to UNKNOWN", e.getClass(), e);
      magModel = MagnitudeModel.UNKNOWN;
    }

    return StationMagnitudeSolution.builder()
        .setType(netMagType)
        .setModel(magModel)
        .setStation(signalDetectionHypothesis.getStation())
        .setPhase(PhaseType.valueOfLabel(staMagDao.getPhaseType()))
        .setMagnitude(
            DoubleValue.from(
                staMagDao.getMagnitude(),
                Optional.of(staMagDao.getMagnitudeUncertainty()),
                Units.UNITLESS))
        .noModelCorrection()
        .noStationCorrection()
        .setMeasurement(featureMeasure.orElse(null))
        .build();
  }
}
