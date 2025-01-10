package gms.shared.signaldetection.converter.measurementvalues;

import com.google.common.math.DoubleMath;
import gms.shared.common.coi.types.PhaseType;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.dao.css.AssocDao;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class PhaseTypeMeasurementValueConverter
    implements MeasurementValueConverter<PhaseTypeMeasurementValue> {
  public static final double NA_EPSILON = 1e-10;
  private static final Logger LOGGER =
      LoggerFactory.getLogger(PhaseTypeMeasurementValueConverter.class);
  private static final String PHASE_TYPE_MESSAGE = "Cannot map phase type: {}";

  private PhaseTypeMeasurementValueConverter() {
    // Hide implicit public constructor
  }

  public static PhaseTypeMeasurementValueConverter create() {
    return new PhaseTypeMeasurementValueConverter();
  }

  @Override
  public Optional<PhaseTypeMeasurementValue> convert(
      MeasurementValueSpec<PhaseTypeMeasurementValue> spec) {
    var arrivalDao = spec.getArrivalDao();
    var assocDaoOptional = spec.getAssocDao();

    // if AssocDao exists use this to create measurement value else use ArrivalDao
    return assocDaoOptional
        .map(PhaseTypeMeasurementValueConverter::createPhaseTypeMeasurementValue)
        .orElseGet(() -> createPhaseTypeMeasurementValue(arrivalDao));
  }

  /**
   * Create {@link PhaseTypeMeasurementValue} from the {@link ArrivalDao}
   *
   * @param arrivalDao {@link ArrivalDao} input
   * @return optional of {@link PhaseTypeMeasurementValue}
   */
  private static Optional<PhaseTypeMeasurementValue> createPhaseTypeMeasurementValue(
      ArrivalDao arrivalDao) {
    try {
      return Optional.of(
          PhaseTypeMeasurementValue.fromFeatureMeasurement(
              PhaseType.valueOfLabel(arrivalDao.getPhase()),
              Optional.empty(),
              arrivalDao.getArrivalKey().getTime()));
    } catch (IllegalArgumentException ex) {
      LOGGER.info(PHASE_TYPE_MESSAGE, arrivalDao.getPhase());
      return Optional.of(
          PhaseTypeMeasurementValue.fromFeatureMeasurement(
              PhaseType.UNKNOWN, Optional.empty(), arrivalDao.getArrivalKey().getTime()));
    }
  }

  /**
   * Create {@link PhaseTypeMeasurementValue} from the {@link AssocDao}
   *
   * @param assocDao {@link AssocDao} input
   * @return optional of {@link PhaseTypeMeasurementValue}
   */
  private static Optional<PhaseTypeMeasurementValue> createPhaseTypeMeasurementValue(
      AssocDao assocDao) {

    Optional<Double> assocBeliefVal =
        DoubleMath.fuzzyEquals(assocDao.getBelief(), -1.0, NA_EPSILON)
            ? Optional.empty()
            : Optional.of(assocDao.getBelief());

    try {
      // check whether or not we support the given phase
      var phaseTypeVal = PhaseType.valueOfLabel(assocDao.getPhase());
      if (phaseTypeVal == null) {
        LOGGER.info(PHASE_TYPE_MESSAGE, assocDao.getPhase());
        return Optional.empty();
      }
      return Optional.of(
          PhaseTypeMeasurementValue.fromFeaturePrediction(phaseTypeVal, assocBeliefVal));
    } catch (IllegalArgumentException ex) {
      LOGGER.info(PHASE_TYPE_MESSAGE, assocDao.getPhase());
      return Optional.of(
          PhaseTypeMeasurementValue.fromFeaturePrediction(PhaseType.UNKNOWN, assocBeliefVal));
    }
  }
}
