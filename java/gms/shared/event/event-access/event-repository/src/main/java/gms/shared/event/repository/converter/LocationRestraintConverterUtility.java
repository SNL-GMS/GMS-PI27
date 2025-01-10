package gms.shared.event.repository.converter;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkNotNull;
import static java.lang.String.format;
import static java.util.stream.Collectors.toSet;

import com.google.common.math.DoubleMath;
import gms.shared.event.coi.DepthRestraintReason;
import gms.shared.event.coi.LocationRestraint;
import gms.shared.event.coi.LocationSolution;
import gms.shared.event.coi.RestraintType;
import gms.shared.event.coi.type.DepthMethod;
import gms.shared.event.dao.EventControlDao;
import gms.shared.event.dao.OriginDao;
import gms.shared.event.repository.BridgedEhInformation;
import gms.shared.event.repository.BridgedSdhInformation;
import gms.shared.signaldetection.dao.css.AssocDao;
import gms.shared.signaldetection.dao.css.enums.DefiningFlag;
import gms.shared.utilities.bridge.database.converter.NegativeNaInstantToDoubleConverter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;

/** Utility class to help create {@link LocationRestraint} objects */
public final class LocationRestraintConverterUtility {
  public static final double DEPTH_EPSILON = 1e-10;
  private static final NegativeNaInstantToDoubleConverter instantToDoubleConverter =
      new NegativeNaInstantToDoubleConverter();
  private static final Set<String> PREFERRED_LOCATION_SET = Set.of("F", "S", "R");

  private LocationRestraintConverterUtility() {
    // Hide implicit public constructor
  }

  /**
   * Returns the {@link LocationRestraint} object for use in creating a {@link LocationSolution}
   *
   * @param ehInfo Bridged EventHypothesis Information
   * @param sdhInfo Bridged SignalDetectionHypothesis Information
   * @return The newly created {@link LocationRestraint} COI object
   */
  public static LocationRestraint fromLegacyToLocationRestraint(
      BridgedEhInformation ehInfo, Collection<BridgedSdhInformation> sdhInfo) {
    checkNotNull(ehInfo, "BridgedEhInformation cannot be null");
    checkNotNull(sdhInfo, "BridgedSdhInformation cannot be null");
    checkArgument(!sdhInfo.isEmpty(), "Must provide at least one BridgedSdhInformation");

    var originDao = ehInfo.getOriginDao();
    var eventControlDao = ehInfo.getEventControlDao();
    var assocDaos = sdhInfo.stream().map(BridgedSdhInformation::getAssocDao).collect(toSet());

    return eventControlDao
        .map(ecDao -> buildRestraintWithEventControl(originDao, ecDao, assocDaos))
        .orElseGet(() -> buildRestraintFromOrigin(originDao, assocDaos));
  }

  private static Optional<DepthRestraintReason> handleRestraintType(
      OriginDao originDao, Set<AssocDao> assocDaos, RestraintType depthRestraint) {
    var depthRestraintReason = Optional.<DepthRestraintReason>empty();
    if (RestraintType.FIXED == depthRestraint) {
      depthRestraintReason = Optional.of(DepthRestraintReason.OTHER);
      if (DoubleMath.fuzzyEquals(originDao.getDepth(), 0.0, DEPTH_EPSILON)) {
        depthRestraintReason = Optional.of(DepthRestraintReason.FIXED_AT_SURFACE);
      } else if (DepthMethod.A == originDao.getDepthMethod()) {
        depthRestraintReason = Optional.of(DepthRestraintReason.FIXED_AT_STANDARD_DEPTH);
      } else if (DepthMethod.G == originDao.getDepthMethod()) {
        if (!assocDaos.stream()
            .filter(assoc -> (assoc.getId().getOriginId() == originDao.getOriginId()))
            .filter(assoc -> ("pP".equals(assoc.getPhase()) || "sP".equals(assoc.getPhase())))
            .filter(
                assoc ->
                    (!DefiningFlag.isDefining(assoc.getTimeDefining())
                        && !DefiningFlag.isDefining(assoc.getAzimuthDefining())
                        && !DefiningFlag.isDefining(assoc.getSlownessDefining())))
            .collect(toSet())
            .isEmpty()) {
          depthRestraintReason =
              Optional.of(DepthRestraintReason.FIXED_AT_DEPTH_FOUND_USING_DEPTH_PHASE_MEASUREMENTS);
        } else {
          depthRestraintReason = Optional.of(DepthRestraintReason.FIXED_BY_ANALYST);
        }
      } else {
        // No other types. Uses initialized default
      }
    }

    return depthRestraintReason;
  }

  private static LocationRestraint buildRestraintWithEventControl(
      OriginDao originDao, EventControlDao eventControlDao, Set<AssocDao> assocDaos) {
    checkArgument(
        PREFERRED_LOCATION_SET.contains(eventControlDao.getPreferredLocation()),
        format(
            "Invalid EventControl PreferredLocation for LocationRestraint. Expected:[F, S, R]"
                + " Actual:[%s]",
            eventControlDao.getPreferredLocation()));

    final LocationRestraint locationRestraint;
    if ("F".equals(eventControlDao.getPreferredLocation())) {
      locationRestraint = LocationRestraint.free();
    } else if ("S".equals(eventControlDao.getPreferredLocation())) {
      locationRestraint = LocationRestraint.surface();
    } else {
      var depthRestraint = RestraintType.UNRESTRAINED;
      Double depthRestraintKm = null;
      var positionRestraint = RestraintType.UNRESTRAINED;
      Double latRestraintDeg = null;
      Double longRestraintDeg = null;
      var timeRestraintType = RestraintType.UNRESTRAINED;
      Instant timeRestraint = null;

      if (eventControlDao.getConstrainDepth()) {
        depthRestraint = RestraintType.FIXED;
        depthRestraintKm = originDao.getDepth();
      }

      if (eventControlDao.getConstrainLatLon()) {
        positionRestraint = RestraintType.FIXED;
        latRestraintDeg = originDao.getLatitude();
        longRestraintDeg = originDao.getLongitude();
      }

      if (eventControlDao.getConstrainOriginTime()) {
        timeRestraintType = RestraintType.FIXED;
        timeRestraint = instantToDoubleConverter.convertToEntityAttribute(originDao.getEpoch());
      }

      var depthRestraintReason = handleRestraintType(originDao, assocDaos, depthRestraint);

      var lrBuilder =
          LocationRestraint.builder()
              .setDepthRestraintType(depthRestraint)
              .setDepthRestraintKm(depthRestraintKm)
              .setPositionRestraintType(positionRestraint)
              .setLatitudeRestraintDegrees(latRestraintDeg)
              .setLongitudeRestraintDegrees(longRestraintDeg)
              .setTimeRestraintType(timeRestraintType)
              .setTimeRestraint(timeRestraint)
              .setDepthRestraintReason(depthRestraintReason.orElse(null));

      locationRestraint = lrBuilder.build();
    }
    return locationRestraint;
  }

  private static LocationRestraint buildRestraintFromOrigin(
      OriginDao originDao, Set<AssocDao> assocDaos) {

    checkNotNull(originDao, "originDao cannot be null");
    checkNotNull(assocDaos, "assocDaos cannot be null");

    final LocationRestraint locationRestraint;

    var depthRestraint = RestraintType.UNRESTRAINED;
    Double depthRestraintKm = null;
    final var positionRestraint = RestraintType.UNRESTRAINED;
    Double latRestraintDeg = null;
    Double longRestraintDeg = null;
    final var timeRestraintType = RestraintType.UNRESTRAINED;
    Instant timeRestraint = null;

    if (originDao.getDepthMethod() == DepthMethod.A
        || originDao.getDepthMethod() == DepthMethod.R
        || originDao.getDepthMethod() == DepthMethod.G) {
      depthRestraint = RestraintType.FIXED;
      depthRestraintKm = originDao.getDepth();
    }

    var depthRestraintReason =
        switch (originDao.getDepthMethod()) {
          case A -> DepthRestraintReason.FIXED_AT_STANDARD_DEPTH;
          case R -> BigDecimal.valueOf(originDao.getDepth()).intValue() == 0
              ? DepthRestraintReason.FIXED_AT_SURFACE
              : DepthRestraintReason.OTHER;
          case G -> {
            if (!assocDaos.stream()
                .filter(assoc -> (assoc.getId().getOriginId() == originDao.getOriginId()))
                .filter(assoc -> ("pP".equals(assoc.getPhase()) || "sP".equals(assoc.getPhase())))
                .filter(
                    assoc ->
                        (!DefiningFlag.isDefining(assoc.getTimeDefining())
                            && !DefiningFlag.isDefining(assoc.getAzimuthDefining())
                            && !DefiningFlag.isDefining(assoc.getSlownessDefining())))
                .collect(toSet())
                .isEmpty()) {
              yield DepthRestraintReason.FIXED_AT_DEPTH_FOUND_USING_DEPTH_PHASE_MEASUREMENTS;
            } else {
              yield DepthRestraintReason.FIXED_BY_ANALYST;
            }
          }
          default -> null;
        };

    var lrBuilder =
        LocationRestraint.builder()
            .setDepthRestraintType(depthRestraint)
            .setDepthRestraintKm(depthRestraintKm)
            .setPositionRestraintType(positionRestraint)
            .setLatitudeRestraintDegrees(latRestraintDeg)
            .setLongitudeRestraintDegrees(longRestraintDeg)
            .setTimeRestraintType(timeRestraintType)
            .setTimeRestraint(timeRestraint)
            .setDepthRestraintReason(depthRestraintReason);

    locationRestraint = lrBuilder.build();
    return locationRestraint;
  }
}
